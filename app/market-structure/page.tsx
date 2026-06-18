import type { Metadata } from 'next';
import { ProgrammaticSeoPage } from '@/components/ProgrammaticSeoPage';
import { makeMetadata, programmaticSeoPages } from '@/lib/seo';

const page = programmaticSeoPages.find((item) => item.slug === 'market-structure')!;

export const metadata: Metadata = makeMetadata({
  title: page.metaTitle,
  description: page.description,
  path: '/market-structure',
  keywords: [page.keyword, 'market structure analysis', 'AI trading mentor', 'trading education'],
});

export default function MarketStructurePage() {
  return <ProgrammaticSeoPage h1={page.h1} description={page.description} keyword={page.keyword} cta={page.cta} />;
}
