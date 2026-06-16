'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bell, Bookmark, CalendarDays, Heart, MessageCircle, MoreHorizontal, Repeat2, Share2, Sparkles, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { UserAvatar } from '@/components/UserAvatar';

export function CleanCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)]', className)}>
      {children}
    </section>
  );
}

export function CleanStatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
}) {
  return (
    <CleanCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#6B7280]">{label}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#111827]">{value}</p>
        </div>
        {icon ? <div className="rounded-xl bg-[#EFF6FF] p-2.5 text-[#2563EB]">{icon}</div> : null}
      </div>
      {trend ? <p className="mt-3 text-xs font-semibold text-[#16A34A]">{trend}</p> : null}
    </CleanCard>
  );
}

export function CleanBadge({
  children,
  tone = 'blue',
}: {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
}) {
  const tones = {
    blue: 'bg-[#EFF6FF] text-[#2563EB]',
    green: 'bg-[#ECFDF5] text-[#16A34A]',
    amber: 'bg-[#FFFBEB] text-[#F59E0B]',
    red: 'bg-[#FEF2F2] text-[#EF4444]',
    gray: 'bg-[#F3F4F6] text-[#6B7280]',
  };
  return <span className={cn('inline-flex rounded-lg px-2.5 py-1 text-xs font-bold', tones[tone])}>{children}</span>;
}

export function CleanButton({
  children,
  href,
  variant = 'primary',
  className = '',
  onClick,
}: {
  children: ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  onClick?: () => void;
}) {
  const classes = cn(
    'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition',
    variant === 'primary' && 'bg-[#2563EB] text-white shadow-[0_10px_22px_rgba(37,99,235,0.2)] hover:bg-[#1D4ED8]',
    variant === 'secondary' && 'border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#2563EB] hover:text-[#2563EB]',
    variant === 'ghost' && 'bg-transparent text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]',
    className,
  );

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }

  return <button type="button" onClick={onClick} className={classes}>{children}</button>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-[#111827] sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-[#6B7280]">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MarketOverviewWidget() {
  const rows = [
    ['Forex', 'EUR/USD steady near resistance', '+0.18%', 'green'],
    ['Crypto', 'BTC consolidating after impulse', '-0.42%', 'red'],
    ['Indices', 'NASDAQ momentum improving', '+0.31%', 'green'],
    ['Commodities', 'Gold holding demand zone', '+0.24%', 'green'],
  ] as const;

  return (
    <CleanCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-extrabold text-[#111827]">Market Overview</h2>
        <TrendingUp className="h-4 w-4 text-[#2563EB]" />
      </div>
      <div className="space-y-3">
        {rows.map(([market, note, change, tone]) => (
          <div key={market} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F9FC] p-3">
            <div>
              <p className="text-sm font-bold text-[#111827]">{market}</p>
              <p className="text-xs text-[#6B7280]">{note}</p>
            </div>
            <span className={cn('text-xs font-extrabold', tone === 'green' ? 'text-[#16A34A]' : 'text-[#EF4444]')}>{change}</span>
          </div>
        ))}
      </div>
    </CleanCard>
  );
}

