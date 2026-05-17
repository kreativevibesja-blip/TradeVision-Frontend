import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { IBM_Plex_Mono, Manrope, Sora } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GlobalBackButton } from '@/components/GlobalBackButton';
import { GlobalUpdatesModal } from '@/components/GlobalUpdatesModal';
import { PlatformIntroModal } from '@/components/PlatformIntroModal';
import { VisitorHeartbeat } from '@/components/VisitorHeartbeat';
import { SupportButton } from '@/components/SupportButton';
import { ReferralCapture } from '@/components/ReferralCapture';
import { FeedbackTrigger } from '@/components/FeedbackTrigger';

const bodyFont = Manrope({ subsets: ['latin'], variable: '--font-body' });
const displayFont = Sora({ subsets: ['latin'], variable: '--font-display' });
const monoFont = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: 'TradeVision AI - AI Trading Chart Analysis',
  description: 'Upload any trading chart screenshot and get professional AI-powered analysis instantly. Supports MetaTrader 5, TradingView, and Deriv charts.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="goldx-premium">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} min-h-screen bg-background font-sans antialiased overflow-x-hidden`}>
        <AuthProvider>
          <ThemeProvider>
            <Suspense><ReferralCapture /></Suspense>
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
              <Navbar />
              <Suspense fallback={null}>
                <GlobalBackButton />
              </Suspense>
              <VisitorHeartbeat />
              <GlobalUpdatesModal />
              <PlatformIntroModal />
              <main className="flex-1 pt-20">{children}</main>
              <SupportButton />
              <FeedbackTrigger />
            </div>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
