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
import { VisitorHeartbeat } from '@/components/VisitorHeartbeat';
import { ReferralCapture } from '@/components/ReferralCapture';
import { FeedbackTrigger } from '@/components/FeedbackTrigger';
import { OrionOnboardingExperience } from '@/components/OrionOnboardingExperience';
import { OrionMentorAssistant } from '@/components/OrionMentorAssistant';
import { SeoJsonLd } from '@/components/SeoJsonLd';
import { jsonLd, seoKeywords, siteUrl } from '@/lib/seo';

const bodyFont = Manrope({ subsets: ['latin'], variable: '--font-body' });
const displayFont = Sora({ subsets: ['latin'], variable: '--font-display' });
const monoFont = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TradeVision AI | AI Trading Chart Analysis & Trading Mentor',
    template: '%s | TradeVision AI',
  },
  description: 'Upload your trading charts and receive AI-powered market analysis, Trade Radar monitoring and guidance from Orion AI.',
  keywords: seoKeywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'TradeVision AI',
    title: 'TradeVision AI | AI Trading Chart Analysis & Trading Mentor',
    description: 'Upload your trading charts and receive AI-powered market analysis, Trade Radar monitoring and guidance from Orion AI.',
    images: [{ url: '/og/tradevision-ai-home.png', width: 1200, height: 630, alt: 'TradeVision AI chart analysis dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradeVision AI | AI Trading Chart Analysis & Trading Mentor',
    description: 'Upload your trading charts and receive AI-powered market analysis, Trade Radar monitoring and guidance from Orion AI.',
    images: ['/og/tradevision-ai-home.png'],
  },
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
    <html lang="en" data-theme="clean-blue">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} min-h-screen bg-background font-sans antialiased overflow-x-hidden`}>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var m=localStorage.getItem('tradevision-color-mode')||'light';document.documentElement.dataset.colorMode=m;document.body.dataset.colorMode=m;}catch(e){}",
          }}
        />
        <SeoJsonLd data={[jsonLd.organization, jsonLd.website, jsonLd.softwareApplication]} />
        <GlobalUpdatesModal />
        <AuthProvider>
          <ThemeProvider>
            <Suspense><ReferralCapture /></Suspense>
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
              <Navbar />
              <Suspense fallback={null}>
                <GlobalBackButton />
              </Suspense>
              <VisitorHeartbeat />
              <main className="flex-1 pt-20">{children}</main>
              <FeedbackTrigger />
              <Suspense fallback={null}>
                <OrionMentorAssistant />
              </Suspense>
              <OrionOnboardingExperience />
            </div>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
