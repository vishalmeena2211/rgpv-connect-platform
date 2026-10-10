import {
  Briefcase,
  FileText,
  GraduationCap,
  Home,
  type LucideIcon,
  MessageCircle,
  NotebookText,
  ShoppingBag,
  User,
  Users,
  UsersRound,
} from 'lucide-react';

import type { Feature } from '@/lib/features';

/** A navigation destination shown in the shell. */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Closed behind a feature switch until a college reaches density. */
  feature?: Feature;
}

/** Open at launch: the reason people come, and the reason they invite friends. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Results', href: '/results', icon: GraduationCap },
  { label: 'Notes', href: '/notes', icon: NotebookText },
  { label: 'Papers', href: '/papers', icon: FileText },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'My profile', href: '/me', icon: User },
];

/** Built, but held back until a college passes a third verified (launch doc). */
export const AFTER_LAUNCH_ITEMS: NavItem[] = [
  { label: 'Home feed', href: '/feed', icon: Home, feature: 'network' },
  { label: 'Network', href: '/network', icon: Users, feature: 'network' },
  { label: 'Groups', href: '/groups', icon: UsersRound, feature: 'network' },
  { label: 'Jobs', href: '/jobs', icon: Briefcase, feature: 'campus' },
  { label: 'Market', href: '/market', icon: ShoppingBag, feature: 'campus' },
];

/** Phone tab bar: four destinations under the thumb. */
export const MOBILE_TABS: NavItem[] = [
  { label: 'Results', href: '/results', icon: GraduationCap },
  { label: 'Notes', href: '/notes', icon: NotebookText },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'Me', href: '/me', icon: User },
];
