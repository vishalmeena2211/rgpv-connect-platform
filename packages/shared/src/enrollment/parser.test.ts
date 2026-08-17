import { describe, expect, it } from 'vitest';

import {
  expandEnrollmentRange,
  isValidEnrollment,
  normaliseEnrollment,
  parseEnrollment,
} from './parser';

describe('normaliseEnrollment', () => {
  it('strips spaces/hyphens and uppercases', () => {
    expect(normaliseEnrollment(' 0751-bt16 012 ')).toBe('0751BT16012');
  });
});

describe('parseEnrollment', () => {
  it('parses a canonical enrollment number', () => {
    const parsed = parseEnrollment('0751BT16012', 2024);
    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      raw: '0751BT16012',
      collegeCode: '0751',
      branchCode: 'BT',
      branchName: 'Biotechnology',
      admissionYear: 2016,
      graduatingBatch: 2020,
      serial: '012',
      isKnownBranch: true,
    });
  });

  it('tolerates lowercase and spacing', () => {
    expect(parseEnrollment('0151 cs 21 001', 2024)?.branchCode).toBe('CS');
  });

  it('keeps the raw code for an unknown branch', () => {
    const parsed = parseEnrollment('0101ZZ20005', 2024);
    expect(parsed?.isKnownBranch).toBe(false);
    expect(parsed?.branchName).toBe('ZZ');
  });

  it('resolves a future-looking 2-digit year to the previous century', () => {
    // In 2024, "99" should mean 1999, not 2099.
    expect(parseEnrollment('0101CS99001', 2024)?.admissionYear).toBe(1999);
  });

  it('returns null for malformed input', () => {
    expect(parseEnrollment('not-an-enrollment')).toBeNull();
    expect(parseEnrollment('0751BT16')).toBeNull();
  });
});

describe('isValidEnrollment', () => {
  it('accepts valid and rejects invalid formats', () => {
    expect(isValidEnrollment('0751BT16012')).toBe(true);
    expect(isValidEnrollment('123')).toBe(false);
  });
});

describe('expandEnrollmentRange', () => {
  it('expands an inclusive serial range', () => {
    expect(expandEnrollmentRange('0751BT16001', '0751BT16003')).toEqual([
      '0751BT16001',
      '0751BT16002',
      '0751BT16003',
    ]);
  });

  it('returns empty when prefixes differ', () => {
    expect(expandEnrollmentRange('0751BT16001', '0751CS16003')).toEqual([]);
  });

  it('returns empty for a reversed range', () => {
    expect(expandEnrollmentRange('0751BT16005', '0751BT16001')).toEqual([]);
  });

  it('enforces the max-count safety cap', () => {
    expect(expandEnrollmentRange('0751BT16001', '0751BT16999', 100)).toEqual([]);
  });
});
