'use client';

import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

export function OrionFloatingButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <div className="pointer-events-auto relative flex items-end justify-end">
      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="hidden min-w-[9.25rem] items-center justify-center gap-2 rounded-full border border-[#8b5cf6] bg-[linear-gradient(135deg,#7c3aed,#6366f1)] px-5 py-3 text-sm font-medium text-white shadow-[0_16px_36px_rgba(99,102,241,0.28)] transition-transform duration-200 hover:scale-[1.02] sm:flex"
      >
        <BrainCircuit className="h-4.5 w-4.5" />
        <span>Chat</span>
      </button>

      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8b5cf6] bg-[linear-gradient(135deg,#7c3aed,#6366f1)] text-white shadow-[0_14px_34px_rgba(99,102,241,0.24)] sm:hidden"
      >
        <BrainCircuit className="h-5 w-5" />
      </button>
    </div>
  );
}