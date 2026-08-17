import { type SemesterResult } from '@rgpv/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = {
  PASS: 'success',
  FAIL: 'destructive',
  WITHHELD: 'secondary',
  UNKNOWN: 'outline',
} as const;

function StatTile({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value ?? '—'}</p>
    </div>
  );
}

/** Renders a single semester result: header, GPA tiles and the subject table. */
export function ResultCard({ result }: { result: SemesterResult }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <h2 className="text-xl font-bold">{result.name}</h2>
          <p className="text-sm text-muted-foreground">
            {result.enrollment} · Semester {result.semester}
            {result.session ? ` · ${result.session}` : ''}
          </p>
          {result.branch ? (
            <p className="text-sm text-muted-foreground">{result.branch}</p>
          ) : null}
        </div>
        <Badge
          variant={
            STATUS_VARIANT[result.status as keyof typeof STATUS_VARIANT] ?? 'outline'
          }
        >
          {result.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="SGPA" value={result.sgpa} />
          <StatTile label="CGPA" value={result.cgpa} />
        </div>

        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Subject</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Earned</th>
                <th className="p-3 text-right">Grade</th>
              </tr>
            </thead>
            <tbody>
              {result.subjects.map((subject, i) => (
                <tr key={`${subject.name}-${i}`} className={cn(i % 2 === 1 && 'bg-muted/30')}>
                  <td className="p-3">{subject.name}</td>
                  <td className="p-3 text-right tabular-nums">{subject.totalMarks ?? '—'}</td>
                  <td className="p-3 text-right tabular-nums">{subject.earnedMarks ?? '—'}</td>
                  <td className="p-3 text-right font-medium">{subject.grade ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.resultDescription ? (
          <p className="text-sm text-muted-foreground">{result.resultDescription}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
