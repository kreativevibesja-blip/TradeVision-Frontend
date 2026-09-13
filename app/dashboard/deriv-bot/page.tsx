'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Link2, Loader2, ShieldCheck, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type DerivBotAccount, type DerivBotProposal, type DerivBotScan, type DerivBotTick, type DerivBotTrade } from '@/lib/api';

const formatBalance = (account: DerivBotAccount) => account.balance == null
  ? 'Balance available after account session starts'
  : `${account.currency} ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DerivBotPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<DerivBotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [symbol, setSymbol] = useState('R_75');
  const [ticks, setTicks] = useState<DerivBotTick[]>([]);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [scan, setScan] = useState<DerivBotScan | null>(null);
  const [scanning, setScanning] = useState(false);
  const [trading, setTrading] = useState(false);
  const [stake, setStake] = useState('1');
  const [matchesDigit, setMatchesDigit] = useState(0);
  const [matchProposal, setMatchProposal] = useState<DerivBotProposal | null>(null);
  const [diffProposal, setDiffProposal] = useState<DerivBotProposal | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [trades, setTrades] = useState<DerivBotTrade[]>([]);
  const [stats, setStats] = useState({ trades: 0, wins: 0, losses: 0, winRate: 0, stakeTotal: 0, profitTotal: 0 });
  const [pendingRealTrade, setPendingRealTrade] = useState<'DIGITMATCH' | 'DIGITDIFF' | null>(null);

  const loadAccounts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.derivBot.getAccounts(token);
      setAccounts(response.accounts);
      setSelectedAccount((current) => current || response.accounts[0]?.id || '');
    } catch (loadError: any) {
      setError(loadError?.message || 'Unable to load Deriv accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && token) void loadAccounts();
  }, [authLoading, token]);

  useEffect(() => {
    if (!token || !selectedAccount) return;
    let active = true;
    const loadSession = async () => {
      try {
        const response = await api.derivBot.selectAccount({ accountId: selectedAccount, symbol }, token);
        if (active) { setTicks(response.session.ticks); setLiveBalance(response.session.balance); }
      } catch (sessionError: any) {
        if (active) setError(sessionError?.message || 'Unable to open the Deriv account session.');
      }
    };
    void loadSession();
    const interval = window.setInterval(async () => {
      try {
        const response = await api.derivBot.getSession(selectedAccount, token);
        if (active) { setTicks(response.session.ticks); setLiveBalance(response.session.balance); }
      } catch { /* the next refresh will retry the server session */ }
    }, 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, [selectedAccount, symbol, token]);

  useEffect(() => {
    if (!scanning) { setScanProgress(0); return; }
    const interval = window.setInterval(() => setScanProgress((value) => Math.min(92, value + 7)), 80);
    return () => window.clearInterval(interval);
  }, [scanning]);

  useEffect(() => {
    if (!token || !selectedAccount || !ticks.length) return;
    let active = true;
    const refreshProposals = async () => {
      try {
        const [matches, differs] = await Promise.all([
          api.derivBot.getProposal({ accountId: selectedAccount, contractType: 'DIGITMATCH', digit: matchesDigit, stake: Number(stake), duration: 1 }, token),
          scan?.targetDigit == null ? Promise.resolve(null) : api.derivBot.getProposal({ accountId: selectedAccount, contractType: 'DIGITDIFF', digit: scan.targetDigit, stake: Number(stake), duration: 1 }, token),
        ]);
        if (active) { setMatchProposal(matches.proposal); setDiffProposal(differs?.proposal ?? null); }
      } catch { /* stale proposals remain unavailable rather than being fabricated */ }
    };
    void refreshProposals();
    const interval = window.setInterval(() => void refreshProposals(), 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [selectedAccount, symbol, matchesDigit, scan?.targetDigit, stake, ticks.length, token]);

  useEffect(() => {
    if (!token || !selectedAccount) return;
    let active = true;
    const loadTrades = async () => {
      try {
        const response = await api.derivBot.getTrades(selectedAccount, token);
        if (active) { setTrades(response.trades); setStats(response.stats); }
      } catch { /* reconnect/session errors are shown by the next trading action */ }
    };
    void loadTrades();
    const interval = window.setInterval(() => void loadTrades(), 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [selectedAccount, token]);

  const connect = async () => {
    if (!token) return;
    setConnecting(true);
    setError('');
    try {
      const response = await api.derivBot.connect(token);
      window.location.assign(response.authorizationUrl);
    } catch (connectError: any) {
      setError(connectError?.message || 'Unable to start Deriv authorization.');
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!token) return;
    try {
      await api.derivBot.disconnect(token);
      setAccounts([]);
      setSelectedAccount('');
    } catch (disconnectError: any) {
      setError(disconnectError?.message || 'Unable to disconnect Deriv.');
    }
  };

  const runScan = async () => {
    if (!token || !selectedAccount) return;
    setScanning(true);
    setScanProgress(8);
    setError('');
    try {
      const response = await api.derivBot.scan({ accountId: selectedAccount, stake: Number(stake), duration: 1 }, token);
      setScan(response.scan);
      setScanProgress(100);
    } catch (scanError: any) {
      setError(scanError?.message || 'Unable to scan the current Deriv ticks.');
    } finally { setScanning(false); }
  };

  const placeTrade = async (contractType: 'DIGITMATCH' | 'DIGITDIFF', confirmed = false) => {
    if (!token || !selectedAccount) return;
    if (contractType === 'DIGITDIFF' && (!scan || scan.status !== 'eligible' || scan.targetDigit == null)) return;
    const selectedAccountRecord = accounts.find((account) => account.id === selectedAccount);
    if (selectedAccountRecord?.accountType === 'real' && !confirmed) {
      setPendingRealTrade(contractType);
      return;
    }
    setTrading(true);
    setError('');
    try {
      await api.derivBot.trade({ accountId: selectedAccount, contractType, digit: contractType === 'DIGITDIFF' ? scan!.targetDigit! : matchesDigit, stake: Number(stake), duration: 1 }, token);
    } catch (tradeError: any) {
      setError(tradeError?.message || 'Unable to place the Deriv contract.');
    } finally { setTrading(false); }
  };

  const targetRepeated = scan?.targetDigit != null && ticks.slice(-10).filter((tick) => tick.digit === scan.targetDigit).length > 1;
  const activeTrade = trades.find((trade) => trade.result === 'open') ?? null;
  const pendingDigit = pendingRealTrade === 'DIGITDIFF' ? scan?.targetDigit : matchesDigit;
  const pendingRate = pendingRealTrade === 'DIGITDIFF' ? diffProposal?.payoutRate : matchProposal?.payoutRate;
  const digitCounts = Array.from({ length: 10 }, (_, digit) => ticks.filter((tick) => tick.digit === digit).length);
  const digitSampleSize = Math.max(ticks.length, 1);
  const currentTick = ticks.at(-1);

  if (authLoading || loading) {
    return <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  if (!user || !token) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><Card><CardContent className="p-8 text-center">Sign in to connect a Deriv account.</CardContent></Card></div>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 bg-[#070d1b] px-3 py-5 text-slate-100 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">TradeVision</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Deriv Bot</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Live Deriv Options terminal with verified proposals and manual Matches or Differs execution.</p>
        </div>
        <Button onClick={connect} disabled={connecting} className="gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400">
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Connect Deriv
        </Button>
      </header>

      {error ? <div className="flex items-start gap-3 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}

      {!accounts.length ? (
        <Card className="border-slate-800 bg-[#0d1728]"><CardContent className="p-8">
          <div className="flex items-start gap-4"><ShieldCheck className="mt-1 h-6 w-6 text-cyan-400" /><div><h2 className="text-xl font-bold text-white">Connect through Deriv OAuth</h2><p className="mt-2 max-w-xl text-sm text-slate-400">TradeVision never asks for your Deriv password and never sends OAuth credentials to your browser.</p></div></div>
        </CardContent></Card>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-white">Deriv accounts</h2><p className="mt-1 text-sm text-slate-400">The selected account determines Demo or Real trading.</p></div><Button variant="outline" onClick={disconnect} className="gap-2 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"><Unplug className="h-4 w-4" />Disconnect</Button></div>
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => <button key={account.id} type="button" onClick={() => setSelectedAccount(account.id)} className={`rounded-xl border p-4 text-left transition ${selectedAccount === account.id ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_24px_rgba(34,211,238,0.1)]' : 'border-slate-800 bg-[#0d1728] hover:border-slate-600'}`}>
              <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{account.accountType}</span><span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">{account.currency}</span></div>
              <p className="mt-4 font-mono text-sm text-slate-300">{account.maskedAccountId}</p>
              <p className="mt-3 text-sm font-semibold text-white">{formatBalance(account)}</p>
              {account.accountType === 'real' ? <p className="mt-2 text-xs font-semibold text-amber-400">This account uses real funds.</p> : null}
            </button>)}
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0d1728] p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{accounts.find((account) => account.id === selectedAccount)?.accountType || 'Deriv'} account</p><span className="text-xs text-cyan-400">{accounts.find((account) => account.id === selectedAccount)?.currency || ''}</span></div><p className="mt-2 text-2xl font-black text-white">{liveBalance == null ? 'Connecting...' : liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
          <Card className="border-slate-800 bg-[#0d1728] text-white"><CardHeader><CardTitle className="text-white">Trading terminal</CardTitle></CardHeader><CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><label className="text-sm font-semibold text-slate-300">Market<input value={symbol} onChange={(event) => setSymbol(event.target.value.trim().toUpperCase())} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-[#091221] px-3 font-mono text-white" /></label><label className="text-sm font-semibold text-slate-300">Stake<input value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-[#091221] px-3 text-white" /></label><Button onClick={runScan} disabled={scanning || !ticks.length} className="h-11 gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400">{scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}AI Scan</Button></div>
            {scanning ? <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100" aria-label="Scanning Deriv ticks"><div className="h-full bg-blue-600 transition-[width] duration-75" style={{ width: `${scanProgress}%` }} /></div> : null}
            <div className="py-2 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Current tick</p><p className="mt-1 text-3xl font-black text-rose-400">{currentTick?.quote == null ? '-' : currentTick.quote}</p></div>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">{digitCounts.map((count, digit) => { const percentage = (count / digitSampleSize) * 100; const isTarget = scan?.targetDigit === digit; const isLatest = currentTick?.digit === digit; return <div key={digit} className={`rounded-xl border p-2 text-center transition sm:p-3 ${isTarget ? 'border-amber-300 bg-amber-400/15 shadow-[0_0_18px_rgba(251,191,36,0.18)]' : isLatest ? 'border-cyan-300 bg-cyan-400/10' : 'border-slate-700 bg-[#091221]'}`}><p className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-black sm:h-12 sm:w-12 ${isTarget ? 'border-amber-300 bg-amber-400 text-slate-950' : isLatest ? 'border-cyan-300 text-cyan-200' : 'border-slate-700 text-white'}`}>{digit}</p><p className="mt-2 text-xs text-slate-400">{percentage.toFixed(1)}%</p></div>; })}</div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live ticks</p><div className="mt-3 flex min-h-12 items-center justify-end gap-2 overflow-hidden">{ticks.slice(-20).map((tick, index) => <span key={`${tick.epoch}-${index}`} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-black ${scan?.targetDigit === tick.digit ? 'border-amber-300 bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.55)]' : 'border-slate-700 bg-slate-900 text-white'}`}>{tick.digit}</span>)}</div></div>
            <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">TradeVision AI Scan</p><p className="mt-3 text-lg font-bold text-slate-950">{scan?.targetDigit == null ? 'No qualifying setup' : `DIFFERS ${scan.targetDigit}`}</p><p className="mt-2 text-sm text-slate-600">{scan?.reason || 'Scan the live tick sample for an actual Deriv proposal and statistical setup.'}</p>{scan ? <div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><span className="text-slate-400">Payout</span><strong className="mt-1 block">{scan.payoutRate == null ? '-' : `${scan.payoutRate}%`}</strong></div><div><span className="text-slate-400">Sample</span><strong className="mt-1 block">{scan.sampleSize}</strong></div><div><span className="text-slate-400">Recent</span><strong className="mt-1 block">{scan.targetOccurrences}</strong></div></div> : null}</div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Matches digit</p><div className="mt-3 flex flex-wrap gap-2">{Array.from({ length: 10 }, (_, digit) => <button key={digit} type="button" onClick={() => setMatchesDigit(digit)} className={`h-9 w-9 rounded-lg border text-sm font-bold ${matchesDigit === digit ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200'}`}>{digit}</button>)}</div></div></div>
            {targetRepeated ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Target digit repeated. Scan again before considering Differs.</div> : null}
            <div className="grid gap-3 sm:grid-cols-2"><Button disabled={trading} onClick={() => void placeTrade('DIGITMATCH')} className="h-12 bg-emerald-600 text-white hover:bg-emerald-700">MATCHES {matchesDigit} {matchProposal?.payoutRate == null ? '' : `${matchProposal.payoutRate}% payout`}</Button><Button disabled={trading || scan?.status !== 'eligible' || targetRepeated} onClick={() => void placeTrade('DIGITDIFF')} className="h-12 bg-rose-600 text-white hover:bg-rose-700">DIFFERS {scan?.targetDigit ?? '-'} {diffProposal?.payoutRate == null ? '' : `${diffProposal.payoutRate}% payout`}</Button></div>
            <p className="text-xs text-slate-500">Rates are actual Deriv proposal payout rates and refresh before execution. Differs requires the configured 95% minimum payout rate.</p>
            {activeTrade ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Active contract</p><div className="mt-2 flex flex-wrap justify-between gap-3 text-sm"><strong>{activeTrade.symbol} {activeTrade.contract_type === 'DIGITDIFF' ? 'DIFFERS' : 'MATCHES'} {activeTrade.digit}</strong><span>Stake: {activeTrade.stake}</span><span>Contract: {activeTrade.contract_id || '-'}</span></div><p className="mt-2 text-sm text-blue-800">OPEN. Waiting for the live Deriv settlement.</p></div> : null}
            <p className="text-xs text-slate-500">Selected account: {accounts.find((account) => account.id === selectedAccount)?.maskedAccountId || 'None'}</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Today</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-5"><div><p className="text-xs text-slate-500">Trades</p><p className="mt-1 text-xl font-black">{stats.trades}</p></div><div><p className="text-xs text-slate-500">Wins</p><p className="mt-1 text-xl font-black text-emerald-600">{stats.wins}</p></div><div><p className="text-xs text-slate-500">Losses</p><p className="mt-1 text-xl font-black text-rose-600">{stats.losses}</p></div><div><p className="text-xs text-slate-500">Win rate</p><p className="mt-1 text-xl font-black">{stats.winRate}%</p></div><div><p className="text-xs text-slate-500">Profit/loss</p><p className={`mt-1 text-xl font-black ${stats.profitTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{stats.profitTotal >= 0 ? '+' : ''}{stats.profitTotal.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardHeader><CardTitle>Transactions</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-6 py-4">Contract</th><th className="px-6 py-4">Symbol</th><th className="px-6 py-4">Stake</th><th className="px-6 py-4">Payout rate</th><th className="px-6 py-4">Result</th><th className="px-6 py-4">Profit/Loss</th></tr></thead><tbody>{trades.map((trade) => <tr key={trade.id} className="border-b border-slate-100 last:border-0"><td className="px-6 py-4 font-semibold">{trade.contract_type === 'DIGITDIFF' ? 'DIFFERS' : 'MATCHES'} {trade.digit}</td><td className="px-6 py-4 font-mono">{trade.symbol}</td><td className="px-6 py-4">{trade.stake.toFixed(2)}</td><td className="px-6 py-4">{trade.payout_rate == null ? '-' : `${trade.payout_rate}%`}</td><td className={`px-6 py-4 font-bold ${trade.result === 'win' ? 'text-emerald-600' : trade.result === 'loss' ? 'text-rose-600' : 'text-blue-600'}`}>{trade.result?.toUpperCase() || 'OPEN'}</td><td className={`px-6 py-4 font-semibold ${(trade.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.profit == null ? '-' : `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}`}</td></tr>)}</tbody></table>{!trades.length ? <p className="p-6 text-sm text-slate-500">Completed Deriv contracts will appear here.</p> : null}</CardContent></Card>
          {pendingRealTrade ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Real account selected</p><h2 className="mt-2 text-2xl font-black text-slate-950">Confirm real-money trade</h2><p className="mt-3 text-sm leading-6 text-slate-600">You are about to place a {pendingRealTrade === 'DIGITDIFF' ? 'Differs' : 'Matches'} contract on {symbol} using {stake} stake. Current payout rate: {pendingRate == null ? 'unavailable' : `${pendingRate}%`}.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setPendingRealTrade(null)}>Cancel</Button><Button className="bg-rose-600 text-white hover:bg-rose-700" disabled={trading} onClick={() => { const next = pendingRealTrade; setPendingRealTrade(null); void placeTrade(next, true); }}>Confirm Trade</Button></div></div></div> : null}
        </section>
      )}
    </main>
  );
}
