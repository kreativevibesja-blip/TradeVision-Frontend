'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, Link2, Loader2, ShieldCheck, Unplug, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type DerivBotAccount, type DerivBotProposal, type DerivBotScan, type DerivBotTick, type DerivBotTrade } from '@/lib/api';

const formatBalance = (account: DerivBotAccount) => account.balance == null
  ? 'Balance available after account session starts'
  : `${account.currency} ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DERIV_INDICES = [
  { label: 'Volatility 10 Index', symbol: 'R_10', group: 'Volatility indices' },
  { label: 'Volatility 25 Index', symbol: 'R_25', group: 'Volatility indices' },
  { label: 'Volatility 50 Index', symbol: 'R_50', group: 'Volatility indices' },
  { label: 'Volatility 75 Index', symbol: 'R_75', group: 'Volatility indices' },
  { label: 'Volatility 100 Index', symbol: 'R_100', group: 'Volatility indices' },
  { label: 'Volatility 10 (1s) Index', symbol: '1HZ10V', group: '1-second indices' },
  { label: 'Volatility 25 (1s) Index', symbol: '1HZ25V', group: '1-second indices' },
  { label: 'Volatility 50 (1s) Index', symbol: '1HZ50V', group: '1-second indices' },
  { label: 'Volatility 75 (1s) Index', symbol: '1HZ75V', group: '1-second indices' },
  { label: 'Volatility 100 (1s) Index', symbol: '1HZ100V', group: '1-second indices' },
  { label: 'Jump 10 Index', symbol: 'JD10', group: 'Jump indices' },
  { label: 'Jump 25 Index', symbol: 'JD25', group: 'Jump indices' },
  { label: 'Jump 50 Index', symbol: 'JD50', group: 'Jump indices' },
  { label: 'Jump 75 Index', symbol: 'JD75', group: 'Jump indices' },
  { label: 'Jump 100 Index', symbol: 'JD100', group: 'Jump indices' },
  { label: 'Step Index', symbol: 'stpRNG', group: 'Other indices' },
  { label: 'Drift Switching Index', symbol: 'DSI', group: 'Other indices' },
  { label: 'Range Break 100 Index', symbol: 'RB100', group: 'Other indices' },
  { label: 'Range Break 200 Index', symbol: 'RB200', group: 'Other indices' },
  { label: 'Bull Market Index', symbol: 'RDBULL', group: 'Other indices' },
  { label: 'Bear Market Index', symbol: 'RDBEAR', group: 'Other indices' },
];

const DERIV_INDEX_GROUPS = [...new Set(DERIV_INDICES.map((index) => index.group))];

const getTickDigit = (tick: DerivBotTick, selectedSymbol: string) => {
  const digits = String(tick.quote).replace(/[^0-9]/g, '');
  const digit = Number(digits.at(-1));
  return Number.isInteger(digit) ? digit : tick.digit;
};

export default function DerivBotPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<DerivBotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [symbol, setSymbol] = useState('R_75');
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const [ticks, setTicks] = useState<DerivBotTick[]>([]);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [scan, setScan] = useState<DerivBotScan | null>(null);
  const [scanning, setScanning] = useState(false);
  const [trading, setTrading] = useState(false);
  const [stake, setStake] = useState('1');
  const [selectedDigit, setSelectedDigit] = useState(0);
  const [matchProposal, setMatchProposal] = useState<DerivBotProposal | null>(null);
  const [diffProposal, setDiffProposal] = useState<DerivBotProposal | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [trades, setTrades] = useState<DerivBotTrade[]>([]);
  const [stats, setStats] = useState({ trades: 0, wins: 0, losses: 0, winRate: 0, stakeTotal: 0, profitTotal: 0 });
  const [pendingRealTrade, setPendingRealTrade] = useState<'DIGITMATCH' | 'DIGITDIFF' | null>(null);
  const disconnectingRef = useRef(false);

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
    let latestEpoch = 0;
    const loadSession = async () => {
      try {
        const response = await api.derivBot.selectAccount({ accountId: selectedAccount, symbol }, token);
        const newestEpoch = response.session.ticks.at(-1)?.epoch ?? 0;
        if (active && newestEpoch >= latestEpoch) {
          latestEpoch = newestEpoch;
          setTicks(response.session.ticks);
          setLiveBalance(response.session.balance);
        }
      } catch (sessionError: any) {
        if (active) setError(sessionError?.message || 'Unable to open the Deriv account session.');
      }
    };
    void loadSession();
    const interval = window.setInterval(async () => {
      try {
        const response = await api.derivBot.getSession(selectedAccount, token);
        const newestEpoch = response.session.ticks.at(-1)?.epoch ?? 0;
        if (active && newestEpoch >= latestEpoch) {
          latestEpoch = newestEpoch;
          setTicks(response.session.ticks);
          setLiveBalance(response.session.balance);
        }
      } catch { /* the next refresh will retry the server session */ }
    }, 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, [selectedAccount, symbol, token]);

  useEffect(() => {
    if (!token || !selectedAccount) return;
    disconnectingRef.current = false;
    let inactivityTimer: number | null = null;
    const disconnectSession = () => {
      if (disconnectingRef.current) return;
      disconnectingRef.current = true;
      void api.derivBot.disconnectSession(selectedAccount, token).catch(() => undefined);
    };
    const armInactivityDisconnect = () => {
      if (inactivityTimer !== null) window.clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(disconnectSession, 5 * 60 * 1000);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') armInactivityDisconnect();
      else if (inactivityTimer !== null) window.clearTimeout(inactivityTimer);
    };
    const handlePageHide = () => disconnectSession();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      if (inactivityTimer !== null) window.clearTimeout(inactivityTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      disconnectSession();
    };
  }, [selectedAccount, token]);

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
          api.derivBot.getProposal({ accountId: selectedAccount, contractType: 'DIGITMATCH', digit: selectedDigit, stake: Number(stake), duration: 1 }, token),
          api.derivBot.getProposal({ accountId: selectedAccount, contractType: 'DIGITDIFF', digit: selectedDigit, stake: Number(stake), duration: 1 }, token),
        ]);
        if (active) { setMatchProposal(matches.proposal); setDiffProposal(differs?.proposal ?? null); }
      } catch { /* proposals refresh again on the next interval */ }
    };
    void refreshProposals();
    const interval = window.setInterval(() => void refreshProposals(), 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [selectedAccount, selectedDigit, stake, ticks.length, token]);

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
      if (response.scan.targetDigit != null) setSelectedDigit(response.scan.targetDigit);
      setScanProgress(100);
    } catch (scanError: any) {
      setError(scanError?.message || 'Unable to scan the current Deriv ticks.');
    } finally { setScanning(false); }
  };

  const placeTrade = async (contractType: 'DIGITMATCH' | 'DIGITDIFF', confirmed = false) => {
    if (!token || !selectedAccount) return;
    const digit = selectedDigit;
    const selectedAccountRecord = accounts.find((account) => account.id === selectedAccount);
    if (selectedAccountRecord?.accountType === 'real' && !confirmed) {
      setPendingRealTrade(contractType);
      return;
    }
    setTrading(true);
    setError('');
    try {
      await api.derivBot.trade({ accountId: selectedAccount, contractType, digit, stake: Number(stake), duration: 1 }, token);
    } catch (tradeError: any) {
      setError(tradeError?.message || 'Unable to place the Deriv contract.');
    } finally { setTrading(false); }
  };

  const activeTrade = trades.find((trade) => trade.result === 'open') ?? null;
  const pendingDigit = selectedDigit;
  const pendingRate = pendingRealTrade === 'DIGITDIFF' ? diffProposal?.payoutRate : matchProposal?.payoutRate;
  const currentTick = ticks.at(-1);

  if (authLoading || loading) {
    return <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  if (!user || !token) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><Card><CardContent className="p-8 text-center">Sign in to connect a Deriv account.</CardContent></Card></div>;
  }

  const hasDerivBotAccess = user.subscription === 'PRO' || user.subscription === 'TOP_TIER' || user.subscription === 'VIP_AUTO_TRADER';

  if (!hasDerivBotAccess) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><Card className="border-cyan-900 bg-[#0d1728] text-white"><CardContent className="p-8 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-cyan-400" /><h1 className="mt-4 text-2xl font-black">Deriv Bot requires Pro</h1><p className="mt-3 text-sm leading-6 text-slate-400">Upgrade to Pro or higher to connect Deriv accounts, stream indices, and execute contracts.</p></CardContent></Card></div>;
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
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><div><p className="text-sm font-semibold text-slate-300">Market</p><Button type="button" onClick={() => setMarketPickerOpen(true)} className="mt-2 flex h-11 w-full items-center justify-between border border-slate-700 bg-[#091221] px-3 font-mono text-white hover:bg-slate-800 sm:min-w-[360px]"><span>{DERIV_INDICES.find((index) => index.symbol === symbol)?.label ?? symbol} <span className="ml-2 text-slate-500">({symbol})</span></span><ChevronDown className="h-4 w-4 text-cyan-300" /></Button></div><label className="text-sm font-semibold text-slate-300">Stake<input value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-[#091221] px-3 text-white" /></label><Button onClick={runScan} disabled={scanning || !ticks.length} className="h-11 gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400">{scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}AI Scan</Button></div>
            {scanning ? <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100" aria-label="Scanning Deriv ticks"><div className="h-full bg-cyan-500 transition-[width] duration-75" style={{ width: `${scanProgress}%` }} /></div> : null}
            <div className="py-2 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Current tick</p><p className="mt-1 text-3xl font-black text-rose-400">{currentTick?.quote == null ? '-' : currentTick.quote}</p></div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live ticks</p><div className="mt-3 flex min-h-12 items-center justify-end gap-2 overflow-hidden">{ticks.slice(-20).map((tick, index) => <span key={`${tick.epoch}-${index}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-sm font-black text-white">{getTickDigit(tick, symbol)}</span>)}</div></div>
            <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-cyan-900 bg-cyan-950/30 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Lowest-frequency scan</p><p className="mt-3 text-lg font-bold text-white">{scan?.targetDigit == null ? 'Scan the live sample' : `Suggested digit ${scan.targetDigit}`}</p><p className="mt-2 text-sm text-slate-300">{scan?.reason || 'AI suggests the least-occurring digit. You can choose any digit below and execute manually.'}</p>{scan ? <div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><span className="text-slate-400">Payout</span><strong className="mt-1 block text-white">{scan.payoutRate == null ? '-' : `${scan.payoutRate}%`}</strong></div><div><span className="text-slate-400">Sample</span><strong className="mt-1 block text-white">{scan.sampleSize}</strong></div><div><span className="text-slate-400">Recent</span><strong className="mt-1 block text-white">{scan.targetOccurrences}</strong></div></div> : null}</div><div className="rounded-xl border border-slate-700 bg-[#091221] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Choose digit</p><div className="mt-3 grid grid-cols-5 gap-2">{Array.from({ length: 10 }, (_, digit) => <button key={digit} type="button" onClick={() => setSelectedDigit(digit)} className={`h-10 rounded-lg border text-sm font-black transition ${selectedDigit === digit ? 'border-cyan-300 bg-cyan-500 text-slate-950' : 'border-slate-700 bg-[#0d1728] text-white hover:border-cyan-500'}`}>{digit}</button>)}</div><p className="mt-3 text-xs text-slate-500">AI suggests the lowest-frequency digit, but manual execution is available for every digit from 0 to 9.</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><Button disabled={trading} onClick={() => void placeTrade('DIGITMATCH')} className="h-12 bg-emerald-600 text-white hover:bg-emerald-700">MATCHES {selectedDigit} {matchProposal?.payoutRate == null ? '' : `${matchProposal.payoutRate}% payout`}</Button><Button disabled={trading} onClick={() => void placeTrade('DIGITDIFF')} className="h-12 bg-rose-600 text-white hover:bg-rose-700">DIFFERS {selectedDigit} {diffProposal?.payoutRate == null ? '' : `${diffProposal.payoutRate}% payout`}</Button></div>
            <p className="text-xs text-slate-500">Payout is shown for information only. Execution is available for every selected digit and is not a guarantee of winning.</p>
            {activeTrade ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Active contract</p><div className="mt-2 flex flex-wrap justify-between gap-3 text-sm"><strong>{activeTrade.symbol} {activeTrade.contract_type === 'DIGITDIFF' ? 'DIFFERS' : 'MATCHES'} {activeTrade.digit}</strong><span>Stake: {activeTrade.stake}</span><span>Contract: {activeTrade.contract_id || '-'}</span></div><p className="mt-2 text-sm text-blue-800">OPEN. Waiting for the live Deriv settlement.</p></div> : null}
            <p className="text-xs text-slate-500">Selected account: {accounts.find((account) => account.id === selectedAccount)?.maskedAccountId || 'None'}</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Today</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-5"><div><p className="text-xs text-slate-500">Trades</p><p className="mt-1 text-xl font-black">{stats.trades}</p></div><div><p className="text-xs text-slate-500">Wins</p><p className="mt-1 text-xl font-black text-emerald-600">{stats.wins}</p></div><div><p className="text-xs text-slate-500">Losses</p><p className="mt-1 text-xl font-black text-rose-600">{stats.losses}</p></div><div><p className="text-xs text-slate-500">Win rate</p><p className="mt-1 text-xl font-black">{stats.winRate}%</p></div><div><p className="text-xs text-slate-500">Profit/loss</p><p className={`mt-1 text-xl font-black ${stats.profitTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{stats.profitTotal >= 0 ? '+' : ''}{stats.profitTotal.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardHeader><CardTitle>Transactions</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-6 py-4">Contract</th><th className="px-6 py-4">Symbol</th><th className="px-6 py-4">Stake</th><th className="px-6 py-4">Payout rate</th><th className="px-6 py-4">Result</th><th className="px-6 py-4">Profit/Loss</th></tr></thead><tbody>{trades.map((trade) => <tr key={trade.id} className="border-b border-slate-100 last:border-0"><td className="px-6 py-4 font-semibold">{trade.contract_type === 'DIGITDIFF' ? 'DIFFERS' : 'MATCHES'} {trade.digit}</td><td className="px-6 py-4 font-mono">{trade.symbol}</td><td className="px-6 py-4">{trade.stake.toFixed(2)}</td><td className="px-6 py-4">{trade.payout_rate == null ? '-' : `${trade.payout_rate}%`}</td><td className={`px-6 py-4 font-bold ${trade.result === 'win' ? 'text-emerald-600' : trade.result === 'loss' ? 'text-rose-600' : 'text-blue-600'}`}>{trade.result?.toUpperCase() || 'OPEN'}</td><td className={`px-6 py-4 font-semibold ${(trade.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.profit == null ? '-' : `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}`}</td></tr>)}</tbody></table>{!trades.length ? <p className="p-6 text-sm text-slate-500">Completed Deriv contracts will appear here.</p> : null}</CardContent></Card>
          {pendingRealTrade ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Real account selected</p><h2 className="mt-2 text-2xl font-black text-slate-950">Confirm real-money trade</h2><p className="mt-3 text-sm leading-6 text-slate-600">You are about to place a {pendingRealTrade === 'DIGITDIFF' ? 'Differs' : 'Matches'} {pendingDigit ?? '-'} contract on {symbol} using {stake} stake. Current payout rate: {pendingRate == null ? 'unavailable' : `${pendingRate}%`}.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setPendingRealTrade(null)}>Cancel</Button><Button className="bg-rose-600 text-white hover:bg-rose-700" disabled={trading} onClick={() => { const next = pendingRealTrade; setPendingRealTrade(null); void placeTrade(next, true); }}>Confirm Trade</Button></div></div></div> : null}
          {marketPickerOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="market-picker-title" onClick={() => setMarketPickerOpen(false)}><div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1424] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Deriv markets</p><h2 id="market-picker-title" className="mt-1 text-xl font-black text-white">Select an index</h2></div><button type="button" aria-label="Close market picker" onClick={() => setMarketPickerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button></div><div className="overflow-y-auto p-3">{DERIV_INDEX_GROUPS.map((group) => <div key={group} className="mb-4 last:mb-0"><p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{group}</p><div className="grid gap-1">{DERIV_INDICES.filter((index) => index.group === group).map((index) => <button key={index.symbol} type="button" onClick={() => { setSymbol(index.symbol); setMarketPickerOpen(false); }} className={`flex items-center justify-between rounded-lg px-3 py-3 text-left transition ${symbol === index.symbol ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/50' : 'text-slate-200 hover:bg-slate-800'}`}><span className="text-sm font-semibold">{index.label}</span><span className="font-mono text-xs text-slate-500">{index.symbol}</span></button>)}</div></div>)}</div></div></div> : null}
        </section>
      )}
    </main>
  );
}
