'use client';

import { motion } from 'framer-motion';

export function OrionTypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="max-w-[84%] rounded-[18px] rounded-tl-[8px] border border-[#ede9fe] bg-[#f5f3ff] px-3.5 py-3 text-[#4b5563] shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            animate={{ y: [0, -4, 0], opacity: [0.38, 1, 0.38] }}
            transition={{ duration: 1, repeat: Infinity, delay: index * 0.12 }}
            className="h-2.5 w-2.5 rounded-full bg-fuchsia-500/80"
          />
        ))}
        <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-[#6d28d9]/60">Orion is thinking</span>
      </div>
    </motion.div>
  );
}