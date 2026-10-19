import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { readFirebaseConfiguration } from './src/lib/firebase/config.ts';

export default defineConfig(({ mode }) => {
  if (mode === 'cloud') {
    const configuration = readFirebaseConfiguration(loadEnv(mode, process.cwd(), 'VITE_'));
    if (configuration.mode !== 'cloud')
      throw new Error('A cloud release requires VITE_FIREBASE_MODE=cloud in .env.cloud.local.');
    if (configuration.options.projectId === 'demo-studyflow')
      throw new Error('A cloud release cannot use the local demo-studyflow project.');
  }
  return {
    plugins: [react(), tailwindcss()],
    define:
      mode === 'emulator' || mode === 'layout'
        ? {
            'import.meta.env.VITE_FIREBASE_MODE': JSON.stringify(
              mode === 'emulator' ? 'emulator' : 'disabled',
            ),
          }
        : {},
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: {
      outDir: mode === 'cloud' ? 'dist-cloud' : 'dist',
      rolldownOptions: {
        output: {
          // Firebase component registration depends on module initialization order.
          strictExecutionOrder: true,
          codeSplitting: {
            minSize: 20_000,
            groups: [
              { name: 'firebase', test: /node_modules[\\/]@firebase[\\/]/, maxSize: 350_000 },
            ],
          },
        },
      },
    },
  };
});
