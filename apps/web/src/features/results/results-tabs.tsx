import { Calculator, GraduationCap, Search } from 'lucide-react';

import { Segmented } from '@/components/ui/segmented';

/** Look up / My results / SGPA calculator, read as one Results area. */
export function ResultsTabs({ active }: { active: '/results/lookup' | '/results/me' | '/results/calculator' }) {
  return (
    <Segmented
      active={active}
      items={[
        { href: '/results/lookup', label: 'Look up a result', icon: Search },
        { href: '/results/me', label: 'My results', icon: GraduationCap },
        { href: '/results/calculator', label: 'SGPA calculator', icon: Calculator },
      ]}
    />
  );
}
