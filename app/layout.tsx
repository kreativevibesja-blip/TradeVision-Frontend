import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GlobalBackButton } from '@/components/GlobalBackButton';
import { MobileBottomNav } from '@/components/MobileBottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TradeVision AI - AI Trading Chart Analysis',
  description: 'Upload any trading chart screenshot and get professional AI-powered analysis instantly. Supports MT5, cTrader, TradingView, and Deriv charts.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background antialiased overflow-x-hidden`}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col overflow-x-hidden">
            <Navbar />
            <GlobalBackButton />
            <main className="flex-1 pt-16 pb-24 md:pb-0">{children}</main>
            <MobileBottomNav />
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
