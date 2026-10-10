import type { SubjectResult } from '@rgpv/shared';

/**
 * RGPV prints subjects as "CS401- [T]" (theory) or "CS406- [P]" (practical).
 * Pull out the code and the part so rows can be matched to the catalogue.
 */
export function splitSubject(subject: SubjectResult): { code: string | null; part: 'T' | 'P' | null } {
  const code = subject.code ?? subject.name.match(/^([A-Z]{2,3}\s?-?\d{3})/)?.[1]?.replace(/[\s-]/g, '') ?? null;
  const part = subject.name.match(/\[(T|P)\]/)?.[1] as 'T' | 'P' | undefined;
  return { code, part: part ?? null };
}
