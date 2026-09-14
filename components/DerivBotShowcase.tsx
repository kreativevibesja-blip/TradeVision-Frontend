'use client';

import { Activity, Bot, CheckCircle2, CircleDollarSign, Gauge, Zap } from 'lucide-react';

const ticks = ['1', '7', '0', '1', '4', '8', '8', '7', '4', '2', '9', '6', '0', '0', '4', '1', '2', '1'];

export function DerivBotShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#050b18] px-4 py-16 text-white sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(20,109,255,0.2),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(0,207,190,0.13),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-200">
            <Bot className="h-3.5 w-3.5" /> Deriv automation
          </div>
          <h2 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.05em] sm:text-5xl">
            Your synthetic indices terminal, ready when the market moves.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Connect a Deriv account, choose an index, read the live digit flow, and send Matches or Differs bursts directly from one focused workspace.
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              ['Live ticks', Activity],
              ['Auto proposals', Gauge],
              ['Fast execution', Zap],
            ].map(([label, Icon]) => (
              <div key={label as string} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <Icon className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">{label as string}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[560px] items-center justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative w-[270px] rounded-[42px] border-[7px] border-slate-700 bg-black p-2 shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(20,184,166,0.18)] sm:w-[310px]">
            <div className="absolute left-1/2 top-2 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />
            <div className="overflow-hidden rounded-[32px] bg-[#081426]">
              <div className="flex items-center justify-between px-5 pb-2 pt-5 text-[10px] font-bold text-slate-400"><span>9:41</span><span>Deriv Bot</span><span>▮▮▮</span></div>
              <div className="border-b border-white/10 px-4 pb-4 pt-3"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">Connected</p><p className="mt-1 text-sm font-black">Volatility 100 (1s)</p></div><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-bold text-emerald-300">LIVE</span></div><div className="mt-4 flex items-end justify-between"><div><p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Balance</p><p className="mt-1 text-xl font-black">$842.16</p></div><div className="text-right"><p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Current</p><p className="mt-1 text-sm font-bold text-rose-300">840.119</p></div></div></div>
              <div className="px-4 pt-4"><div className="relative h-32 overflow-hidden rounded-xl border border-cyan-300/15 bg-[#050b18] p-3"><div className="absolute inset-x-3 top-1/2 border-t border-dashed border-slate-700" /><svg viewBox="0 0 260 100" className="h-full w-full" aria-label="Synthetic index price chart"><polyline points="0,70 18,62 34,72 50,42 66,48 82,28 98,44 114,34 130,62 146,54 162,68 178,40 194,50 210,30 228,38 246,18 260,26" fill="none" stroke="#22d3ee" strokeWidth="3" /><polyline points="0,86 260,86" fill="none" stroke="#334155" strokeWidth="1" /></svg><span className="absolute right-3 top-3 rounded bg-rose-400 px-1.5 py-1 text-[9px] font-black text-slate-950">840.119</span></div><div className="mt-4 grid grid-cols-5 gap-1.5">{ticks.slice(-10).map((tick, index) => <span key={`${tick}-${index}`} className={`flex h-8 items-center justify-center rounded-lg border text-xs font-black ${index === 9 ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900 text-white'}`}>{tick}</span>)}</div><div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3"><div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200">Automation ready</span><CheckCircle2 className="h-4 w-4 text-emerald-300" /></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-slate-400">DIFFERS 7</span><span className="font-black text-emerald-300">95.2% payout</span></div><button type="button" className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 text-xs font-black text-slate-950"><CircleDollarSign className="h-4 w-4" /> Execute burst</button></div><div className="flex items-center justify-between px-1 py-4 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500"><span>Demo account</span><span>5 trades queued</span></div></div>
            </div>
          </div>
          <div className="absolute bottom-14 right-[4%] hidden w-44 rounded-2xl border border-emerald-300/20 bg-[#0b1d29] p-4 shadow-2xl sm:block"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-300">Execution</p><p className="mt-2 text-sm font-black">3 contracts placed</p><p className="mt-1 text-xs text-slate-400">Balance-aware burst</p></div>
        </div>
      </div>
    </section>
  );
}
