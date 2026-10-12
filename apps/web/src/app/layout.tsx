import type { Metadata, Viewport } from 'next';
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';
import { RegisterServiceWorker } from '@/features/pwa/register-sw';
import { AnalyticsStart } from '@/components/analytics-start';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

import './globals.css';

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RGPV Connect: RGPV results, CGPA, notes and papers',
    template: '%s · RGPV Connect',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'RGPV result',
    'RGPV result 2026',
    'RGPV semester result',
    'RGPV CGPA calculator',
    'RGPV notes',
    'RGPV previous year papers',
    'RGPV B.Tech',
    'UIT RGPV',
    'Rajiv Gandhi Proudyogiki Vishwavidyalaya',
  ],
  category: 'education',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    title: 'RGPV Connect: RGPV results, CGPA, notes and papers',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RGPV Connect: RGPV results, CGPA, notes and papers',
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F6F3' },
    { media: '(prefers-color-scheme: dark)', color: '#0C1311' },
  ],
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <RegisterServiceWorker />
          <AnalyticsStart />
          <Toaster position="top-center" toastOptions={{ className: 'font-sans' }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
