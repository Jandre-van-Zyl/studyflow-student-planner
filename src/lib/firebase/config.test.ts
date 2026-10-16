import { describe, expect, it } from 'vitest';
import { readFirebaseConfiguration } from './config';

describe('Firebase configuration boundaries', () => {
  it('starts disabled without configuration or credentials', () => {
    expect(readFirebaseConfiguration({})).toEqual({ mode: 'disabled' });
  });

  it('requires an explicit supported mode rather than silently using cloud services', () => {
    expect(() => readFirebaseConfiguration({ VITE_FIREBASE_MODE: 'production' })).toThrow(
      'must be',
    );
  });

  it('isolates emulator mode from accidentally supplied cloud project values', () => {
    const result = readFirebaseConfiguration({
      VITE_FIREBASE_MODE: 'emulator',
      VITE_FIREBASE_PROJECT_ID: 'real-project',
      VITE_FIREBASE_API_KEY: 'real-key',
    });
    expect(result.mode).toBe('emulator');
    if (result.mode !== 'disabled') {
      expect(result.options.projectId).toBe('demo-studyflow');
      expect(result.options.apiKey).toBe('demo-api-key');
    }
  });

  it('rejects incomplete or whitespace-only cloud configuration with actionable field names', () => {
    expect(() =>
      readFirebaseConfiguration({ VITE_FIREBASE_MODE: 'cloud', VITE_FIREBASE_API_KEY: ' ' }),
    ).toThrow('VITE_FIREBASE_PROJECT_ID');
  });

  it('accepts explicit complete cloud configuration without creating a Firebase app', () => {
    expect(
      readFirebaseConfiguration({
        VITE_FIREBASE_MODE: 'cloud',
        VITE_FIREBASE_API_KEY: ' key ',
        VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_APP_ID: 'test-app',
      }),
    ).toEqual({
      mode: 'cloud',
      options: {
        apiKey: 'key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        appId: 'test-app',
      },
    });
  });
});
