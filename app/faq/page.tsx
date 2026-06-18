import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoJsonLd } from '@/components/SeoJsonLd';
import { faqItems, faqSchema, makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'FAQ | TradeVision AI',
  description: 'Answers to common questions about TradeVision AI, AI chart analysis, Trade Radar, Orion AI, forex, synthetic indices, and accuracy.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <div className="bg-[#F7F9FC] px-4 py-16 text-[#111827]">
      <SeoJsonLd data={faqSchema} />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#2563EB]">FAQ</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">TradeVision AI frequently asked questions</h1>
        <p className="mt-4 text-lg leading-8 text-[#4B5563]">Learn how AI chart analysis, Orion AI, Trade Radar, forex analysis, and synthetic indices analysis work inside TradeVision.</p>
        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
              <h2 className="text-xl font-extrabold">{item.question}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4B5563]">{item.answer}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/analysis" className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-extrabold text-white">AI Chart Analysis</Link>
          <Link href="/trade-radar" className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-extrabold">Trade Radar</Link>
          <Link href="/orion" className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-extrabold">Orion AI</Link>
        </div>
      </div>
    </div>
  );
}
