import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/SeoLandingPage';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Trading Journal | Review Trades With Orion AI',
  description: 'Use the TradeVision journal to log trades, chart screenshots, emotions, outcomes, RR, and Orion AI consistency insights.',
  path: '/journal',
});

export default function JournalSeoPage() {
  return (
    <SeoLandingPage
      eyebrow="Trading Journal"
      title="Turn trade history into a better trading process."
      description="The TradeVision journal helps traders attach screenshots, tag emotions, track outcomes, review RR, and use Orion AI insights to improve consistency."
      cta="Start Journaling"
      sections={[
        { title: 'Log every important trade', body: 'Save market, session, outcome, RR, chart screenshots, emotions, and notes in one clean workflow.', href: '/dashboard/journal', linkLabel: 'Open journal' },
        { title: 'Review recurring mistakes', body: 'Use journal insights to identify early entries, overtrading, weak confirmation, and risk issues.', href: '/blog/common-trading-mistakes-beginners-make', linkLabel: 'Read mistakes guide' },
        { title: 'Connect analysis to review', body: 'AI analysis and Trade Radar setups can become journal lessons after the trade plays out.', href: '/analysis', linkLabel: 'Analyze chart' },
        { title: 'Improve consistency', body: 'Orion AI can explain journal patterns and help users create a more repeatable trading routine.', href: '/orion', linkLabel: 'Meet Orion' },
      ]}
    />
  );
}
