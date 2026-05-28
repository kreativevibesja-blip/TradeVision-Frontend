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
      <div className={`min-w-0 ${isAssistant ? 'max-w-[74%] sm:max-w-[70%]' : 'max-w-[80%] sm:max-w-[76%] items-end'} flex flex-col gap-2`}>
        <div
          className={isAssistant
            ? 'w-fit max-w-full rounded-[18px] rounded-tl-[8px] border border-sky-100 bg-sky-50 px-3.5 py-3 text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.06)]'
            : 'w-fit max-w-full rounded-[18px] rounded-tr-[8px] border border-blue-300 bg-gradient-to-r from-blue-600 to-sky-500 px-3.5 py-3 text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)]'}
          style={isAssistant
            ? { backgroundColor: '#eff6ff', color: '#334155', borderColor: '#dbeafe' }
            : { background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)', color: '#ffffff', borderColor: '#93c5fd' }}
        >
          <div className="max-w-full whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{renderedText}</div>
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
                className="rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-sky-50"
                style={{ backgroundColor: '#ffffff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
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