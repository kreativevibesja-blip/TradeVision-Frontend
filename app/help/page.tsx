import type { Metadata } from 'next';
import Link from 'next/link';
import { makeMetadata } from '@/lib/seo';

export const metadata: Metadata = makeMetadata({
  title: 'Help Center | TradeVision AI Support',
  description: 'Get help with AI chart analysis, Orion AI, Trade Radar, billing, community, journal, account settings, and support tickets.',
  path: '/help',
});

export default function HelpPage() {
  const links = [
    ['AI chart analysis', '/analysis'],
    ['Trade Radar', '/trade-radar'],
    ['Orion AI', '/orion'],
    ['FAQ', '/faq'],
    ['Contact support', '/contact'],
    ['Pricing', '/pricing'],
  ];

  return (
    <div className="bg-[#F7F9FC] px-4 py-16 text-[#111827]">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em]">TradeVision AI Help Center</h1>
        <p className="mt-4 text-lg leading-8 text-[#4B5563]">Find support for chart uploads, AI analysis, Orion AI, Trade Radar, billing, community, and journal workflows.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-sm font-extrabold text-[#2563EB] shadow-[0_10px_30px_rgba(17,24,39,0.05)]">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
