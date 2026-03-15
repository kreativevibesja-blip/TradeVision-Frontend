import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GlobalBackButton } from '@/components/GlobalBackButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TradeVision AI - AI Trading Chart Analysis',
  description: 'Upload any trading chart screenshot and get professional AI-powered analysis instantly. Supports MT5, cTrader, TradingView, and Deriv charts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <AuthProvider>
          <Navbar />
          <GlobalBackButton />
          <main className="pt-16">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
