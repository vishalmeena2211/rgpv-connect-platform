import { SiteFooter, SiteHeader } from '@/components/shell/site-chrome';

/** Public pages: a light header, the page on the warm ground, and the footer. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
