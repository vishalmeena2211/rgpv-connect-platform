import type { Metadata, Viewport } from 'next';
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';
import { RegisterServiceWorker } from '@/features/pwa/register-sw';
import { appUrl } from '@/lib/app-url';

import './globals.css';

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: 'RGPV Connect',
    template: '%s · RGPV Connect',
  },
  description:
    'Check any RGPV semester result in seconds, keep your full history with CGPA trends, and join a network where every student is verified by their enrollment number.',
  applicationName: 'RGPV Connect',
  appleWebApp: { capable: true, title: 'RGPV Connect', statusBarStyle: 'default' },
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
          <Toaster position="top-center" toastOptions={{ className: 'font-sans' }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
