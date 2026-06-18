import type { Metadata } from 'next';
import { ProgrammaticSeoPage } from '@/components/ProgrammaticSeoPage';
import { makeMetadata, programmaticSeoPages } from '@/lib/seo';

const page = programmaticSeoPages.find((item) => item.slug === 'synthetic-indices-analysis')!;

export const metadata: Metadata = makeMetadata({
  title: page.metaTitle,
  description: page.description,
  path: '/synthetic-indices-analysis',
  keywords: [page.keyword, 'Deriv synthetic indices', 'boom crash analysis', 'volatility indices analysis'],
});

export default function SyntheticIndicesAnalysisPage() {
  return <ProgrammaticSeoPage h1={page.h1} description={page.description} keyword={page.keyword} cta={page.cta} />;
}
