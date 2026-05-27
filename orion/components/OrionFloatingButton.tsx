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
          className="hidden max-w-[17rem] rounded-[20px] border border-blue-300/16 bg-[rgba(7,12,24,0.78)] px-4 py-3 text-sm leading-6 text-white/78 shadow-[0_20px_40px_rgba(2,6,23,0.52)] backdrop-blur-[18px] md:block"
        >
          {preview}
        </motion.div>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="relative hidden h-14 w-14 items-center justify-center rounded-full border border-[rgba(92,163,255,0.3)] bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.3),rgba(30,64,175,0.9))] text-white shadow-[0_0_0_1px_rgba(96,165,250,0.1),0_18px_42px_rgba(2,6,23,0.52),0_0_28px_rgba(59,130,246,0.18)] transition-transform duration-200 hover:scale-[1.02] sm:flex"
      >
        <span className="absolute inset-0 rounded-full border border-blue-300/18 animate-ping" />
        <BrainCircuit className="relative h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={onClick}
        aria-label={open ? 'Close Orion AI' : 'Open Orion AI'}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(92,163,255,0.3)] bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.26),rgba(30,64,175,0.9))] text-white shadow-[0_14px_34px_rgba(2,6,23,0.48),0_0_24px_rgba(59,130,246,0.12)] sm:hidden"
      >
        <BrainCircuit className="h-5 w-5" />
      </button>
    </div>
  );
}