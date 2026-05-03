'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AnalysisFeatureName, FeatureAccessSummary } from '@/lib/api';

const FEATURE_COPY: Record<AnalysisFeatureName, { title: string; description: string }> = {
  reactionChallenge: {
    title: 'Reaction Challenge',
    description: 'Sharpen your entry timing against the AI execution map.',
  },
  confidenceThermometer: {
    title: 'Confidence Thermometer',
    description: 'See how the model weighted structure, liquidity, and confirmation before the call.',
  },
  tradeReplay: {
    title: 'Trade Replay Mode',
    description: 'Watch premium scenario paths play out before you commit capital.',
  },
};

interface Props {
  open: boolean;
  feature: AnalysisFeatureName | null;
  access: FeatureAccessSummary | null;
  onClose: () => void;
}

export function FeatureUpgradeModal({ open, feature, access, onClose }: Props) {
  if (!feature || !access) {
    return null;
  }

  const copy = FEATURE_COPY[feature];
  const planLabel = access.requiredPlan === 'TOP_TIER' ? 'Pro+' : access.requiredPlan;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-md rounded-3xl border border-amber-400/20 bg-[#090b12] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="mb-5 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
              <Crown className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-300/70">Premium Feature</p>
              <h3 className="text-2xl font-semibold">Unlock {copy.title}</h3>
              <p className="text-sm leading-relaxed text-white/70">{copy.description}</p>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-amber-300" />
                <p className="text-sm text-white/80">This interaction is available on the {planLabel} plan.</p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                Upgrade keeps the rest of the current analysis intact.
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/dashboard/billing" className="flex-1">
                <Button className="w-full gap-2 bg-amber-500 text-black hover:bg-amber-400">
                  <Crown className="h-4 w-4" />
                  Upgrade Now
                </Button>
              </Link>
              <Button variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5" onClick={onClose}>
                Not now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}