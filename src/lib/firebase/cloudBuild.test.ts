/// <reference types="node" />
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const projectRoot = process.cwd();
async function configuration(
  directory: string,
  mode: string,
  command: 'build' | 'serve' = 'build',
  overrides: Record<string, string> = {},
) {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (key.startsWith('VITE_FIREBASE_')) delete environment[key];
  }
  const vite = pathToFileURL(join(projectRoot, 'node_modules/vite/dist/node/index.js')).href;
  const script = `
    import { loadConfigFromFile } from ${JSON.stringify(vite)};
    try {
      const result = await loadConfigFromFile(
        ${JSON.stringify({ command, mode })},
        ${JSON.stringify(join(projectRoot, 'vite.config.ts'))},
        ${JSON.stringify(projectRoot)}, 'silent');
      if (!result) throw new Error('Vite configuration was not loaded.');
      const { define, build } = result.config;
      process.stdout.write(JSON.stringify({ define, build: { outDir: build?.outDir } }));
    } catch (error) {
      process.stderr.write(error instanceof Error ? error.message : 'Configuration failed.');
      process.exitCode = 1;
    }
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: directory,
    env: { ...environment, ...overrides },
    encoding: 'utf8',
    timeout: 15000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
  return JSON.parse(result.stdout) as {
    define?: Record<string, string>;
    build: { outDir?: string };
  };
}
const cloudEnvironment = [
  'VITE_FIREBASE_MODE=cloud',
  'VITE_FIREBASE_API_KEY=synthetic-build-key',
  'VITE_FIREBASE_AUTH_DOMAIN=capstone-build-test.firebaseapp.com',
  'VITE_FIREBASE_PROJECT_ID=capstone-build-test',
  'VITE_FIREBASE_APP_ID=synthetic-build-app',
].join('\n');

describe('explicit cloud release build', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'studyflow-cloud-build-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    const target = resolve(directory);
    if (
      dirname(target) !== resolve(tmpdir()) ||
      !basename(target).startsWith('studyflow-cloud-build-')
    )
      throw new Error('Refusing to remove a path outside the test fixture directory.');
    rmSync(target, { recursive: true, force: true });
  });

  it('requires complete cloud configuration before producing a release', async () => {
    await expect(configuration(directory, 'cloud')).rejects.toThrow(/cloud|VITE_FIREBASE/i);
    writeFileSync(join(directory, '.env.cloud.local'), 'VITE_FIREBASE_MODE=cloud\n');
    await expect(configuration(directory, 'cloud')).rejects.toThrow('VITE_FIREBASE_PROJECT_ID');
  });

  it('loads the mode-specific file and isolates cloud output from ordinary checks', async () => {
    writeFileSync(join(directory, '.env.local'), 'VITE_FIREBASE_MODE=disabled\n');
    writeFileSync(join(directory, '.env.cloud.local'), cloudEnvironment);
    const cloud = await configuration(directory, 'cloud');
    const ordinary = await configuration(directory, 'production');
    expect(cloud.build?.outDir).toBe('dist-cloud');
    expect(ordinary.build?.outDir ?? 'dist').toBe('dist');
  });

  it('rejects a process override that would turn a cloud release into emulator mode', async () => {
    writeFileSync(join(directory, '.env.cloud.local'), cloudEnvironment);
    await expect(
      configuration(directory, 'cloud', 'build', { VITE_FIREBASE_MODE: 'emulator' }),
    ).rejects.toThrow(/requires.*cloud/i);
  });

  it('rejects the local demo project as a cloud release target', async () => {
    writeFileSync(
      join(directory, '.env.cloud.local'),
      cloudEnvironment.replace('PROJECT_ID=capstone-build-test', 'PROJECT_ID=demo-studyflow'),
    );
    await expect(configuration(directory, 'cloud')).rejects.toThrow(/demo-studyflow/);
  });

  it('preserves forced local modes even when valid cloud settings are present', async () => {
    writeFileSync(join(directory, '.env.local'), cloudEnvironment);
    const emulator = await configuration(directory, 'emulator', 'serve');
    const layout = await configuration(directory, 'layout', 'serve');
    expect(emulator.define?.['import.meta.env.VITE_FIREBASE_MODE']).toBe('"emulator"');
    expect(layout.define?.['import.meta.env.VITE_FIREBASE_MODE']).toBe('"disabled"');
  });

  it('uses the isolated cloud output for Hosting and the explicit cloud commands', () => {
    const hosting = JSON.parse(readFileSync(join(projectRoot, 'firebase.json'), 'utf8'));
    const { scripts } = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    expect(hosting.hosting.public).toBe('dist-cloud');
    expect(scripts['build:cloud']).toBe('tsc -b && vite build --mode cloud');
    expect(scripts['preview:cloud']).toContain('vite preview --mode cloud');
  });
});
