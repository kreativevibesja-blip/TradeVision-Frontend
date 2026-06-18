import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/SeoLandingPage';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Features | AI Chart Analysis, Trade Radar & Orion AI',
  description: 'Explore TradeVision AI features for AI chart analysis, Trade Radar monitoring, Orion AI mentorship, journaling, community, and trading workflow support.',
  path: '/features',
  image: '/og/tradevision-ai-features.png',
});

export default function FeaturesPage() {
  return (
    <SeoLandingPage
      eyebrow="Features"
      title="AI trading tools built for analysis, patience, and improvement."
      description="TradeVision AI combines chart screenshot analysis, Orion AI mentorship, Trade Radar, journaling, feed posts, community rooms, and support in one clean trading workspace."
      cta="Start Free"
      sections={[
        { title: 'AI Chart Analysis', body: 'Upload chart screenshots and receive a structured read of trend, market structure, key levels, risk zones, confidence, and explanation.', href: '/analysis', linkLabel: 'Explore analysis' },
        { title: 'Trade Radar', body: 'Monitor setups created from analysis so you can wait for confirmation instead of forcing entries.', href: '/trade-radar', linkLabel: 'View Trade Radar' },
        { title: 'Orion AI Mentor', body: 'Ask Orion to explain market concepts, guide platform workflows, create support tickets, and help you understand trading logic.', href: '/orion', linkLabel: 'Meet Orion' },
        { title: 'Community and Feed', body: 'Share chart ideas, post analysis, discuss markets in rooms, follow traders, and learn from community posts.', href: '/community', linkLabel: 'Join community' },
      ]}
    />
  );
}
