'use client';

import { motion } from 'framer-motion';

export function OrionTypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="max-w-[84%] rounded-[18px] rounded-tl-[8px] border border-sky-100 bg-sky-50 px-3.5 py-3 text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
      style={{ backgroundColor: '#eff6ff', color: '#334155', borderColor: '#dbeafe' }}
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            animate={{ y: [0, -4, 0], opacity: [0.38, 1, 0.38] }}
            transition={{ duration: 1, repeat: Infinity, delay: index * 0.12 }}
            className="h-2.5 w-2.5 rounded-full bg-blue-500/80"
          />
        ))}
        <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-blue-600/70" style={{ color: '#2563eb' }}>Orion is thinking</span>
      </div>
    </motion.div>
  );
}