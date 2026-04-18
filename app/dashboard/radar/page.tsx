'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Trash2, Target, TrendingUp, TrendingDown, ShieldAlert, Clock, Zap, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTradeRadar } from '@/hooks/useTradeRadar';
import TradeCommandCenterModal from '@/components/TradeCommandCenterModal';
import type { TrackedTrade, TrackedTradeState } from '@/lib/api';
import Link from 'next/link';

const stateConfig: Record<TrackedTradeState, { label: string; color: string; bg: string; border: string }> = {
  TRACKING: { label: 'Tracking', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
  READY: { label: 'Ready', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  ACTIVE: { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  INVALID: { label: 'Invalid', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  EXPIRED: { label: 'Expired', color: 'text-gray-500', bg: 'bg-gray-500/5', border: 'border-gray-500/20' },
};

function StateBadge({ state }: { state: TrackedTradeState }) {
  const cfg = stateConfig[state];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${state === 'READY' || state === 'ACTIVE' ? 'animate-pulse' : ''} bg-current`} />
      {cfg.label}
    </span>
  );
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 9 ? 'bg-green-400' : confidence >= 7.5 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-400 tabular-nums">{confidence.toFixed(1)}</span>
    </div>
  );
}

function TradeCard({
  trade,
  onRemove,
  onOpenCommandCenter,
}: {
  trade: TrackedTrade;
  onRemove: () => void;
  onOpenCommandCenter: () => void;
}) {
  const isPast = trade.state === 'INVALID' || trade.state === 'EXPIRED';
  const expiresIn = Math.max(0, new Date(trade.expiresAt).getTime() - Date.now());
  const minutesLeft = Math.ceil(expiresIn / 60000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-2xl border p-4 transition-colors ${isPast ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            {trade.direction === 'buy' ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm text-white truncate">{trade.symbol}</p>
              <Badge variant={trade.direction === 'buy' ? 'success' : 'destructive'} className="text-[10px] uppercase">
                {trade.direction}
              </Badge>
              <StateBadge state={trade.state} />
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <ConfidenceDot confidence={trade.confidence} />
              {!isPast && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {minutesLeft}m left
                </span>
              )}
              <span className="truncate max-w-[120px]" title={trade.conditions.join(', ')}>
                {trade.conditions[0] || 'No condition'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isPast && (
            <Button
              size="sm"
              className="gap-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 h-8 text-xs"
              onClick={onOpenCommandCenter}
            >
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">Command</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-400 h-8 w-8 p-0"
            onClick={onRemove}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Entry zone bar */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
        <span>Zone:</span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
          <div
            className="absolute h-full bg-blue-500/30 rounded-full"
            style={{
              left: '30%',
              width: '40%',
            }}
          />
        </div>
        <span className="font-mono tabular-nums">{trade.entryZoneMin.toFixed(5)} – {trade.entryZoneMax.toFixed(5)}</span>
      </div>
    </motion.div>
  );
}

function LockedView() {
  return (
    <Card className="mobile-card border-white/10">
      <CardContent className="py-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Trade Radar is a Pro+ Feature</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
          Track high-confidence setups before entry and receive real-time alerts when they become actionable.
        </p>
        <Link href="/dashboard/billing">
          <Button className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500">
            <Crown className="h-4 w-4" />
            Upgrade to Pro+
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function TradeRadarPanel() {
  const { user } = useAuth();
  const isUnlocked = user?.subscription === 'TOP_TIER' || user?.subscription === 'VIP_AUTO_TRADER';
  const { activeTrades, pastTrades, loading, removeTrade } = useTradeRadar();
  const [commandTarget, setCommandTarget] = useState<{ id: string; symbol: string } | null>(null);

  if (!isUnlocked) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Radar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Trade Radar</h1>
            <p className="text-xs text-gray-500">Track setups before entry</p>
          </div>
        </div>
        <LockedView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Radar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Your Trade Radar</h1>
            <p className="text-xs text-gray-500">
              {activeTrades.length}/5 active · Real-time tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-gray-500">Live</span>
        </div>
      </div>

      {/* Active Trades */}
      <Card className="mobile-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-400" />
            Active Setups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading radar...</div>
          ) : activeTrades.length === 0 ? (
            <div className="py-10 text-center">
              <Radar className="h-10 w-10 mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 mb-1">No setups on radar</p>
              <p className="text-xs text-gray-600">
                Click &quot;Track Setup&quot; on any high-confidence analysis to start tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {activeTrades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    onRemove={() => removeTrade(trade.id)}
                    onOpenCommandCenter={() => setCommandTarget({ id: trade.analysisId || trade.id, symbol: trade.symbol })}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Trades */}
      {pastTrades.length > 0 && (
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-gray-400">
              <ShieldAlert className="h-4 w-4" />
              Past Setups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {pastTrades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    onRemove={() => removeTrade(trade.id)}
                    onOpenCommandCenter={() => {}}
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Command Center Modal */}
      <TradeCommandCenterModal
        tradeId={commandTarget?.id ?? ''}
        pair={commandTarget?.symbol ?? ''}
        open={commandTarget !== null}
        onClose={() => setCommandTarget(null)}
      />
    </div>
  );
}
