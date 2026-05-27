'use client';

import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

export function OrionFloatingButton({
  open,
  preview,
  onClick,
}: {
  open: boolean;
  preview: string;
  onClick: () => void;
}) {
  return (
    <div className="pointer-events-auto relative flex items-end justify-end">
      {!open ? (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="hidden absolute bottom-full right-0 mb-3 w-[min(28rem,calc(100vw-8rem))] rounded-[999px] border border-white/18 bg-[linear-gradient(135deg,rgba(139,33,201,0.94),rgba(168,85,247,0.92),rgba(217,70,239,0.9))] px-4 py-2.5 text-sm leading-5 text-white/92 shadow-[0_18px_40px_rgba(126,34,206,0.34)] md:block"
        >
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-white/72">Orion AI</span>
            <span className="min-w-0 truncate">{preview}</span>
          </div>
        </motion.div>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="relative hidden h-14 w-14 items-center justify-center rounded-full border border-white/18 bg-[linear-gradient(135deg,rgba(139,33,201,0.98),rgba(168,85,247,0.94),rgba(217,70,239,0.92))] text-white shadow-[0_18px_42px_rgba(126,34,206,0.34)] transition-transform duration-200 hover:scale-[1.02] sm:flex"
      >
        <span className="absolute inset-0 rounded-full border border-white/18 animate-ping" />
        <BrainCircuit className="relative h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/18 bg-[linear-gradient(135deg,rgba(139,33,201,0.98),rgba(168,85,247,0.94),rgba(217,70,239,0.92))] text-white shadow-[0_14px_34px_rgba(126,34,206,0.28)] sm:hidden"
      >
        <BrainCircuit className="h-5 w-5" />
      </button>
    </div>
  );
}