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
    <div className="grid gap-2">
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
            className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FC] p-3 text-left text-[#111827] transition hover:border-[#BFDBFE] hover:bg-[#EFF6FF]"
            style={{ backgroundColor: '#F7F9FC', color: '#111827', borderColor: '#E5E7EB' }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-[#DBEAFE] bg-white text-[#2563EB]" style={{ backgroundColor: '#ffffff', color: '#2563EB', borderColor: '#DBEAFE' }}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[#111827]" style={{ color: '#111827' }}>{action.label}</div>
                <div className="mt-1 whitespace-normal text-xs leading-5 text-[#6B7280] [overflow-wrap:anywhere] [word-break:break-word]" style={{ color: '#6B7280' }}>{action.description}</div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
