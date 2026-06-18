import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/SeoLandingPage';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'AI Chart Analysis | Upload Trading Chart Screenshots',
  description: 'Upload forex, gold, crypto, indices, or synthetic indices screenshots and get AI-powered trading chart analysis.',
  path: '/analysis',
});

export default function AnalysisSeoPage() {
  return (
    <SeoLandingPage
      eyebrow="AI Chart Analysis"
      title="Upload a trading chart and get a structured AI market read."
      description="TradeVision AI reviews chart screenshots for market bias, structure, key levels, entry zones, invalidation, confidence, and explanation."
      cta="Upload Your First Chart"
      sections={[
        { title: 'Chart screenshot analysis', body: 'Use screenshots from any trading platform and get a structured read focused on visible price action.', href: '/analyze', linkLabel: 'Upload chart' },
        { title: 'Forex, gold, crypto and synthetic indices', body: 'TradeVision supports multiple markets so your analysis workflow stays consistent across asset classes.', href: '/forex-analysis', linkLabel: 'Forex analysis' },
        { title: 'Send ideas to Trade Radar', body: 'Strong analysis results can become monitored setups so you can wait for confirmation.', href: '/trade-radar', linkLabel: 'Track setups' },
        { title: 'Post to the Feed', body: 'Share analysis screenshots and AI summaries with the trading community for discussion.', href: '/community', linkLabel: 'View community' },
      ]}
    />
  );
}
