import type { Metadata } from 'next';
import Link from 'next/link';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Contact TradeVision AI',
  description: 'Contact TradeVision AI support for product questions, billing, account help, chart upload issues, and platform guidance.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="bg-[#F7F9FC] px-4 py-16 text-[#111827]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_10px_30px_rgba(17,24,39,0.06)]">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em]">Contact TradeVision AI</h1>
        <p className="mt-4 text-lg leading-8 text-[#4B5563]">Need help with analysis, Orion AI, billing, Trade Radar, community, or your account? Open support from your dashboard or review common answers first.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/support" className="inline-flex h-12 items-center rounded-xl bg-[#2563EB] px-6 text-sm font-extrabold text-white">Open Support</Link>
          <Link href="/faq" className="inline-flex h-12 items-center rounded-xl border border-[#E5E7EB] px-6 text-sm font-extrabold text-[#111827]">Read FAQ</Link>
          <Link href="/pricing" className="inline-flex h-12 items-center rounded-xl border border-[#E5E7EB] px-6 text-sm font-extrabold text-[#111827]">View Pricing</Link>
        </div>
      </div>
    </div>
  );
}
