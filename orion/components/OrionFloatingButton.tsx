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
        className="hidden min-w-[9.5rem] items-center justify-center gap-2 rounded-full border border-[#60a5fa] bg-[linear-gradient(135deg,#1d4ed8,#0ea5e9)] px-5 py-3 text-sm font-medium text-white shadow-[0_16px_36px_rgba(37,99,235,0.3)] transition-transform duration-200 hover:scale-[1.02] sm:flex"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)', borderColor: '#60a5fa', color: '#ffffff' }}
      >
        <BrainCircuit className="h-4.5 w-4.5 text-white" style={{ color: '#ffffff' }} />
        <span>Chat</span>
      </button>

      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#60a5fa] bg-[linear-gradient(135deg,#1d4ed8,#0ea5e9)] text-white shadow-[0_14px_34px_rgba(37,99,235,0.28)] sm:hidden"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)', borderColor: '#60a5fa', color: '#ffffff' }}
      >
        <BrainCircuit className="h-5 w-5 text-white" style={{ color: '#ffffff' }} />
      </button>
    </div>
  );
}