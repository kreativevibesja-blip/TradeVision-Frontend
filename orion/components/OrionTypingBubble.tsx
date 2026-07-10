'use client';

import { motion } from 'framer-motion';

export function OrionTypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="max-w-[86%] rounded-[20px] rounded-bl-md bg-white px-4 py-3 text-[#1F2937] shadow-sm ring-1 ring-slate-200"
      style={{ backgroundColor: '#ffffff', color: '#1F2937' }}
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            animate={{ y: [0, -4, 0], opacity: [0.38, 1, 0.38] }}
            transition={{ duration: 1, repeat: Infinity, delay: index * 0.12 }}
            className="h-2.5 w-2.5 rounded-full bg-[#2563EB]/80"
          />
        ))}
        <span className="ml-2 text-[11px] font-semibold text-[#2563EB]/80" style={{ color: '#2563EB' }}>Orion is thinking</span>
      </div>
    </motion.div>
  );
}
