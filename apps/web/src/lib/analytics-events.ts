/**
 * Every event RGPV Connect sends to Mixpanel, and what it means, in one place.
 * The words after each meaning are its properties. None ever holds a name, an
 * email, an enrollment number, marks, a grade, or anything a student typed.
 *
 * Most are sent by the student's browser (lib/analytics.ts), which leaves out
 * programs and "Do Not Track" browsers. Those marked "Sent from the server" are
 * outcomes only the server sees (lib/analytics-server.ts); they carry no
 * visitor, so read their totals, not unique users.
 */
export const EVENTS = {
  // ── pages ─────────────────────────────────────────────────────────
  'Page viewed': 'A page was opened. page (the path with ids replaced, e.g. /result/:enrollment), section.',

  // ── results ───────────────────────────────────────────────────────
  'Result looked up': 'The lookup form was sent. semester, board (grading or non-grading), from (home or lookup page).',
  'Result lookup answered':
    'A lookup got its answer. Sent from the server. outcome (found, not_declared, portal_down, service_down, rate_limited), cached, seconds, mode (public or app).',
  'Marksheet print opened': "RGPV's Print Marksheet was opened. semester.",
  'Result share link made': 'A share link for a result was made. kind (own or public).',
  'Result share link copied': 'A share link was copied. kind.',
  'Result shared': 'A result was sent on. kind, via (whatsapp or image).',
  'Marks calculator used': 'The what-if calculator was changed for the first time on a visit.',
  'Board listing switched': 'A student turned "Show me on the board" on or off. on.',
  'My results synced': 'One semester of My results was fetched again. Sent from the server. outcome (saved, not_declared, failed).',

  // ── signing in and accounts ───────────────────────────────────────
  'Sign-in link requested': 'A student asked for an email sign-in link.',
  'Google sign-in started': 'A student chose Continue with Google.',
  'Sign-in error shown': "The login page showed an error. reason (Auth.js's code, such as Verification or AccessDenied).",
  'Signed up': 'A first sign-in made an account. Sent from the server. method (email or google).',
  'Logged in': 'A returning student signed in. Sent from the server. method.',
  'Logged out': 'A student signed out. Sent from the server.',
  'Enrollment verified': 'A student confirmed their enrollment number and became verified.',
  'Identity dispute raised': 'A student said an enrollment number linked to someone else is theirs. Sent from the server.',
  'Account deletion requested': 'A student asked for their account to be deleted. Sent from the server.',

  // ── notes and papers ──────────────────────────────────────────────
  'Resources filtered': 'A branch or semester was chosen on Notes or Papers. type (notes or papers), branch, semester.',
  'Resource opened': 'A note or paper was downloaded or opened in a new tab. type (NOTE or PAPER).',
  'Resource rated': 'A note or paper was given stars. stars.',
  'Resource uploaded': 'A student sent notes or a paper for review. type.',
  'Search run': 'A search was sent. letters (how many were typed, never what), results (how many matched).',
  'Search found nothing': 'A search matched nothing. letters.',

  // ── the app and notifications ─────────────────────────────────────
  'Push turned on': 'Notifications were turned on for a device.',
  'Push refused': 'Turning on notifications did not work. why (denied or dismissed).',
  'App installed': 'RGPV Connect was added to a home screen.',

  // ── admin, from the server ────────────────────────────────────────
  'Resource reviewed': 'An admin published or rejected an upload. decision (published or rejected).',
  'Results day started': 'An admin started a results-day announcement. semester, students (how many will be checked).',
  'Results day finished': 'A results-day announcement reached everyone. Sent from the server. students, notified (how many).',
} as const;

export type EventName = keyof typeof EVENTS;
export type EventProps = Record<string, string | number | boolean | null>;
