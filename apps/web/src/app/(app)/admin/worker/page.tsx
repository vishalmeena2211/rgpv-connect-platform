import type { Metadata } from 'next';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatTile } from '@/components/ui/stat-tile';
import { WorkerButtons } from '@/features/admin/admin-client';
import { fetchWorkerStats } from '@/lib/result-worker';
import { formatCount, formatWhen } from '@/lib/utils';

export const metadata: Metadata = { title: 'Result worker' };

interface Stats {
  today: { available: boolean; total?: number; found?: number; notFound?: number; failed?: number; firstTry?: number; medianMs?: number | null; p90Ms?: number | null; recent?: { at: number; enrollment: string; semester: number; outcome: string; durationMs: number; attempts: number }[] };
  pool: { size: number | null; target: number };
  captcha: { provider: string; balance: number | null; error: string | null };
  submitWaitSeconds: number;
  parserCheck: { at: number; ok: boolean; detail: string; seconds: number } | null;
}

const OUTCOME = { found: ['Found', 'success'], not_found: ['Not declared', 'default'], failed: ['Portal rejected', 'destructive'] } as const;

export default async function WorkerPage() {
  let stats: Stats | null = null;
  try {
    stats = (await fetchWorkerStats()) as Stats;
  } catch {
    stats = null;
  }

  if (!stats) {
    return (
      <>
        <PageHeader title="Result worker" description="The service that reads result.rgpv.ac.in for every lookup." />
        <Callout tone="danger" title="The worker is not answering">
          Every lookup, verification and results-day run is failing until it is back. Check that it is running and that RESULT_WORKER_URL and WORKER_API_KEY match on both sides.
        </Callout>
      </>
    );
  }

  const t = stats.today;
  const balance = stats.captcha.balance;
  return (
    <>
      <PageHeader
        title="Result worker"
        description="The service that reads result.rgpv.ac.in for every lookup."
        actions={<span className="inline-flex h-8 items-center gap-2 rounded-lg border bg-card px-3 text-[13px] font-medium shadow-card"><i className="size-2 rounded-full bg-success" />Answering</span>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Results today" value={t.available ? formatCount(t.total ?? 0) : '—'} note={t.available && t.total ? `${Math.round(((t.firstTry ?? 0) / Math.max(1, t.found ?? 0)) * 100)}% on first try` : t.available ? 'None yet' : 'Metrics unavailable'} />
        <StatTile label="Time per result" value={t.medianMs ? `${(t.medianMs / 1000).toFixed(1)} s` : '—'} note={t.p90Ms ? `Median · ${(t.p90Ms / 1000).toFixed(1)} s at the 90th` : 'Median'} />
        <StatTile
          label="Captcha balance"
          value={balance != null ? `$${balance.toFixed(2)}` : '—'}
          note={stats.captcha.provider === 'tesseract' ? 'Local OCR, no balance' : balance != null ? `About ${formatCount(Math.floor(balance / 0.0004))} solves · top up below $1` : (stats.captcha.error ?? 'Unknown')}
        />
        <StatTile label="Warm sessions" value={stats.pool.size ?? '—'} suffix={`of ${stats.pool.target}`} note={stats.pool.size ? 'Pool is warm' : 'Warm it before results day'} />
      </div>
      {balance != null && balance < 1 ? <Callout tone="warning" title="Captcha balance is low">Top up AZCaptcha before the next results day; each lookup costs about $0.0004.</Callout> : null}
      <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Last 20 fetches</CardTitle>
            <span className="text-xs text-muted-foreground">Enrollment numbers shortened on purpose</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                <tr><th className="px-[18px] py-2.5">When</th><th className="px-3 py-2.5">Who</th><th className="px-3 py-2.5">Sem</th><th className="px-3 py-2.5 text-right">Took</th><th className="px-[18px] py-2.5">Outcome</th></tr>
              </thead>
              <tbody>
                {(t.recent ?? []).map((row, i) => {
                  const [label, tone] = OUTCOME[row.outcome as keyof typeof OUTCOME] ?? ['Unknown', 'default'];
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-[18px] py-2 tabular">{formatWhen(new Date(row.at * 1000))}</td>
                      <td className="px-3 py-2 tabular">{row.enrollment}</td>
                      <td className="px-3 py-2 tabular">{row.semester}</td>
                      <td className="px-3 py-2 text-right tabular">{(row.durationMs / 1000).toFixed(1)} s</td>
                      <td className="px-[18px] py-2"><Badge variant={tone}>{label}{row.attempts > 1 && row.outcome === 'found' ? ' · retried' : ''}</Badge></td>
                    </tr>
                  );
                })}
                {(t.recent ?? []).length === 0 ? <tr><td colSpan={5} className="px-[18px] py-4 text-muted-foreground">No fetches yet today.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>If the portal changes</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-[13px]">
            <p className="flex items-center gap-2">
              {stats.parserCheck ? (stats.parserCheck.ok ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />) : <Clock className="size-4 text-warning" />}
              {stats.parserCheck
                ? `${stats.parserCheck.ok ? 'Live check passed' : 'Live check failed'} ${formatWhen(new Date(stats.parserCheck.at * 1000)).toLowerCase()} · ${stats.parserCheck.detail}`
                : 'No live check run yet'}
            </p>
            <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" />Submit wait is {stats.submitWaitSeconds} s (the portal rejects anything under about 5 s)</p>
            <p className="text-xs text-muted-foreground">The live check costs one captcha. Run it after any results-day problem or when lookups start failing.</p>
            <WorkerButtons />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
