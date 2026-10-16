import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no layout/scroll implementation; real scrolling is checked in the browser.
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

afterEach(cleanup);
