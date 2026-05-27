'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  BrainCircuit,
  CreditCard,
  LifeBuoy,
  Radar,
  ScrollText,
  Shield,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';
import type { OrionQuickAction, OrionQuickActionId } from '@/orion/types';

const iconMap = {
  analysis: Upload,
  radar: Radar,
  journal: ScrollText,
  market: Activity,
  subscription: CreditCard,
  support: LifeBuoy,
  tour: Sparkles,
  risk: Shield,
  strategy: Target,
  account: BrainCircuit,
};

export function OrionQuickActions({
  actions,
  onAction,
}: {
  actions: OrionQuickAction[];
  onAction: (actionId: OrionQuickActionId) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {actions.map((action, index) => {
        const Icon = iconMap[action.icon];

        return (
          <motion.button
            key={action.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={() => onAction(action.id)}
            className="rounded-[16px] border border-slate-200 bg-sky-50 p-3 text-left text-slate-900 transition hover:border-blue-300 hover:bg-sky-100"
            style={{ backgroundColor: '#f8fbff', color: '#0f172a', borderColor: '#dbeafe' }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-600" style={{ backgroundColor: '#ffffff', color: '#2563eb', borderColor: '#bfdbfe' }}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900" style={{ color: '#0f172a' }}>{action.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-600" style={{ color: '#475569' }}>{action.description}</div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}