export function EventsWidget() {
  const events = [
    ['FOMC Meeting', 'May 24, 2:00 PM EST', 'High'],
    ['GDP Data Release', 'May 28, 8:30 AM EST', 'Medium'],
    ['Monthly Market Outlook', 'May 31, 7:00 PM EST', 'Platform'],
  ];
  return (
    <CleanCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-extrabold text-[#111827]">Upcoming Events</h2>
        <Link href="/dashboard/events" className="text-xs font-bold text-[#2563EB]">View all</Link>
      </div>
      <div className="space-y-3">
        {events.map(([title, time, impact]) => (
          <div key={title} className="flex gap-3 rounded-xl border border-[#E5E7EB] p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#111827]">{title}</p>
              <p className="text-xs text-[#6B7280]">{time}</p>
              <button className="mt-1 text-xs font-bold text-[#2563EB]">Set reminder</button>
            </div>
            <CleanBadge tone={impact === 'High' ? 'red' : impact === 'Medium' ? 'amber' : 'blue'}>{impact}</CleanBadge>
          </div>
        ))}
      </div>
    </CleanCard>
  );
}

export function ActiveOpportunitiesWidget() {
  const opportunities = [
    ['XAU/USD', 'Approaching Key Level', 'Buy Zone', '82%', '12 pips'],
    ['GBP/JPY', 'Monitoring Breakout', 'Watch', '74%', '28 pips'],
    ['BTC/USD', 'Trend Reversal Possible', 'Awaiting', '68%', '1.2%'],
  ];
  return (
    <CleanCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-extrabold text-[#111827]">Active Opportunities</h2>
        <Link href="/dashboard/radar" className="text-xs font-bold text-[#2563EB]">View Radar</Link>
      </div>
      <div className="space-y-3">
        {opportunities.map(([symbol, setup, status, confidence, distance]) => (
          <div key={symbol} className="flex items-center gap-3 rounded-xl bg-[#F7F9FC] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-[#2563EB] shadow-sm">{symbol.slice(0, 1)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-[#111827]">{symbol}</p>
              <p className="truncate text-xs text-[#6B7280]">{setup}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#16A34A]">{status}</p>
              <p className="text-[11px] text-[#6B7280]">{confidence} · {distance}</p>
            </div>
          </div>
        ))}
      </div>
    </CleanCard>
  );
}

export function FeedPostCard({
  author = 'AlphaTrader',
  authorId,
  authorAvatar,
  authorSubscription,
  market = 'EUR/USD 4H',
  summary = 'Strong bullish structure forming near resistance. Watching for a clean breakout and retest.',
  image,
  timeLabel = '2h ago',
  onAiCompare,
  canAiCompare = Boolean(image),
}: {
  author?: string;
  authorId?: string;
  authorAvatar?: string | null;
  authorSubscription?: string | null;
  market?: string;
  summary?: string;
  image?: string;
  timeLabel?: string;
  onAiCompare?: () => void;
  canAiCompare?: boolean;
}) {
  return (
    <CleanCard className="p-0">
      <div className="flex items-start gap-3 p-5">
        <Link href={authorId ? `/profile/${encodeURIComponent(authorId)}` : '#'} className={!authorId ? 'pointer-events-none' : ''}>
          <UserAvatar name={author} avatarUrl={authorAvatar} className="h-10 w-10 text-sm font-extrabold" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={authorId ? `/profile/${encodeURIComponent(authorId)}` : '#'} className={`font-extrabold text-[#111827] hover:text-[#2563EB] ${!authorId ? 'pointer-events-none' : ''}`}>{author}</Link>
            <VerifiedBadge subscription={authorSubscription} />
            <CleanBadge tone="green">Bullish</CleanBadge>
          </div>
          <p className="text-xs text-[#6B7280]">{timeLabel} · {market}</p>
          <p className="mt-3 text-sm leading-6 text-[#111827]">{summary}</p>
        </div>
        <button className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6]"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      <div className="mx-5 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#0B1220]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${market} chart`} className="h-64 w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-64 items-center justify-center bg-[linear-gradient(135deg,#0B1220,#172554)] text-[#60A5FA]">
            <Star className="h-12 w-12" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 text-sm text-[#6B7280] sm:grid-cols-5">
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-[#F3F4F6]"><Heart className="h-4 w-4" />45</button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-[#F3F4F6]"><MessageCircle className="h-4 w-4" />12</button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-[#F3F4F6]"><Share2 className="h-4 w-4" />Share</button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-[#F3F4F6]"><Bookmark className="h-4 w-4" />Save</button>
        <button
          type="button"
          onClick={onAiCompare}
          disabled={!canAiCompare}
          className="flex items-center justify-center gap-2 rounded-xl py-2 font-bold text-[#2563EB] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:hover:bg-transparent"
        >
          <Sparkles className="h-4 w-4" />AI Compare
        </button>
      </div>
    </CleanCard>
  );
}

export function OrionWidget() {
  return (
    <CleanCard className="text-center">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-extrabold text-[#111827]">Orion AI</h2>
        <Bell className="h-4 w-4 text-[#6B7280]" />
      </div>
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] shadow-[0_0_0_12px_rgba(37,99,235,0.06)]">
        <Star className="h-10 w-10" />
      </div>
      <h3 className="mt-6 text-lg font-extrabold text-[#111827]">Hi, Trader</h3>
      <p className="mt-1 text-sm text-[#6B7280]">How can I help you today?</p>
      <div className="mt-5 space-y-2 text-left">
        {['Analyze this chart', 'Explain market structure', 'Find trading opportunities'].map((item) => (
          <Link key={item} href="/dashboard/orion" className="block rounded-xl bg-[#F7F9FC] px-4 py-3 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF]">{item}</Link>
        ))}
      </div>
      <CleanButton href="/dashboard/orion" className="mt-4 w-full">Chat with Orion</CleanButton>
    </CleanCard>
  );
}

export function CommentBox() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3">
      <div className="h-9 w-9 rounded-full bg-[#DBEAFE]" />
      <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]" placeholder="Write a comment..." />
      <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white">Post</button>
    </div>
  );
}

export function SimpleChartCard() {
  return (
    <div className="rounded-2xl bg-[#0B1220] p-4 text-white">
      <div className="mb-3 flex justify-between text-xs text-white/60">
        <span>EUR/USD 4H</span>
        <span>Resistance</span>
      </div>
      <div className="relative h-44 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#101827,#172554)]">
        <svg viewBox="0 0 420 180" className="h-full w-full">
          <path d="M10 120 L60 98 L105 128 L155 80 L205 96 L260 58 L310 88 L360 48 L410 70" fill="none" stroke="#60A5FA" strokeWidth="4" />
          <path d="M30 135 H390" stroke="#16A34A" strokeDasharray="6 6" />
          <path d="M30 45 H390" stroke="#EF4444" strokeDasharray="6 6" />
        </svg>
      </div>
    </div>
  );
}
