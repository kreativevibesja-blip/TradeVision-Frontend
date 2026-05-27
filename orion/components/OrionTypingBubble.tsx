'use client';

import { motion } from 'framer-motion';

export function OrionTypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="max-w-[84%] rounded-[24px] rounded-bl-md border border-[rgba(96,165,250,0.22)] bg-[linear-gradient(180deg,rgba(10,18,35,0.88),rgba(3,7,18,0.94))] px-4 py-3 text-white shadow-[0_20px_45px_rgba(2,6,23,0.35)]"
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            animate={{ y: [0, -4, 0], opacity: [0.38, 1, 0.38] }}
            transition={{ duration: 1, repeat: Infinity, delay: index * 0.12 }}
            className="h-2.5 w-2.5 rounded-full bg-blue-200/90"
          />
        ))}
        <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-blue-100/60">Orion is thinking</span>
      </div>
    </motion.div>
  );
}