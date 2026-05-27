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
          className="hidden max-w-[18rem] rounded-[22px] border border-blue-300/16 bg-[rgba(2,6,23,0.985)] px-4 py-3 text-sm leading-6 text-white/78 shadow-[0_20px_40px_rgba(2,6,23,0.58)] md:block"
        >
          {preview}
        </motion.div>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className="relative hidden h-16 w-16 items-center justify-center rounded-full border border-[rgba(92,163,255,0.36)] bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.4),rgba(30,64,175,0.94))] text-white shadow-[0_0_0_1px_rgba(96,165,250,0.12),0_22px_55px_rgba(2,6,23,0.58),0_0_34px_rgba(59,130,246,0.24)] sm:flex"
      >
        <span className="absolute inset-0 rounded-full border border-blue-300/18 animate-ping" />
        <BrainCircuit className="relative h-7 w-7" />
      </button>

      <button
        type="button"
        onClick={onClick}
        className="flex min-h-12 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-[rgba(92,163,255,0.32)] bg-[rgba(2,6,23,0.985)] px-4 py-3 text-left shadow-[0_18px_45px_rgba(2,6,23,0.62)] sm:hidden"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/18 text-blue-100">
          <BrainCircuit className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-blue-100/72">Orion AI</div>
          <div className="truncate text-sm text-white">{preview}</div>
        </div>
      </button>
    </div>
  );
}