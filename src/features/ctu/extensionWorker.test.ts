import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ORIGIN, CTU_CHANNEL } from './portalContract';

type Reply = (value: unknown) => void;
type Handler = (
  value: unknown,
  sender: { id: string; url: string; tab: { id: number; url: string } },
  reply: Reply,
) => boolean;
const portal = 'https://ctu.campusmanager.co.za/portal/';
const nav = '<nav><a href="student-home.php">Home</a></nav>';
const pages: Record<string, string> = {
  'student-home.php': `${nav}Hello Synthetic Student!<table><tr><th>Module</th><th>Assessment</th><th>Due</th></tr><tr><td>KM-03 Database</td><td>FA1</td><td>2026-10-21</td></tr></table>`,
  'student-uploads.php': `${nav}<div>KM-03 Database</div><table><tr><th>Assessment</th><th>Due</th><th>Upload</th></tr><tr><td>FA1</td><td>2026/10/21 23:30</td><td><input type="file" id="file_123"></td></tr></table>`,
  'student-courses.php': `${nav}<table><tr><th>Module name</th><th>Facilitator</th></tr><tr><td>KM-03 Database</td><td>Not collected</td></tr></table>`,
  'notice-board.php': `${nav}<table><tr><td>Timetable <a href="../notice/timetable.pdf">Download document</a></td></tr></table>`,
  'student-resources.php': `${nav}<a href="javascript:downloadresource('123');">Resource title</a>`,
};
let handler: Handler;
let tabUrl: string;
let failCourse = false;
let blankPolls = 0;
let omitAppUrl = false;
let courseActivated = false;
const sender = {
  id: 'synthetic-extension',
  url: APP_ORIGIN + '/ctu-sync',
  tab: { id: 13, url: APP_ORIGIN + '/ctu-sync' },
};
const request = () => ({ channel: CTU_CHANNEL, type: 'collect', requestId: crypto.randomUUID() });
const tabs = {
  create: vi.fn(async () => ({ id: 99, url: portal + 'student-home.php', status: 'complete' })),
  get: vi.fn(async (id: number) => {
    if (id === 13 && omitAppUrl) return { id, url: '', status: 'complete' };
    if (id === 99 && blankPolls-- > 0) return { id, url: 'about:blank', status: 'loading' };
    return { id, url: id === 13 ? sender.url : tabUrl, status: 'complete' };
  }),
  update: vi.fn(async (_id: number, options: { url?: string }) => {
    if (options.url) tabUrl = options.url;
    return { id: 99, url: tabUrl, status: 'complete' };
  }),
  remove: vi.fn(async () => {}),
};
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  tabUrl = portal + 'student-home.php';
  failCourse = false;
  blankPolls = 0;
  omitAppUrl = false;
  courseActivated = false;
  vi.stubGlobal('chrome', {
    runtime: {
      id: sender.id,
      onMessage: {
        addListener: (value: Handler) => {
          handler = value;
        },
      },
    },
    tabs,
    scripting: {
      executeScript: async (options: {
        func: (doc?: Document, href?: string) => unknown;
        world?: string;
      }) => {
        const name = new URL(tabUrl).pathname.split('/').at(-1)!;
        if (failCourse && name === 'student-courses.php') throw new Error('Changed course page');
        if (name === 'student-courses.php' && options.func.name === 'openCourseModules') {
          courseActivated = options.world === 'MAIN';
          return [{ result: undefined }];
        }
        document.body.innerHTML =
          name === 'student-courses.php' && !courseActivated ? nav : (pages[name] ?? '');
        return [{ result: await options.func(document, tabUrl) }];
      },
    },
  });
  await import('../../../extensions/ctu-sync/background');
});
describe('packaged CTU worker orchestration with synthetic browser API', () => {
  it('uses the verified content-script sender when Chrome omits an unpermitted tab URL', async () => {
    omitAppUrl = true;
    const response = await new Promise<unknown>((resolve) => handler(request(), sender, resolve));
    expect(response).toMatchObject({ type: 'result' });
  });
  it('waits for the permitted destination when a newly created tab is still blank', async () => {
    blankPolls = 1;
    const response = await new Promise<unknown>((resolve) => handler(request(), sender, resolve));
    expect(response).toMatchObject({ type: 'result' });
  });
  it('rejects foreign extension senders and non-allowlisted app routes before opening CTU', () => {
    expect(handler(request(), { ...sender, id: 'foreign-extension' }, vi.fn())).toBe(false);
    expect(handler(request(), { ...sender, url: APP_ORIGIN + '/account' }, vi.fn())).toBe(false);
    expect(tabs.create).not.toHaveBeenCalled();
  });
  it('automatically reads all five supported pages and returns one merged preview', async () => {
    const result = (await new Promise<unknown>((resolve) =>
      expect(handler(request(), sender, resolve)).toBe(true),
    )) as {
      type: string;
      snapshot: { assessments: { due: string }[]; portalName: string; modules: unknown[] };
    };
    expect(result.type).toBe('result');
    expect(result.snapshot.portalName).toBe('Synthetic Student');
    expect(result.snapshot.assessments).toHaveLength(1);
    expect(result.snapshot.assessments[0]?.due).toBe('2026-10-21T23:30');
    expect(result.snapshot.modules).toHaveLength(1);
    expect(tabs.update.mock.calls.filter((call) => call[1].url).map((call) => call[1].url)).toEqual(
      Object.keys(pages).map((name) => portal + name),
    );
    expect(tabs.remove).toHaveBeenCalledWith(99);
  });
  it('cancels a pending collection and never returns records from it', async () => {
    const message = request();
    const response = new Promise<unknown>((resolve) => handler(message, sender, resolve));
    handler({ ...message, type: 'cancel' }, sender, vi.fn());
    expect(await response).toMatchObject({ type: 'error', error: 'Collection cancelled.' });
    expect(tabs.remove).toHaveBeenCalledWith(99);
  });
  it('reports partial collection instead of claiming a changed course page succeeded', async () => {
    failCourse = true;
    const response = (await new Promise<unknown>((resolve) =>
      handler(request(), sender, resolve),
    )) as { snapshot: { coverage: string[]; warnings: string[] } };
    expect(response.snapshot.coverage).toContain('courses: not collected');
    expect(response.snapshot.warnings.join(' ')).toMatch(/student-courses.php: not collected/);
  });
});
