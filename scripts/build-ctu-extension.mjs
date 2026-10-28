import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';

const firefox = process.argv.includes('--firefox');
const outDir = resolve(firefox ? 'extension-dist/ctu-sync-firefox' : 'extension-dist/ctu-sync');
await mkdir(outDir, { recursive: true });
for (const [entry, format, name] of [
  ['background.ts', firefox ? 'iife' : 'es', 'background.js'],
  ['appBridge.ts', 'iife', 'app-bridge.js'],
]) {
  await build({
    configFile: false,
    publicDir: false,
    build: {
      outDir,
      emptyOutDir: false,
      target: 'es2022',
      minify: false,
      lib: {
        entry: resolve('extensions/ctu-sync', entry),
        formats: [format],
        name: 'StudyFlowCtuBridge',
        fileName: () => name,
      },
    },
  });
}
await writeFile(
  resolve(outDir, 'manifest.json'),
  JSON.stringify(
    {
      manifest_version: 3,
      name: 'StudyFlow CTU Sync',
      version: '0.1.5',
      description:
        'Reads CTU only when Connect is clicked. StudyFlow saves the collected information to your private planner account.',
      permissions: ['scripting'],
      host_permissions: ['https://ctu.campusmanager.co.za/*'],
      background: firefox
        ? { scripts: ['background.js'] }
        : { service_worker: 'background.js', type: 'module' },
      content_scripts: [
        { matches: ['http://127.0.0.1:4173/*'], js: ['app-bridge.js'], run_at: 'document_idle' },
      ],
      content_security_policy: { extension_pages: "script-src 'self'; object-src 'none'" },
    },
    null,
    2,
  ) + '\n',
);
console.log('Reviewed local extension output:', outDir);
