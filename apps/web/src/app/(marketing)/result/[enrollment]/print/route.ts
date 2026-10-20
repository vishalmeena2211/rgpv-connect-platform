import { normaliseEnrollment, parseEnrollment } from '@rgpv/shared';

import { lookupHref } from '@/features/results/links';
import { renderMarksheet, renderMarksheetMessage } from '@/features/results/marksheet';
import { lookupResult } from '@/features/results/service';
import { getCurrentUser } from '@/lib/session';

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

/**
 * RGPV's "Print Marksheet" window for one result: the marksheet alone, which
 * opens the print dialog on load so the student can save it as a PDF.
 */
export async function GET(request: Request, { params }: { params: Promise<{ enrollment: string }> }) {
  const { enrollment: raw } = await params;
  const parsed = parseEnrollment(normaliseEnrollment(decodeURIComponent(raw)));
  const semester = Number(new URL(request.url).searchParams.get('semester'));
  if (!parsed || !Number.isInteger(semester) || semester < 1 || semester > 10) {
    return new Response(renderMarksheetMessage('That is not a result we can print.', '/#check'), { status: 404, headers: HTML_HEADERS });
  }

  const back = lookupHref('public', parsed.raw, semester);
  const viewer = await getCurrentUser();
  const limitKey = viewer ? `lookup:user:${viewer.id}` : undefined;

  let outcome = await lookupResult(parsed.raw, semester, { limitKey });
  // Results cached before the marksheet existed lack RGPV's Status cell and
  // revaluation dates; fetch once more so the print matches RGPV's.
  if (outcome.kind === 'found' && outcome.fromCache && !outcome.result.candidateStatus) {
    const fresh = await lookupResult(parsed.raw, semester, { fresh: true, limitKey });
    if (fresh.kind === 'found') outcome = fresh;
  }

  if (outcome.kind !== 'found') {
    const message =
      outcome.kind === 'not_declared'
        ? `RGPV has not declared semester ${semester} for ${parsed.raw} yet.`
        : outcome.kind === 'rate_limited'
          ? 'Too many checks from this connection. Try again in a few minutes.'
          : "RGPV's result portal is not answering right now. Try again in a few minutes.";
    return new Response(renderMarksheetMessage(message, back), { status: 200, headers: HTML_HEADERS });
  }

  return new Response(renderMarksheet(outcome.result, { fetchedAt: outcome.fetchedAt, backHref: back }), { headers: HTML_HEADERS });
}
