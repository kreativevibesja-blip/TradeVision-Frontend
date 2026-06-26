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
  compact = false,
}: {
  actions: OrionQuickAction[];
  onAction: (actionId: OrionQuickActionId) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {actions.slice(0, 4).map((action, index) => (
          <motion.button
            key={action.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onAction(action.id)}
            className="shrink-0 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs font-semibold text-[#2563EB] transition hover:border-[#60A5FA] hover:bg-[#DBEAFE]"
          >
            {action.label}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
      {actions.map((action, index) => {
        const Icon = iconMap[action.icon];

        return (
          <motion.button
            key={action.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -1 }}
            onClick={() => onAction(action.id)}
            className="shrink-0 rounded-full border border-[#BFDBFE] bg-white px-3 py-2 text-left text-[#2563EB] transition hover:border-[#60A5FA] hover:bg-[#EFF6FF]"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <div className="whitespace-nowrap text-xs font-semibold">{action.label}</div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
