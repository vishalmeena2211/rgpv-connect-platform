'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { GRADE_POINTS, GRADES, type Grade, projectedCgpa, requiredAverageSgpa, sgpaFromGrades } from '@rgpv/shared';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { semesterOptions } from '@/components/ui/select-options';

interface Row {
  id: number;
  code: string;
  name: string;
  credits: string;
  grade: Grade;
}

let nextId = 0;

/**
 * What-if SGPA for the next semester, pre-filled from the catalogue, and the
 * average SGPA needed to reach a target CGPA. Equal semester weights, which is
 * what RGPV's CGPA comes to when semesters carry equal credits.
 */
export function Calculator({
  semester,
  subjects,
  sgpas,
}: {
  semester: number;
  subjects: { code: string | null; name: string; credits: number | null }[];
  /** Saved SGPAs, semester 1 upwards. */
  sgpas: number[];
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    subjects.length > 0
      ? subjects.map((s) => ({ id: nextId++, code: s.code ?? '', name: s.name, credits: String(s.credits ?? 3), grade: 'A' }))
      : [0, 1, 2, 3, 4].map(() => ({ id: nextId++, code: '', name: '', credits: '3', grade: 'A' })),
  );
  const [target, setTarget] = useState(() => (sgpas.length ? Math.min(10, Math.ceil((sgpas.reduce((a, b) => a + b, 0) / sgpas.length + 0.3) * 4) / 4) : 8).toFixed(2));
  const [until, setUntil] = useState(Math.min(8, Math.max(semester + 1, sgpas.length + 2)));

  const sgpa = useMemo(() => sgpaFromGrades(rows.map((r) => ({ credits: Number(r.credits) || 0, grade: r.grade }))), [rows]);
  const totalCredits = rows.reduce((sum, r) => sum + (Number(r.credits) || 0), 0);
  const plan = requiredAverageSgpa({ currentSgpas: sgpas, targetCgpa: Number(target) || 0, untilSemester: until });

  const update = (id: number, patch: Partial<Row>) => setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Semester {semester} · what-if</CardTitle>
          <span className="text-xs text-muted-foreground">RGPV 10-point scale</span>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[380px] text-[13px]">
              <thead className="bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                <tr>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="w-20 px-3 py-2.5 text-right">Credits</th>
                  <th className="w-28 px-3 py-2.5 text-right">Grade</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      {row.code ? (
                        <span>
                          <b>{row.code}</b> <span className="text-muted-foreground">· {row.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Subject {index + 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        aria-label={`Credits for ${row.code || `subject ${index + 1}`}`}
                        inputMode="numeric"
                        value={row.credits}
                        onChange={(e) => update(row.id, { credits: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                        className="h-8 text-right tabular"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        aria-label={`Grade for ${row.code || `subject ${index + 1}`}`}
                        size="sm"
                        value={row.grade}
                        onValueChange={(next) => update(row.id, { grade: next as Grade })}
                        options={GRADES.map((grade) => ({ value: grade, label: grade, hint: `${GRADE_POINTS[grade]} pts` }))}
                      />
                    </td>
                    <td className="pr-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove subject"
                        disabled={rows.length === 1}
                        onClick={() => setRows((current) => current.filter((r) => r.id !== row.id))}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRows((current) => [...current, { id: nextId++, code: '', name: '', credits: '3', grade: 'A' }])}
            >
              <Plus />
              Add subject
            </Button>
            <span className="text-xs text-muted-foreground tabular">
              {totalCredits} credits{subjects.length ? ` · subjects from the semester ${semester} syllabus` : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Card>
          <CardContent className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">If you get these grades</span>
            <p className="flex items-baseline gap-2.5">
              <span className="font-display text-[34px] font-bold tracking-[-0.03em] tabular">{sgpa?.toFixed(2) ?? '—'}</span>
              <span className="text-xs text-muted-foreground">SGPA semester {semester}</span>
            </p>
            {sgpa != null && sgpas.length > 0 ? (
              <p className="text-[13px] text-muted-foreground tabular">
                CGPA would move from <b className="text-foreground">{(sgpas.reduce((a, b) => a + b, 0) / sgpas.length).toFixed(2)}</b> to{' '}
                <b className="text-foreground">{projectedCgpa(sgpas, sgpa).toFixed(2)}</b> after {sgpas.length + 1} semesters.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="CGPA you want" htmlFor="target-cgpa">
                <Input id="target-cgpa" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className="tabular" />
              </Field>
              <Field label="By the end of" htmlFor="target-until">
                <Select
                  id="target-until"
                  value={String(until)}
                  onValueChange={(next) => setUntil(Number(next))}
                  options={semesterOptions(sgpas.length + 1, 8)}
                />
              </Field>
            </div>
            {sgpas.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Fetch your results in My results to plan a target.</p>
            ) : !plan ? null : plan.alreadyMet ? (
              <Callout tone="success" title={`You already have ${target} locked in`}>
                Even a low score in the remaining semesters keeps you at or above it.
              </Callout>
            ) : plan.achievable ? (
              <Callout tone="brand" title={`You need an average SGPA of ${plan.requiredAverage.toFixed(2)} in the next ${plan.remaining} semester${plan.remaining === 1 ? '' : 's'}`}>
                Your best so far is {Math.max(...sgpas).toFixed(2)}.
              </Callout>
            ) : (
              <Callout tone="warning" title={`${target} is out of reach by semester ${until}`}>
                It would need an average of {plan.requiredAverage.toFixed(2)}, above the maximum of 10. Try a later semester or
                a lower target.
              </Callout>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
