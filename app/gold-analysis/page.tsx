import type { Metadata } from 'next';
import { ProgrammaticSeoPage } from '@/components/ProgrammaticSeoPage';
import { makeMetadata, programmaticSeoPages } from '@/lib/seo';

const page = programmaticSeoPages.find((item) => item.slug === 'gold-analysis')!;

export const metadata: Metadata = makeMetadata({
  title: page.metaTitle,
  description: page.description,
  path: '/gold-analysis',
  keywords: [page.keyword, 'gold trading analysis', 'XAU/USD analysis', 'AI chart analysis'],
});

export default function GoldAnalysisPage() {
  return <ProgrammaticSeoPage h1={page.h1} description={page.description} keyword={page.keyword} cta={page.cta} />;
}
