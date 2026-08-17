import { ResultLookupForm } from '@/features/results/lookup-form';
import { ResultsNav } from '@/features/results/results-nav';

export const metadata = { title: 'Results' };

/**
 * Result lookup screen. Anyone signed in can fetch any RGPV student's semester
 * result here; verified users additionally get a saved "My Results" dashboard
 * (see /results/me).
 */
export default function ResultsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Results</h1>
          <p className="text-sm text-muted-foreground">
            Look up any RGPV semester result by enrollment number.
          </p>
        </div>
        <ResultsNav />
      </header>
      <ResultLookupForm />
    </div>
  );
}
