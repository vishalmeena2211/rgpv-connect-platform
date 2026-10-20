import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { getCurrentUser } from '@/lib/session';

const LINKS = [
  { href: '/#check', label: 'Results' },
  { href: '/notes', label: 'Notes' },
  { href: '/papers', label: 'Papers' },
  { href: '/#how', label: 'How it works' },
  { href: '/#faq', label: 'FAQ' },
  { href: 'https://github.com/vishalmeena2211/rgpv-connect-platform', label: 'Open source' },
];

/** Header for public pages. Signed-in visitors get a button back into the app. */
export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Wordmark />
        <nav className="ml-6 hidden items-center gap-0.5 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[10px] px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <Button asChild>
              <Link href="/results/me">Open My results</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/login">Join with your enrollment</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-faint sm:px-6">
        <p className="w-full max-w-[820px] leading-5">
          RGPV Connect is an independent student project and is not affiliated with Rajiv Gandhi Proudyogiki
          Vishwavidyalaya. Results are fetched from RGPV’s public result portal, which remains the official source.
        </p>
        <span>RGPV Connect · free and open source · MIT</span>
        <nav className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/notes" className="hover:text-foreground">Notes</Link>
          <Link href="/papers" className="hover:text-foreground">Papers</Link>
          <Link href="/#faq" className="hover:text-foreground">FAQ</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy#delete" className="hover:text-foreground">Delete my data</Link>
          <a href="https://github.com/vishalmeena2211/rgpv-connect-platform" className="hover:text-foreground">GitHub</a>
          <span>Built by RGPV students</span>
        </nav>
      </div>
    </footer>
  );
}
