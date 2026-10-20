import { describe, expect, it } from 'vitest';

import { resolveResultStatus, semesterResultSchema } from './result';

const passed = [{ grade: 'B+' }, { grade: 'A+' }];

describe('resolveResultStatus', () => {
  it('keeps a status the worker already read', () => {
    expect(resolveResultStatus({ status: 'FAIL', resultDescription: 'PASS', subjects: passed })).toBe('FAIL');
  });

  it('reads pass or fail from RGPV\'s result description', () => {
    expect(resolveResultStatus({ status: 'UNKNOWN', resultDescription: 'PASS', subjects: [] })).toBe('PASS');
    expect(resolveResultStatus({ status: 'UNKNOWN', resultDescription: 'FAIL IN CS401', subjects: [] })).toBe('FAIL');
    expect(resolveResultStatus({ status: 'UNKNOWN', resultDescription: 'Result Withheld', subjects: [] })).toBe('WITHHELD');
  });

  it('falls back to the grades', () => {
    expect(resolveResultStatus({ status: 'UNKNOWN', subjects: passed })).toBe('PASS');
    expect(resolveResultStatus({ status: 'UNKNOWN', subjects: [...passed, { grade: 'F' }] })).toBe('FAIL');
    expect(resolveResultStatus({ status: 'UNKNOWN', subjects: [...passed, {}] })).toBe('UNKNOWN');
    expect(resolveResultStatus({ status: 'UNKNOWN', subjects: [] })).toBe('UNKNOWN');
  });

  it('repairs results cached before the fix when they are parsed', () => {
    const cached = { name: 'A', enrollment: '0111AL230001', semester: 6, status: 'UNKNOWN', subjects: [{ name: 'AL601- [T]', grade: 'B+' }], resultDescription: 'PASS' };
    expect(semesterResultSchema.parse(cached).status).toBe('PASS');
  });
});
