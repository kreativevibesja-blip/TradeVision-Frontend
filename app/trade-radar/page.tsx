import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/SeoLandingPage';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Trade Radar | Trading Setup Monitoring',
  description: 'Trade Radar monitors AI analysis setups by status, confidence, distance to entry, reminders, and timeline updates.',
  path: '/trade-radar',
  image: '/og/tradevision-ai-trade-radar.png',
});

export default function TradeRadarSeoPage() {
  return (
    <SeoLandingPage
      eyebrow="Trade Radar"
      title="Monitor trading opportunities instead of chasing entries."
      description="Trade Radar helps traders track setups created from AI analysis through watching, approaching zone, awaiting confirmation, entry ready, active, and invalidated states."
      cta="Activate Trade Radar"
      sections={[
        { title: 'Setup status tracking', body: 'Follow each idea from watching to entry ready with visible confidence and timeline notes.', href: '/blog/how-trade-radar-helps-traders-wait-for-confirmation', linkLabel: 'Read the guide' },
        { title: 'Distance to entry', body: 'See how close active opportunities are to planned zones so you can wait with more discipline.', href: '/analysis', linkLabel: 'Create analysis' },
        { title: 'Reminder workflow', body: 'Use reminders and alerts to revisit opportunities without staring at charts all day.', href: '/features', linkLabel: 'View features' },
        { title: 'Dashboard widgets', body: 'Active opportunities on the dashboard are pulled from Trade Radar setups, not separate scans.', href: '/dashboard', linkLabel: 'Open dashboard' },
      ]}
    />
  );
}
