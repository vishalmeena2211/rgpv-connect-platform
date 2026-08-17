import { SgpaCalculator } from '@/features/results/cgpa-calculator';
import { ResultsNav } from '@/features/results/results-nav';

export const metadata = { title: 'SGPA Calculator' };

/** Standalone SGPA calculator on RGPV's 10-point grading scale. */
export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Calculator</h1>
        <ResultsNav />
      </header>
      <SgpaCalculator />
    </div>
  );
}
