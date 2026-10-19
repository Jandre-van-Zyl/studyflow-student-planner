import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { loadConfigFromFile } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const projectRoot = process.cwd();
async function configuration(mode: string, command: 'build' | 'serve' = 'build') {
  const result = await loadConfigFromFile(
    { command, mode },
    join(projectRoot, 'vite.config.ts'),
    projectRoot,
    'silent',
  );
  if (!result) throw new Error('The project Vite configuration could not be loaded.');
  return result.config;
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
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
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
    await expect(configuration('cloud')).rejects.toThrow(/cloud|VITE_FIREBASE/i);
    writeFileSync(join(directory, '.env.cloud.local'), 'VITE_FIREBASE_MODE=cloud\n');
    await expect(configuration('cloud')).rejects.toThrow('VITE_FIREBASE_PROJECT_ID');
  });

  it('loads the mode-specific file and isolates cloud output from ordinary checks', async () => {
    writeFileSync(join(directory, '.env.local'), 'VITE_FIREBASE_MODE=disabled\n');
    writeFileSync(join(directory, '.env.cloud.local'), cloudEnvironment);
    const cloud = await configuration('cloud');
    const ordinary = await configuration('production');
    expect(cloud.build?.outDir).toBe('dist-cloud');
    expect(ordinary.build?.outDir ?? 'dist').toBe('dist');
  });

  it('rejects a process override that would turn a cloud release into emulator mode', async () => {
    writeFileSync(join(directory, '.env.cloud.local'), cloudEnvironment);
    vi.stubEnv('VITE_FIREBASE_MODE', 'emulator');
    await expect(configuration('cloud')).rejects.toThrow(/requires.*cloud/i);
  });

  it('rejects the local demo project as a cloud release target', async () => {
    writeFileSync(
      join(directory, '.env.cloud.local'),
      cloudEnvironment.replace('PROJECT_ID=capstone-build-test', 'PROJECT_ID=demo-studyflow'),
    );
    await expect(configuration('cloud')).rejects.toThrow(/demo-studyflow/);
  });

  it('preserves forced local modes even when valid cloud settings are present', async () => {
    writeFileSync(join(directory, '.env.local'), cloudEnvironment);
    const emulator = await configuration('emulator', 'serve');
    const layout = await configuration('layout', 'serve');
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
