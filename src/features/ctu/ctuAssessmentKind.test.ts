import { describe, expect, it } from 'vitest';
import { isCtuAssignment } from './ctuAssessmentKind';

describe('CTU FA assignment identification', () => {
  it.each(['KM-05_FA1 MDB622', 'SPM622 KM04 FA1', 'FA 2', 'fa-1', 'FA_2', 'FA'])(
    'recognizes the separate FA label in %s',
    (title) => {
      expect(isCtuAssignment(title)).toBe(true);
    },
  );
  it.each(['SPM622 KM04 SA', 'FACTOR test', 'SOFA1', 'FA1A', 'Portfolio'])(
    'does not infer Assignment from %s',
    (title) => {
      expect(isCtuAssignment(title)).toBe(false);
    },
  );
});
