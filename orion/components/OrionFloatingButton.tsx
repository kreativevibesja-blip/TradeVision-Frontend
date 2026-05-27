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
    <div className="pointer-events-auto flex items-end gap-3">
      {!open ? (
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden max-w-[17rem] rounded-[20px] border border-white/18 bg-[linear-gradient(135deg,rgba(139,33,201,0.94),rgba(168,85,247,0.92),rgba(217,70,239,0.9))] px-4 py-3 text-sm leading-6 text-white/92 shadow-[0_18px_40px_rgba(126,34,206,0.34)] md:block"
        >
          {preview}
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