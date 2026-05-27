'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { OrionChatChoice, OrionMessage } from '@/orion/types';

function formatTime(createdAt: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(createdAt);
}

export function OrionMessageBubble({
  message,
  onChoice,
}: {
  message: OrionMessage;
  onChoice: (choice: OrionChatChoice) => void;
}) {
  const [visibleChars, setVisibleChars] = useState(message.animate ? 0 : message.text.length);

  useEffect(() => {
    if (!message.animate) {
      setVisibleChars(message.text.length);
      return;
    }

    setVisibleChars(0);
    const interval = window.setInterval(() => {
      setVisibleChars((current) => {
        if (current >= message.text.length) {
          window.clearInterval(interval);
          return message.text.length;
        }

        return Math.min(message.text.length, current + 3);
      });
    }, 18);

    return () => window.clearInterval(interval);
  }, [message.animate, message.id, message.text]);

  const renderedText = useMemo(() => message.text.slice(0, visibleChars), [message.text, visibleChars]);
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[84%] min-w-0 ${isAssistant ? '' : 'items-end'} flex flex-col gap-2`}>
        <div
          className={isAssistant
            ? 'rounded-[18px] rounded-tl-[8px] border border-violet-100 bg-violet-50 px-3.5 py-3 text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.06)]'
            : 'rounded-[18px] rounded-tr-[8px] border border-violet-300 bg-gradient-to-r from-violet-500 to-indigo-500 px-3.5 py-3 text-white shadow-[0_8px_20px_rgba(99,102,241,0.16)]'}
          style={isAssistant
            ? { backgroundColor: '#f5f3ff', color: '#334155', borderColor: '#ede9fe' }
            : { background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)', color: '#ffffff', borderColor: '#c4b5fd' }}
        >
          <div className="whitespace-pre-wrap break-words text-sm leading-6">{renderedText}</div>
        </div>
        <div className={`px-1 text-[10px] uppercase tracking-[0.18em] text-slate-400 ${isAssistant ? '' : 'text-right'}`} style={{ color: '#94a3b8' }}>
          {isAssistant ? 'Orion' : 'You'} · {formatTime(message.createdAt)}
        </div>
        {message.choices?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoice(choice)}
                className="rounded-full border border-violet-200 bg-white px-3 py-2 text-xs font-medium text-violet-700 transition hover:bg-violet-50"
                style={{ backgroundColor: '#ffffff', color: '#6d28d9', borderColor: '#ddd6fe' }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}