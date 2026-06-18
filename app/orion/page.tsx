import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/SeoLandingPage';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Orion AI | Trading Mentor AI',
  description: 'Meet Orion AI, the internal trading mentor that explains analysis, platform workflows, market structure, support, and risk concepts.',
  path: '/orion',
  image: '/og/tradevision-ai-orion.png',
});

export default function OrionSeoPage() {
  return (
    <SeoLandingPage
      eyebrow="Orion AI"
      title="Trading mentor AI for learning faster and navigating TradeVision."
      description="Orion AI is page-aware, user-aware, and built into TradeVision to explain chart analysis, market structure, risk concepts, support workflows, and platform navigation."
      cta="Meet Orion AI"
      sections={[
        { title: 'Page-aware guidance', body: 'Orion understands the workspace you are using and can route you to analysis, radar, journal, support, billing, or education.', href: '/analysis', linkLabel: 'Try analysis' },
        { title: 'Trading education', body: 'Ask Orion to explain market structure, confirmation, risk, overtrading, journaling, and platform tools in plain language.', href: '/market-structure', linkLabel: 'Learn structure' },
        { title: 'Support workflow', body: 'If Orion does not know an answer, it can help open a support ticket so users are not left stuck.', href: '/help', linkLabel: 'Get help' },
        { title: 'Analysis companion', body: 'Orion can explain chart reads and help users turn analysis into monitored setups or journal lessons.', href: '/trade-radar', linkLabel: 'Use Trade Radar' },
      ]}
    />
  );
}
