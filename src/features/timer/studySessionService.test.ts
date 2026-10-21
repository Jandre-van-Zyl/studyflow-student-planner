import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { parseStudySession } from './studySessionService';
describe('recorded study contract', () => {
  const value = {
    blockId: 'block-a',
    seconds: 60,
    startedAt: Timestamp.fromMillis(0),
    createdAt: Timestamp.fromMillis(60000),
  };
  it('parses an exact private session', () => {
    expect(parseStudySession('session-a', value)).toEqual({
      id: 'session-a',
      blockId: 'block-a',
      seconds: 60,
    });
  });
  it.each([0, 10801, 1.5, NaN])('rejects invalid recorded seconds %s', (seconds) => {
    expect(() => parseStudySession('a', { ...value, seconds })).toThrow();
  });
  it('rejects extra fields and foreign paths', () => {
    expect(() => parseStudySession('a', { ...value, secret: 'x' })).toThrow();
    expect(() => parseStudySession('a', { ...value, blockId: '../other' })).toThrow();
  });
});
