'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, X } from 'lucide-react';

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
        className="hidden h-16 w-16 items-center justify-center rounded-full border-[6px] border-[#BFDBFE] bg-[#2563EB] text-white shadow-[0_16px_40px_rgba(37,99,235,0.34)] transition-transform duration-200 hover:scale-[1.04] sm:flex"
        style={{ background: '#2563EB', borderColor: '#BFDBFE', color: '#ffffff' }}
      >
        {open ? <X className="h-7 w-7 text-white" /> : <BrainCircuit className="h-7 w-7 text-white" />}
      </button>

      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[#BFDBFE] bg-[#2563EB] text-white shadow-[0_14px_34px_rgba(37,99,235,0.32)] sm:hidden"
        style={{ background: '#2563EB', borderColor: '#BFDBFE', color: '#ffffff' }}
      >
        {open ? <X className="h-6 w-6 text-white" /> : <BrainCircuit className="h-6 w-6 text-white" />}
      </button>
    </div>
  );
}
