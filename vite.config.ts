import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
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
    rolldownOptions: {
      output: {
        // Firebase component registration depends on module initialization order.
        strictExecutionOrder: true,
        codeSplitting: {
          minSize: 20_000,
          groups: [{ name: 'firebase', test: /node_modules[\\/]@firebase[\\/]/, maxSize: 350_000 }],
        },
      },
    },
  },
}));
