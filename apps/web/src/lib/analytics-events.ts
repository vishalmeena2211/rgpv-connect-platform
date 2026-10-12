/**
 * Every event RGPV Connect sends to Mixpanel, and what it means, in one place.
 * The words after each meaning are its properties. None ever holds a name, an
 * email, an enrollment number, marks, or anything a student typed.
 */
export const EVENTS = {
  'Page viewed': 'A page was opened. page (the path with ids replaced, e.g. /result/:enrollment), section.',
  'Result looked up': 'The lookup form was sent. semester, board (grading or non-grading), from (home or lookup page).',
  'Sign-in link requested': 'A student asked for an email sign-in link.',
  'Google sign-in started': 'A student chose Continue with Google.',
  'Enrollment verified': 'A student confirmed their enrollment number and became verified.',
  'Result share link made': 'A share link for a result was made. kind (own or public).',
  'Result share link copied': 'A share link was copied. kind.',
  'Resource opened': 'A note or paper was downloaded or opened in a new tab. type (NOTE or PAPER).',
  'Resource uploaded': 'A student sent notes or a paper for review. type.',
} as const;

export type EventName = keyof typeof EVENTS;
export type EventProps = Record<string, string | number | boolean | null>;
