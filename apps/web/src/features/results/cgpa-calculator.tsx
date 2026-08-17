'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { GRADE_POINTS, GRADES, type Grade, weightedAverage } from './grade-scale';

interface SubjectRow {
  id: number;
  credits: string;
  grade: Grade;
}

let nextId = 0;
const newRow = (): SubjectRow => ({ id: nextId++, credits: '4', grade: 'A' });

/**
 * Interactive SGPA calculator on RGPV's 10-point scale. Each row is a subject
 * (credits + grade); the SGPA is the credit-weighted average of grade points,
 * updating live as rows change.
 */
export function SgpaCalculator() {
  const [rows, setRows] = useState<SubjectRow[]>(() => [newRow(), newRow(), newRow()]);

  const sgpa = useMemo(
    () =>
      weightedAverage(
        rows.map((row) => ({
          credits: Number(row.credits) || 0,
          points: GRADE_POINTS[row.grade],
        })),
      ),
    [rows],
  );

  const totalCredits = rows.reduce((sum, row) => sum + (Number(row.credits) || 0), 0);

  function updateRow(id: number, patch: Partial<SubjectRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: number) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>SGPA calculator</CardTitle>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">SGPA</p>
          <p className="text-3xl font-bold tabular-nums">{sgpa.toFixed(2)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                aria-label={`Subject ${index + 1} credits`}
                value={row.credits}
                onChange={(e) => updateRow(row.id, { credits: e.target.value })}
                className="w-24"
                placeholder="Credits"
              />
              <select
                aria-label={`Subject ${index + 1} grade`}
                value={row.grade}
                onChange={(e) => updateRow(row.id, { grade: e.target.value as Grade })}
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade} ({GRADE_POINTS[grade]})
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove subject"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, newRow()])}>
            <Plus />
            Add subject
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {totalCredits} total credits
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
