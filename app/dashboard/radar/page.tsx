'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Crown, Lock, Radar, ShieldAlert, Target, Trash2, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TradeCommandCenterModal from '@/components/TradeCommandCenterModal';
import { useAuth } from '@/hooks/useAuth';
import { usePageActivity } from '@/hooks/usePageActivity';
import { useTradeRadar } from '@/hooks/useTradeRadar';
import { api, type CommandCenterSnapshot, type TrackedTrade, type TrackedTradeState } from '@/lib/api';

const SNAPSHOT_POLL_INTERVAL_MS = 5000;

const stateConfig: Record<TrackedTradeState, { label: string; color: string; bg: string; border: string }> = {
  TRACKING: { label: 'Tracking', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
  READY: { label: 'Ready', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  ACTIVE: { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  INVALID: { label: 'Invalid', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  EXPIRED: { label: 'Expired', color: 'text-gray-500', bg: 'bg-gray-500/5', border: 'border-gray-500/20' },
};

function StateBadge({ state }: { state: TrackedTradeState }) {
  const config = stateConfig[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${config.bg} ${config.color} ${config.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${state === 'READY' || state === 'ACTIVE' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 9 ? 'bg-green-400' : confidence >= 7.5 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="tabular-nums text-xs text-gray-400">{confidence.toFixed(1)}</span>
    </div>
  );
}

function formatRadarPrice(value: number) {
  if (!Number.isFinite(value)) {
    return '-';
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
}

function TradeCard({
  trade,
  snapshot,
  onRemove,
  onOpenCommandCenter,
}: {
  trade: TrackedTrade;
  snapshot?: CommandCenterSnapshot;
  onRemove: () => void;
  onOpenCommandCenter: () => void;
}) {
  const isPast = trade.state === 'INVALID' || trade.state === 'EXPIRED';
  const expiresIn = Math.max(0, new Date(trade.expiresAt).getTime() - Date.now());
  const minutesLeft = Math.ceil(expiresIn / 60000);
  const currentPrice = snapshot?.currentPrice ?? null;
  const updatedAt = snapshot?.updatedAt ? new Date(snapshot.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-2xl border p-4 transition-colors ${isPast ? 'border-white/5 bg-white/[0.02] opacity-60' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
            {trade.direction === 'buy' ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-white">{trade.symbol}</p>
              <Badge variant={trade.direction === 'buy' ? 'success' : 'destructive'} className="text-[10px] uppercase">
                {trade.direction}
              </Badge>
              <StateBadge state={trade.state} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <ConfidenceDot confidence={trade.confidence} />
              {!isPast ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {minutesLeft}m left
                </span>
              ) : null}
              <span className="max-w-[180px] truncate" title={trade.conditions.join(', ')}>
                {snapshot?.liveStatus ?? trade.conditions[0] ?? 'Awaiting update'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isPast ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 border border-blue-500/30 bg-blue-600/20 text-xs text-blue-400 hover:bg-blue-600/30"
              onClick={onOpenCommandCenter}
            >
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">Command</span>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-400"
            onClick={onRemove}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <span>Entry zone:</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className="absolute h-full rounded-full bg-blue-500/30" style={{ left: '30%', width: '40%' }} />
          </div>
          <span className="tabular-nums font-mono">{formatRadarPrice(trade.entryZoneMin)} - {formatRadarPrice(trade.entryZoneMax)}</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Live price</div>
          <div className="mt-1 font-mono text-sm text-white">{currentPrice != null ? formatRadarPrice(currentPrice) : 'Loading...'}</div>
          <div className="mt-1 text-[10px] text-gray-500">{updatedAt ? `Updated ${updatedAt}` : 'Waiting for live update'}</div>
        </div>
      </div>
    </motion.div>
  );
}

function LockedView() {
  return (
    <Card className="mobile-card border-white/10">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <Lock className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">Trade Radar requires an advanced plan</h3>
        <p className="mx-auto mb-6 max-w-sm text-sm text-gray-400">
          Send strong analyses into live tracking, monitor price movement, and review real-time status changes as the setup evolves.
        </p>
        <Link href="/dashboard/billing">
          <Button className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500">
            <Crown className="h-4 w-4" />
            View plan options
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function TradeRadarPanel() {
  const { user, token } = useAuth();
  const { isActive } = usePageActivity();
  const isUnlocked = user?.subscription === 'TOP_TIER' || user?.subscription === 'VIP_AUTO_TRADER';
  const { activeTrades, pastTrades, loading, error, removeTrade } = useTradeRadar();
  const [commandTarget, setCommandTarget] = useState<{ id: string; symbol: string } | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, CommandCenterSnapshot>>({});

  const trackedTargets = useMemo(
    () => activeTrades.map((trade) => ({ trackedId: trade.id, tradeId: trade.analysisId || trade.id })),
    [activeTrades],
  );

  useEffect(() => {
    if (!token || !isActive || trackedTargets.length === 0) {
      setSnapshots({});
      return;
    }

    let active = true;

    const fetchSnapshots = async () => {
      const results = await Promise.all(
        trackedTargets.map(async (target) => {
          try {
            const response = await api.commandCenter.getSnapshot(target.tradeId, token);
            return [target.trackedId, response.commandCenter] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!active) {
        return;
      }

      const nextSnapshots: Record<string, CommandCenterSnapshot> = {};
      for (const result of results) {
        if (result) {
          nextSnapshots[result[0]] = result[1];
        }
      }
      setSnapshots(nextSnapshots);
    };

    void fetchSnapshots();
    const intervalId = window.setInterval(fetchSnapshots, SNAPSHOT_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isActive, token, trackedTargets]);

  if (!isUnlocked) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
            <Radar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Trade Radar</h1>
            <p className="text-xs text-gray-500">Live setup tracking and price updates</p>
          </div>
        </div>
        <LockedView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
            <Radar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Trade Radar</h1>
            <p className="text-xs text-gray-500">{activeTrades.length}/5 live tracked setups</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-gray-500">Live</span>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      <Card className="mobile-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-blue-400" />
            Active Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading Trade Radar...</div>
          ) : activeTrades.length === 0 ? (
            <div className="py-10 text-center">
              <Radar className="mx-auto mb-3 h-10 w-10 text-gray-600" />
              <p className="mb-1 text-sm text-gray-400">No setups are being tracked right now</p>
              <p className="text-xs text-gray-600">Use the Track on Radar button from analysis results or live chart analysis cards.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {activeTrades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    snapshot={snapshots[trade.id]}
                    onRemove={() => void removeTrade(trade.id)}
                    onOpenCommandCenter={() => setCommandTarget({ id: trade.analysisId || trade.id, symbol: trade.symbol })}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {pastTrades.length > 0 ? (
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-400">
              <ShieldAlert className="h-4 w-4" />
              Archived Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence mode="popLayout">
                {pastTrades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    snapshot={snapshots[trade.id]}
                    onRemove={() => void removeTrade(trade.id)}
                    onOpenCommandCenter={() => undefined}
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <TradeCommandCenterModal
        tradeId={commandTarget?.id ?? ''}
        pair={commandTarget?.symbol ?? ''}
        open={commandTarget !== null}
        onClose={() => setCommandTarget(null)}
      />
    </div>
  );
}
