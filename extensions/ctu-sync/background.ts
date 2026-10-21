import { capturePortalDocument } from '../../src/features/ctu/portalCapture';
import {
  combinePortalPages,
  CTU_CHANNEL,
  validAppSender,
  validRequestId,
  type PortalPageCapture,
} from '../../src/features/ctu/portalContract';
import { chromeApi as chrome } from './chromeApi';

const active = new Map<number, { requestId: string; cancelled: boolean }>();
const pause = () => new Promise((resolve) => setTimeout(resolve, 300));
const portal = 'https://ctu.campusmanager.co.za/portal/';
async function load(tabId: number, path: string, current: () => boolean, login = false) {
  await chrome.tabs.update(tabId, { url: portal + path });
  const end = Date.now() + (login ? 90_000 : 20_000);
  let asked = false;
  while (Date.now() < end && current()) {
    const tab = await chrome.tabs.get(tabId);
    // New Opera tabs can expose a blank/unknown URL before the requested navigation commits.
    // Wait within the existing deadline; never inject until the exact permitted page is complete.
    if (
      !tab.url ||
      tab.url === 'about:blank' ||
      (tab.status === 'loading' && !tab.url.startsWith(portal))
    ) {
      await pause();
      continue;
    }
    if (!tab.url?.startsWith(portal)) throw new Error('The portal left the permitted CTU site.');
    const url = new URL(tab.url);
    if (url.pathname.endsWith('/student-login.php') && !asked) {
      await chrome.tabs.update(tabId, { active: true });
      asked = true;
      if (!login) throw new Error('Your CTU session expired. Connect again and sign in.');
    }
    if (url.href === portal + path && tab.status === 'complete') return;
    await pause();
  }
  throw new Error(
    current() ? 'CTU did not finish loading. Sign in and try again.' : 'Collection cancelled.',
  );
}
async function openCourseModules() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].filter((link) =>
    /^javascript:viewdetail\('\d+'\);?$/.test(link.getAttribute('href') ?? ''),
  );
  // Avoid guessing between multiple current courses. The UI reports incomplete modules instead.
  if (links.length !== 1) return;
  links[0]!.click();
  const end = Date.now() + 10_000;
  while (Date.now() < end) {
    const loaded = [...document.querySelectorAll('table')].some(
      (table) =>
        [...(table.querySelector('tr')?.querySelectorAll('th,td') ?? [])]
          .map((cell) => cell.textContent?.trim())
          .join('|') === 'Module name|Facilitator',
    );
    if (loaded) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
async function collect(appTabId: number, requestId: string) {
  const job = { requestId, cancelled: false };
  active.set(appTabId, job);
  const current = () => active.get(appTabId) === job && !job.cancelled;
  let tabId: number | undefined;
  try {
    const tab = await chrome.tabs.create({ url: portal + 'student-home.php', active: false });
    tabId = tab.id;
    if (tabId === undefined) throw new Error('Cannot open CTU.');
    await load(tabId, 'student-home.php', current, true);
    const pages: PortalPageCapture[] = [];
    const failed: string[] = [];
    const paths = [
      'student-home.php',
      'student-uploads.php',
      'student-courses.php',
      'notice-board.php',
      'student-resources.php',
    ];
    for (const path of paths) {
      if (!current()) throw new Error('Collection cancelled.');
      const app = await chrome.tabs.get(appTabId);
      // Chrome can omit this field without a broad tabs/localhost host grant.
      // The browser-supplied sender URL was already validated. The bridge and app
      // independently discard replies after navigation, sign-out or request change.
      if (app.url && !validAppSender(app.url))
        throw new Error('Return to the StudyFlow connection page and retry.');
      try {
        if (path !== paths[0]) await load(tabId, path, current);
        if (path === 'student-courses.php')
          await chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            func: openCourseModules,
          });
        const [capture] = await chrome.scripting.executeScript({
          target: { tabId },
          func: capturePortalDocument,
        });
        if (!capture?.result) throw new Error('No supported data.');
        pages.push(capture.result);
      } catch {
        if (!current()) throw new Error('Collection cancelled.');
        failed.push(`${path}: not collected; page unavailable or its format changed.`);
      }
    }
    if (!pages.some((page) => page.kind === 'home' && page.portalName))
      throw new Error('Could not verify the signed-in CTU page.');
    if (!current()) throw new Error('Collection cancelled.');
    const snapshot = combinePortalPages(pages);
    snapshot.warnings.push(...failed);
    return { channel: CTU_CHANNEL, type: 'result', requestId, snapshot };
  } finally {
    if (active.get(appTabId) === job) active.delete(appTabId);
    if (tabId !== undefined) await chrome.tabs.remove(tabId).catch(() => {});
  }
}
chrome.runtime.onMessage.addListener((value, sender, reply) => {
  if (
    sender.id !== chrome.runtime.id ||
    !validAppSender(sender.url ?? sender.tab?.url ?? '') ||
    sender.tab?.id === undefined ||
    !value ||
    typeof value !== 'object'
  )
    return false;
  const message = value as Record<string, unknown>;
  if (message.channel !== CTU_CHANNEL || !validRequestId(message.requestId)) return false;
  const tabId = sender.tab.id;
  if (message.type === 'cancel') {
    const job = active.get(tabId);
    if (job?.requestId === message.requestId) job.cancelled = true;
    reply({ cancelled: true });
    return false;
  }
  if (message.type !== 'collect') return false;
  if (active.has(tabId)) {
    reply({
      channel: CTU_CHANNEL,
      type: 'error',
      requestId: message.requestId,
      error: 'A collection is already running. Cancel it or wait.',
    });
    return false;
  }
  const requestId = message.requestId;
  void collect(tabId, requestId)
    .then(reply)
    .catch((error: unknown) =>
      reply({
        channel: CTU_CHANNEL,
        type: 'error',
        requestId,
        error: error instanceof Error ? error.message : 'CTU collection failed. Try again.',
      }),
    );
  return true;
});
