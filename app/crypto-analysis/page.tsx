import type { Metadata } from 'next';
import { ProgrammaticSeoPage } from '@/components/ProgrammaticSeoPage';
import { makeMetadata, programmaticSeoPages } from '@/lib/seo';

const page = programmaticSeoPages.find((item) => item.slug === 'crypto-analysis')!;

export const metadata: Metadata = makeMetadata({
  title: page.metaTitle,
  description: page.description,
  path: '/crypto-analysis',
  keywords: [page.keyword, 'crypto trading analysis', 'AI chart analysis', 'trading AI assistant'],
});

export default function CryptoAnalysisPage() {
  return <ProgrammaticSeoPage h1={page.h1} description={page.description} keyword={page.keyword} cta={page.cta} />;
}
