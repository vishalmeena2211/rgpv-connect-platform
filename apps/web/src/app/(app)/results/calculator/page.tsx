import type { Metadata } from 'next';
import { currentSemester } from '@rgpv/shared';

import { PageHeader } from '@/components/ui/page-header';
import { Calculator } from '@/features/results/calculator';
import { getSavedResults, getSemesterSubjects } from '@/features/results/queries';
import { ResultsTabs } from '@/features/results/results-tabs';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'SGPA calculator' };

/** What-if for the semester being studied, pre-filled from the syllabus. */
export default async function CalculatorPage() {
  const user = await requireUser('/results/calculator');
  const saved = await getSavedResults(user.id);
  const sgpas = saved.filter((r) => r.sgpa != null).map((r) => r.sgpa as number);
  const semester = user.admissionYear ? currentSemester(user.admissionYear) : Math.min(8, sgpas.length + 1);
  const subjects = await getSemesterSubjects(user.branchCode, semester);

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5">
      <PageHeader title="Results" description="Plan the next semester from where you are." />
      <ResultsTabs active="/results/calculator" />
      <Calculator semester={semester} subjects={subjects} sgpas={sgpas} />
    </div>
  );
}
