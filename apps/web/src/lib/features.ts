/**
 * After-launch sections, closed until a college reaches density (launch doc).
 *
 * - `network`: home feed, directory, groups
 * - `campus`: jobs and the campus market
 *
 * Open them with ENABLED_FEATURES=network,campus. Admins can always open them,
 * so they can be checked before launch.
 */
export type Feature = 'network' | 'campus';

export function enabledFeatures(): Set<Feature> {
  const raw = process.env.ENABLED_FEATURES ?? '';
  return new Set(
    raw
      .split(',')
      .map((part) => part.trim())
      .filter((part): part is Feature => part === 'network' || part === 'campus'),
  );
}

export function isFeatureOpen(feature: Feature, role?: string | null): boolean {
  return role === 'ADMIN' || enabledFeatures().has(feature);
}
