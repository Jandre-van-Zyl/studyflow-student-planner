import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['firebase/tests/**/*.rules.test.ts'],
    testTimeout: 15_000,
  },
});
