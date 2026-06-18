import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogArticles, makeMetadata, siteUrl } from '@/lib/seo';
import { SeoJsonLd } from '@/components/SeoJsonLd';

type PageProps = { params: { slug: string } };

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const article = blogArticles.find((item) => item.slug === params.slug);
  if (!article) return {};
  return makeMetadata({
    title: article.metaTitle,
    description: article.metaDescription,
    path: `/blog/${article.slug}`,
    keywords: [article.focusKeyword, 'AI trading analysis', 'AI chart analysis', 'TradeVision AI'],
  });
}

export default function BlogArticlePage({ params }: PageProps) {
  const article = blogArticles.find((item) => item.slug === params.slug);
  if (!article) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    author: { '@type': 'Organization', name: 'TradeVision AI' },
    publisher: { '@type': 'Organization', name: 'TradeVision AI', logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.svg` } },
    mainEntityOfPage: `${siteUrl}/blog/${article.slug}`,
  };

  return (
    <article className="bg-[#F7F9FC] px-4 py-16 text-[#111827]">
      <SeoJsonLd data={articleSchema} />
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm font-extrabold text-[#2563EB]">Blog</Link>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">{article.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[#4B5563]">{article.excerpt}</p>
        <div className="mt-8 space-y-7">
          {article.sections.map(([heading, body]) => (
            <section key={heading} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
              <h2 className="text-2xl font-extrabold">{heading}</h2>
              <p className="mt-3 leading-8 text-[#4B5563]">{body}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/analysis" className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-extrabold text-white">Try AI Analysis</Link>
          <Link href="/trade-radar" className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-extrabold">Trade Radar</Link>
          <Link href="/orion" className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-extrabold">Orion AI</Link>
        </div>
      </div>
    </article>
  );
}
