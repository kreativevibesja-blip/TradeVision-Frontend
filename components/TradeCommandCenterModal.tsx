'use client';

import { Fragment, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, RefreshCw, Shield, Target, Clock, TrendingUp, AlertTriangle, Zap, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useCommandCenter } from '@/hooks/useCommandCenter';
import type { TradeState, LiveStatusMessage, CommandCenterSnapshot } from '@/lib/api';

interface Props {
  tradeId: string;
  pair: string;
  currentPrice?: number;
  open: boolean;
  onClose: () => void;
}

const stateConfig: Record<TradeState, { label: string; color: string; glow: string; bg: string }> = {
  READY: { label: 'READY TO ENTER', color: 'text-green-400', glow: 'shadow-[0_0_20px_rgba(74,222,128,0.4)]', bg: 'bg-green-500/10 border-green-500/30' },
  WAIT: { label: 'WAIT', color: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.4)]', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  INVALID: { label: 'INVALID', color: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(248,113,113,0.4)]', bg: 'bg-red-500/10 border-red-500/30' },
  TRIGGERED: { label: 'TRIGGERED', color: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.4)]', bg: 'bg-blue-500/10 border-blue-500/30' },
  ACTIVE: { label: 'ACTIVE', color: 'text-cyan-400', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  CLOSED: { label: 'CLOSED', color: 'text-gray-400', glow: '', bg: 'bg-gray-500/10 border-gray-500/30' },
};

const statusIcons: Record<string, typeof Zap> = {
  'approaching entry': Target,
  'entry triggered': Zap,
  'momentum strong': TrendingUp,
  'momentum fading': AlertTriangle,
  'approaching TP': Target,
  'exit warning': AlertTriangle,
  'wait for confirmation': Clock,
  'price in entry zone': Target,
  'watching structure': Shield,
};

function StateBadge({ state }: { state: TradeState }) {
  const cfg = stateConfig[state];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.glow}`}>
      <span className={`w-2 h-2 rounded-full ${state === 'READY' ? 'bg-green-400 animate-pulse' : state === 'INVALID' ? 'bg-red-400' : state === 'TRIGGERED' ? 'bg-blue-400 animate-pulse' : 'bg-current'}`} />
      {cfg.label}
    </span>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Shield; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-sm font-bold text-white tabular-nums">{score}/10</span>
    </div>
  );
}

function PriceLevel({ label, price, highlight }: { label: string; price: number; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-3 py-1.5 rounded-lg ${highlight ? 'bg-white/5' : ''}`}>
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-mono ${highlight ? 'text-white font-semibold' : 'text-gray-300'}`}>{price.toFixed(5)}</span>
    </div>
  );
}

function SnapshotContent({ snapshot, onRefresh }: { snapshot: CommandCenterSnapshot; onRefresh: () => void }) {
  const { state, entryZone, confidence, timing, sltp, liveStatus, invalidation, currentPrice, trade } = snapshot;
  const cfg = stateConfig[state];
  const StatusIcon = statusIcons[liveStatus] || Shield;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StateBadge state={state} />
          <span className="text-xs text-gray-500">
            {trade.direction.toUpperCase()} · {trade.timeframe}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Status Banner */}
      <motion.div
        key={liveStatus}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${cfg.bg}`}
      >
        <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-sm font-medium ${cfg.color}`}>{liveStatus}</span>
        <span className="ml-auto text-xs text-gray-500 font-mono">{currentPrice.toFixed(5)}</span>
      </motion.div>

      {/* Entry Zone */}
      <Section title="Entry Zone" icon={Target}>
        <div className="bg-white/[0.02] rounded-xl border border-white/5 p-3 space-y-1">
          <PriceLevel label="Entry" price={trade.entry} highlight />
          <PriceLevel label="Zone Min" price={entryZone.min} />
          <PriceLevel label="Zone Max" price={entryZone.max} />
          <PriceLevel label="Current" price={currentPrice} highlight />
        </div>
      </Section>

      {/* Timing */}
      <Section title="Entry Timing" icon={Clock}>
        <div className="bg-white/[0.02] rounded-xl border border-white/5 p-3 space-y-2">
          <p className="text-sm text-white">{timing.message}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Est. candles:</span>
            <span className="text-xs font-semibold text-blue-400">{timing.candlesEstimate}</span>
          </div>
          {timing.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {timing.conditions.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Confidence */}
      <Section title="Confidence" icon={Shield}>
        <div className="bg-white/[0.02] rounded-xl border border-white/5 p-3 space-y-3">
          <ConfidenceMeter score={confidence.score} />
          <div className="grid grid-cols-2 gap-1.5">
            {confidence.reasons.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${r.status ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className={r.status ? 'text-gray-300' : 'text-gray-500'}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* SL/TP Guidance */}
      <Section title="SL/TP Guidance" icon={TrendingUp}>
        <div className="bg-white/[0.02] rounded-xl border border-white/5 p-3 space-y-2">
          <p className="text-xs text-gray-400">{sltp.slInstruction}</p>
          <div className="space-y-1">
            {sltp.tpLevels.map((tp, i) => (
              <PriceLevel key={i} label={tp.label} price={tp.price} highlight={i === 0} />
            ))}
          </div>
          <PriceLevel label="Stop Loss" price={trade.stopLoss} />
        </div>
      </Section>

      {/* Invalidation Warning */}
      {invalidation.isInvalid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase">Trade Invalidated</p>
            <p className="text-xs text-red-300/80 mt-0.5">{invalidation.reason}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TradeCommandCenterModal({ tradeId, pair, currentPrice, open, onClose }: Props) {
  const { snapshot, loading, error, refresh } = useCommandCenter(open ? tradeId : null, currentPrice);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          {/* Backdrop — also acts as drag constraint boundary */}
          <motion.div
            ref={constraintsRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Draggable Modal */}
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            dragElastic={0.05}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 top-4 left-4 right-4 sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-[420px] max-h-[85vh] bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl shadow-blue-500/5 flex flex-col overflow-hidden"
          >
            {/* Drag Handle + Header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between px-5 py-4 border-b border-white/5 cursor-grab active:cursor-grabbing select-none touch-none"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    Command Center
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{pair}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10">
              {loading && !snapshot && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {error && !snapshot && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={refresh}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {snapshot && (
                <SnapshotContent snapshot={snapshot} onRefresh={refresh} />
              )}
            </div>

            {/* Footer with live indicator */}
            {snapshot && (
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-gray-500">Live · Polling every 4s</span>
                </div>
                <span className="text-[10px] text-gray-600 font-mono">
                  {new Date(snapshot.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
