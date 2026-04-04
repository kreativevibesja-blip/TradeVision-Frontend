'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminTradeLogOverview } from '@/lib/api';
import { BarChart3, CheckCircle2, AlertTriangle, LineChart, Target } from 'lucide-react';

const REFRESH_INTERVAL_MS = 30_000;

export default function AdminTradeLogPage() {
  const { token } = useAuth();
  const [tradeLog, setTradeLog] = useState<AdminTradeLogOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadTradeLog();
    const intervalId = window.setInterval(() => {
      void loadTradeLog(false);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [token]);

  const loadTradeLog = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await api.admin.getTradeLog(token!);
      setTradeLog(data);
    } catch {
      // silent
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading trade log analytics...</div>;
  }

  const summary = tradeLog?.summary;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trade Log Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Adoption, skip behavior, and signal quality across the scanner.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Last refresh</p>
          <p className="mt-1 text-sm font-medium">{tradeLog ? new Date(tradeLog.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={BarChart3}
          label="Trades Generated"
          value={String(summary?.totalTradesGenerated ?? 0)}
          helper={`${summary?.resolvedTrades ?? 0} resolved`}
        />
        <AdminMetricCard
          icon={CheckCircle2}
          label="Taken Rate"
          value={`${summary?.takenRate.toFixed(1) ?? '0.0'}%`}
          helper={`${summary?.takenCount ?? 0} taken signals`}
        />
        <AdminMetricCard
          icon={AlertTriangle}
          label="Skipped Rate"
          value={`${summary?.skippedRate.toFixed(1) ?? '0.0'}%`}
          helper={`${summary?.skippedCount ?? 0} skipped signals`}
        />
        <AdminMetricCard
          icon={Target}
          label="Pending Trades"
          value={String(summary?.pendingTrades ?? 0)}
          helper="Still waiting on outcome"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Common Skip Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {!tradeLog || tradeLog.skipReasons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
                No skip reasons have been logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tradeLog.skipReasons.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-medium">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">User-selected skip reason</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold">{item.count}</p>
                      <p className="text-xs text-muted-foreground">times</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Performing Signals</CardTitle>
          </CardHeader>
          <CardContent>
            {!tradeLog || tradeLog.bestSignals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
                Resolved trade outcomes will populate signal rankings here.
              </div>
            ) : (
              <div className="space-y-3">
                {tradeLog.bestSignals.map((signal) => (
                  <div key={`${signal.symbol}-${signal.direction}-${signal.strategy ?? 'none'}`} className="rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold">{signal.symbol}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${signal.direction === 'buy' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                            {signal.direction.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{signal.strategy ?? 'Strategy not tagged'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-cyan-300">{signal.winRate.toFixed(1)}% win rate</p>
                        <p className="text-xs text-muted-foreground">{signal.total} resolved trades</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MiniSignalStat label="Wins" value={String(signal.wins)} />
                      <MiniSignalStat label="Losses" value={String(signal.losses)} />
                      <MiniSignalStat label="Net R" value={`${signal.netR >= 0 ? '+' : ''}${signal.netR.toFixed(2)}R`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="h-5 w-5 text-cyan-300" />
            Product Readout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <ReadoutTile
              title="Adoption"
              body={`Users have logged ${summary?.takenCount ?? 0} taken trades and ${summary?.skippedCount ?? 0} skipped trades so far.`}
            />
            <ReadoutTile
              title="Behavior"
              body={tradeLog?.skipReasons[0] ? `The dominant skip reason right now is “${tradeLog.skipReasons[0].reason}”.` : 'Skip reasons will appear here once users start logging them.'}
            />
            <ReadoutTile
              title="Signal Quality"
              body={tradeLog?.bestSignals[0] ? `${tradeLog.bestSignals[0].symbol} ${tradeLog.bestSignals[0].direction.toUpperCase()} is currently the strongest resolved pattern by net R.` : 'Signal quality rankings will appear as resolved trades accumulate.'}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AdminMetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniSignalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ReadoutTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}