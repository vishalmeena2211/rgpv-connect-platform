import { clientKey, rateLimit } from '@/lib/rate-limit';
import { warmWorker } from '@/lib/result-worker';

/** Warms per hour per connection; one person needs a handful, a hostel a few dozen. */
const WARM_LIMIT_PER_HOUR = 60;

/**
 * Called when someone starts typing an enrollment number, so the worker is
 * awake and holding an RGPV session by the time they press Check. Always 204:
 * a warm that fails or is refused only means the lookup takes its usual time.
 */
export async function POST() {
  const check = await rateLimit(`warm:${await clientKey()}`, WARM_LIMIT_PER_HOUR, 3600);
  if (check.ok) {
    try {
      await warmWorker();
    } catch {
      // Best-effort: the lookup itself still works without it.
    }
  }
  return new Response(null, { status: 204 });
}
