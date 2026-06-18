import type { Metadata } from 'next';
import Link from 'next/link';
import { blogArticles, makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Trading AI Blog | TradeVision AI',
  description: 'Read TradeVision AI articles about AI trading analysis, chart analysis, forex, gold, synthetic indices, market structure, Trade Radar, and Orion AI.',
  path: '/blog',
});

export default function BlogPage() {
  return (
    <div className="bg-[#F7F9FC] px-4 py-16 text-[#111827]">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#2563EB]">Blog</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">AI trading analysis guides</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#4B5563]">Starter articles for traders learning AI chart analysis, market structure, forex risk management, gold analysis, synthetic indices, Trade Radar, and Orion AI.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {blogArticles.map((article) => (
            <article key={article.slug} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#2563EB]">{article.focusKeyword}</p>
              <h2 className="mt-3 text-xl font-extrabold">{article.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4B5563]">{article.excerpt}</p>
              <Link href={`/blog/${article.slug}`} className="mt-5 inline-flex text-sm font-extrabold text-[#2563EB]">Read article</Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
