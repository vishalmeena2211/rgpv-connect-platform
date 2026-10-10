/** Where a lookup goes: the public result page, or the in-app Look up tab. */
export function lookupHref(mode: 'public' | 'app', enrollment: string, semester: number): string {
  return mode === 'public'
    ? `/result/${enrollment}?semester=${semester}`
    : `/results/lookup?enrollment=${enrollment}&semester=${semester}`;
}
