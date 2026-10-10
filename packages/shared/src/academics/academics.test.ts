import { describe, expect, it } from 'vitest';

import {
  completedSemesters,
  currentSemester,
  latestDeclaredSemester,
  plausibleMaxSemester,
  semesterSchedule,
} from './calendar';
import { density, rankOf, topPercent } from './cohort';
import {
  cgpaFromSemesters,
  projectedCgpa,
  requiredAverageSgpa,
  sgpaFromGrades,
  weightedAverage,
} from './gpa';

const utc = (y: number, m: number, d = 1) => new Date(Date.UTC(y, m - 1, d));

describe('semesterSchedule', () => {
  it('puts odd semesters in Nov–Dec exams and Jan–Feb results', () => {
    const s = semesterSchedule(5, 2024);
    expect(s.examWindow).toBe('Nov to Dec 2026');
    expect(s.declareWindow).toBe('Jan to Feb 2027');
  });

  it('puts even semesters in May–Jun exams and Jul–Aug results', () => {
    const s = semesterSchedule(4, 2024);
    expect(s.examWindow).toBe('May to Jun 2026');
    expect(s.declareWindow).toBe('Jul to Aug 2026');
  });
});

describe('semester position for the 2024 batch in October 2026', () => {
  const now = utc(2026, 10, 11);
  it('has finished four semesters and is studying the fifth', () => {
    expect(completedSemesters(2024, now)).toBe(4);
    expect(currentSemester(2024, now)).toBe(5);
  });
  it('defaults lookups to semester 4', () => {
    expect(latestDeclaredSemester(2024, now)).toBe(4);
  });
  it('asks the portal about semesters up to 4', () => {
    expect(plausibleMaxSemester(2024, now)).toBe(4);
  });
});

describe('semester position edge cases', () => {
  it('is semester 1 with nothing declared in the first term', () => {
    expect(currentSemester(2026, utc(2026, 9))).toBe(1);
    expect(latestDeclaredSemester(2026, utc(2026, 9))).toBeNull();
  });
  it('does not treat an even semester as declared in July', () => {
    expect(latestDeclaredSemester(2024, utc(2026, 7, 15))).toBe(3);
  });
  it('caps at semester 8 after graduation', () => {
    expect(currentSemester(2018, utc(2026, 10))).toBe(8);
  });
});

describe('gpa', () => {
  it('computes the wireframe semester 4 SGPA from grades', () => {
    expect(
      sgpaFromGrades([
        { credits: 4, grade: 'A' },
        { credits: 3, grade: 'B+' },
        { credits: 3, grade: 'B+' },
        { credits: 3, grade: 'B' },
        { credits: 2, grade: 'A+' },
        { credits: 2, grade: 'A' },
      ]),
    ).toBe(8.41);
  });

  it('returns null with no credits', () => {
    expect(weightedAverage([])).toBeNull();
    expect(sgpaFromGrades([{ credits: 3, grade: 'Z' }])).toBeNull();
  });

  it('averages SGPAs into a CGPA', () => {
    expect(cgpaFromSemesters([7.42, 7.85, 8.1, 8.41].map((sgpa) => ({ sgpa })))).toBe(7.95);
  });

  it('weights by credits when all are known', () => {
    expect(
      cgpaFromSemesters([
        { sgpa: 8, credits: 20 },
        { sgpa: 6, credits: 10 },
      ]),
    ).toBe(7.33);
  });

  it('projects the next CGPA', () => {
    expect(projectedCgpa([7.42, 7.85, 8.1, 8.41], 8.82)).toBe(8.12);
  });

  it('works out the average needed for a target', () => {
    const plan = requiredAverageSgpa({
      currentSgpas: [7.42, 7.85, 8.1, 8.41],
      targetCgpa: 8.25,
      untilSemester: 6,
    });
    expect(plan).toMatchObject({ requiredAverage: 8.86, remaining: 2, achievable: true });
  });

  it('flags an unreachable target', () => {
    const plan = requiredAverageSgpa({ currentSgpas: [6, 6], targetCgpa: 9.5, untilSemester: 3 });
    expect(plan?.achievable).toBe(false);
  });

  it('returns null when no semesters remain', () => {
    expect(requiredAverageSgpa({ currentSgpas: [8, 8], targetCgpa: 8, untilSemester: 2 })).toBeNull();
  });
});

describe('cohort', () => {
  const cohort = Array.from({ length: 38 }, (_, i) => 9.5 - i * 0.05);

  it('puts 7th of 38 in the top 19%', () => {
    expect(rankOf(cohort[6]!, cohort)).toBe(7);
    expect(topPercent(cohort[6]!, cohort)).toBe(19);
  });

  it('refuses to rank a small cohort', () => {
    expect(topPercent(8, [8, 7, 6])).toBeNull();
  });

  it('measures density against the batch size', () => {
    expect(density(38, 120)).toMatchObject({ reached: false });
    expect(density(40, 120).reached).toBe(true);
    expect(density(10, null)).toMatchObject({ ratio: null, reached: false });
  });
});
