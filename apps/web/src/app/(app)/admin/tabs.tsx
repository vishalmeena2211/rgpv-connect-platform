'use client';

import { usePathname } from 'next/navigation';
import { Clock, FileCheck2, ShieldAlert, Users, Zap } from 'lucide-react';

import { Segmented } from '@/components/ui/segmented';

const TABS = [
  { href: '/admin/review', label: 'Review queue', icon: FileCheck2 },
  { href: '/admin/results-day', label: 'Results day', icon: Zap },
  { href: '/admin/worker', label: 'Result worker', icon: Clock },
  { href: '/admin/privacy', label: 'Privacy and claims', icon: ShieldAlert },
  { href: '/admin/students', label: 'Students', icon: Users },
];

export function AdminTabs() {
  const pathname = usePathname();
  const active = TABS.find((t) => pathname.startsWith(t.href))?.href ?? '/admin/review';
  return <Segmented items={TABS} active={active} />;
}
