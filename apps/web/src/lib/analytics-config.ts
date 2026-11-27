/**
 * Which Mixpanel project RGPV Connect counts into, and when. Holds no browser
 * code, so the server can read it too.
 *
 * The project token comes from NEXT_PUBLIC_MIXPANEL_TOKEN, set where the site
 * is hosted. With none set nothing is counted, so a copy of this open-source
 * app run by someone else never counts into this site's project. A project
 * token is public by design: every page carries it, and it can only send
 * events, never read them.
 */
export const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? '';

/** Where the project keeps its data: api-js (US), api-eu or api-in, matching the project's data residency. */
export const MIXPANEL_API_HOST = process.env.NEXT_PUBLIC_MIXPANEL_API_HOST || 'https://api-js.mixpanel.com';

/**
 * Screen recordings (Mixpanel Session Replay), out of every 100 visits: all of
 * them unless NEXT_PUBLIC_MIXPANEL_RECORD_PERCENT says otherwise (0 turns them
 * off), the same as Meel. Only the public reading pages are ever recorded:
 * anything showing a result, an account, sign-in, messages or admin is on the
 * NOT_RECORDED list in lib/analytics.ts, every typed box is hidden, and a real
 * student's name on a recorded page carries data-private.
 */
export const RECORD_PERCENT = Math.min(100, Math.max(0, Number(process.env.NEXT_PUBLIC_MIXPANEL_RECORD_PERCENT ?? '100') || 0));

/**
 * Counting happens on the live site only: a production build, and on Vercel
 * only its production deployment, so previews are not counted. Locally
 * nothing is sent unless NEXT_PUBLIC_MIXPANEL_IN_DEVELOPMENT=1.
 */
export const ANALYTICS_ON =
  MIXPANEL_TOKEN !== '' &&
  (process.env.NEXT_PUBLIC_MIXPANEL_IN_DEVELOPMENT === '1' ||
    (process.env.NODE_ENV === 'production' &&
      (process.env.NEXT_PUBLIC_VERCEL_ENV === undefined || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production')));
