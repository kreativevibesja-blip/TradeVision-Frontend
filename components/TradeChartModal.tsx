'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TradeChartModalProps {
  open: boolean;
  onClose: () => void;
  snapshotUrl: string;
  symbol: string;
  direction: 'buy' | 'sell';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2?: number | null;
  status: string;
  closeReason?: string | null;
}

function formatPrice(price: number) {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 10) return price.toFixed(3);
  return price.toFixed(5);
}

export function TradeChartModal({
  open,
  onClose,
  snapshotUrl,
  symbol,
  direction,
  entry,
  stopLoss,
  takeProfit,
  takeProfit2,
  status,
  closeReason,
}: TradeChartModalProps) {
  const isBuy = direction === 'buy';

  const statusBadge =
    status === 'closed'
      ? closeReason === 'tp'
        ? { label: 'Win', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
        : closeReason === 'be'
          ? { label: 'BE', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' }
        : { label: 'Loss', color: 'bg-red-500/15 text-red-400 border-red-500/30' }
      : status === 'triggered'
        ? { label: 'Active', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' }
        : status === 'invalidated'
          ? { label: 'No Entry', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' }
          : { label: 'Pending', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[640px] rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Chart image */}
            <div className="w-full bg-[#0f1729]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={snapshotUrl}
                alt={`${symbol} ${direction} chart`}
                className="w-full"
                draggable={false}
              />
            </div>

            {/* Trade info overlay */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{symbol}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${isBuy ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}
                  >
                    {isBuy ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                    {direction.toUpperCase()}
                  </Badge>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusBadge.color}`}>
                  {statusBadge.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <LevelPill label="Entry" value={formatPrice(entry)} color="text-blue-400" />
                <LevelPill label="SL" value={formatPrice(stopLoss)} color="text-red-400" />
                <LevelPill label="TP" value={formatPrice(takeProfit)} color="text-emerald-400" />
                {takeProfit2 != null && (
                  <LevelPill label="TP2" value={formatPrice(takeProfit2)} color="text-emerald-300" />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LevelPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-xs font-mono font-medium ${color}`}>{value}</span>
    </div>
  );
}
