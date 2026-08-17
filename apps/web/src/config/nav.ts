import {
  Briefcase,
  GraduationCap,
  Home,
  type LucideIcon,
  Newspaper,
  ScrollText,
  ShoppingBag,
  Users,
  UsersRound,
} from 'lucide-react';

/** A navigation destination shown in the shell. */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Show in the mobile bottom tab bar (space is limited to ~5 items). */
  primary?: boolean;
}

/**
 * Single source of truth for app navigation. The desktop sidebar renders all
 * items; the mobile bottom bar renders only `primary` ones.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/feed', icon: Home, primary: true },
  { label: 'Network', href: '/network', icon: Users, primary: true },
  { label: 'Results', href: '/results', icon: GraduationCap, primary: true },
  { label: 'Notes', href: '/notes', icon: Newspaper },
  { label: 'Papers', href: '/papers', icon: ScrollText },
  { label: 'Groups', href: '/groups', icon: UsersRound },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Market', href: '/market', icon: ShoppingBag, primary: true },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary);
