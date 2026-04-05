'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ScanResultConfirmationMap, ScanResultConfirmations } from '@/lib/api';

const CONFIRMATION_ITEMS: Array<{ key: keyof ScanResultConfirmationMap; label: string }> = [
  { key: 'liquiditySweep', label: 'Liquidity Sweep' },
  { key: 'engulfing', label: 'Engulfing Candle' },
  { key: 'rejection', label: 'Rejection Wick' },
  { key: 'bos', label: 'Structure Break' },
  { key: 'poiReclaim', label: 'POI Reclaim' },
  { key: 'emaAligned', label: 'EMA Trend Alignment' },
  { key: 'zoneReaction', label: 'Zone Reaction' },
  { key: 'displacement', label: 'Displacement' },
  { key: 'momentum', label: 'Momentum' },
];

const EMPTY_CONFIRMATIONS: ScanResultConfirmationMap = {
  liquiditySweep: false,
  engulfing: false,
  rejection: false,
  bos: false,
  poiReclaim: false,
  emaAligned: false,
  zoneReaction: false,
  displacement: false,
  momentum: false,
};

function normalizeLegacyConfirmations(labels: string[]): ScanResultConfirmationMap {
  const normalized = labels.map((label) => label.toLowerCase());

  return {
    liquiditySweep: normalized.some((label) => label.includes('liquidity sweep')),
    engulfing: normalized.some((label) => label.includes('engulfing')),
    rejection: normalized.some((label) => label.includes('rejection')),
    bos: normalized.some((label) => label.includes('bos') || label.includes('structure')),
    poiReclaim: normalized.some((label) => label.includes('poi reclaim')),
    emaAligned: normalized.some((label) => label.includes('ema')),
    zoneReaction: normalized.some((label) => label.includes('zone') || label.includes('demand') || label.includes('supply') || label.includes('reaction')),
    displacement: normalized.some((label) => label.includes('displacement')),
    momentum: normalized.some((label) => label.includes('momentum')),
  };
}

export function normalizeScanResultConfirmations(confirmations: ScanResultConfirmations | null | undefined): ScanResultConfirmationMap {
  if (Array.isArray(confirmations)) {
    return normalizeLegacyConfirmations(confirmations);
  }

  if (!confirmations || typeof confirmations !== 'object') {
    return EMPTY_CONFIRMATIONS;
  }

  return {
    ...EMPTY_CONFIRMATIONS,
    ...confirmations,
  };
}

export function hasScanResultConfirmation(
  confirmations: ScanResultConfirmations | null | undefined,
  key: keyof ScanResultConfirmationMap,
): boolean {
  return normalizeScanResultConfirmations(confirmations)[key];
}

function getConfidenceTone(confidenceScore: number) {
  if (confidenceScore >= 7) {
    return {
      label: 'HIGH',
      badgeClass: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
      summary: 'Strong confluence across structure, momentum, and trend.',
    };
  }

  if (confidenceScore >= 4) {
    return {
      label: 'MEDIUM',
      badgeClass: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
      summary: 'Moderate setup with key confirmations present.',
    };
  }

  return {
    label: 'LOW',
    badgeClass: 'border-rose-400/30 bg-rose-500/15 text-rose-200',
    summary: 'Lower confirmation setup - caution advised.',
  };
}

export default function WhyThisTradePanel({
  confirmations,
  confidenceScore,
}: {
  confirmations: ScanResultConfirmations;
  confidenceScore: number;
}) {
  const normalized = normalizeScanResultConfirmations(confirmations);
  const activeItems = CONFIRMATION_ITEMS.filter((item) => normalized[item.key]);

  if (activeItems.length === 0) {
    return null;
  }

  const tone = getConfidenceTone(confidenceScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>Why This Trade</span>
          </div>
          <p className="mt-1 text-sm text-white/65">{tone.summary}</p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.2em] ${tone.badgeClass}`}>
          <span>{tone.label}</span>
          <span className="text-white/70">{confidenceScore}/9</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {activeItems.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.18 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-400/12 bg-emerald-500/6 px-3 py-2 text-sm text-white/88"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            <span>{item.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}