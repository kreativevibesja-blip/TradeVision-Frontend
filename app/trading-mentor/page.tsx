import type { Metadata } from 'next';
import { ProgrammaticSeoPage } from '@/components/ProgrammaticSeoPage';
import { makeMetadata, programmaticSeoPages } from '@/lib/seo';

const page = programmaticSeoPages.find((item) => item.slug === 'trading-mentor')!;

export const metadata: Metadata = makeMetadata({
  title: page.metaTitle,
  description: page.description,
  path: '/trading-mentor',
  keywords: [page.keyword, 'Orion AI', 'AI trading mentor', 'trading AI assistant'],
});

export default function TradingMentorPage() {
  return <ProgrammaticSeoPage h1={page.h1} description={page.description} keyword={page.keyword} cta={page.cta} />;
}
