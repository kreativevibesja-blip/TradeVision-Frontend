import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/SeoLandingPage';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Trading Community | Feed, Rooms & Shared Analysis',
  description: 'Join the TradeVision AI trading community to share chart ideas, AI analysis, Trade Radar setups, journal recaps, comments, and discussions.',
  path: '/community',
  image: '/og/tradevision-ai-community.png',
});

export default function CommunitySeoPage() {
  return (
    <SeoLandingPage
      eyebrow="Community"
      title="A clean trading community for chart ideas and discussion."
      description="TradeVision community combines a trading feed with focused rooms for forex, gold, crypto, indices, synthetic indices, beginners, trade reviews, and platform help."
      cta="Join The Community"
      sections={[
        { title: 'Trading Feed', body: 'Post chart screenshots, AI summaries, market tags, Trade Radar setups, and journal recaps with likes, comments, saves, and follows.', href: '/dashboard/feed', linkLabel: 'Open feed' },
        { title: 'Community Rooms', body: 'Discuss markets in focused channels without turning the platform into a noisy signal group.', href: '/dashboard/community', linkLabel: 'Open rooms' },
        { title: 'Learn From Traders', body: 'Profile pages make it easy to follow traders, message users, and review public posts.', href: '/blog/common-trading-mistakes-beginners-make', linkLabel: 'Read beginner guide' },
        { title: 'Moderated By Design', body: 'Automated moderation and admin review help keep the platform professional and trading-focused.', href: '/features', linkLabel: 'View features' },
      ]}
    />
  );
}
