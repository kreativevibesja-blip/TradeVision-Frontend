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
      <div className={`min-w-0 ${isAssistant ? 'max-w-[86%]' : 'max-w-[78%] items-end'} flex flex-col gap-1.5`}>
        <div
          className={isAssistant
            ? 'max-w-full rounded-[20px] rounded-bl-md bg-white px-4 py-3 text-[#1F2937] shadow-sm ring-1 ring-slate-200'
            : 'max-w-full rounded-[20px] rounded-br-md bg-[#2563EB] px-4 py-3 text-white shadow-sm'}
          style={isAssistant
            ? { backgroundColor: '#ffffff', color: '#1F2937' }
            : { backgroundColor: '#2563EB', color: '#ffffff' }}
        >
          <div className="max-w-full whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere] [word-break:break-word]">{renderedText}</div>
        </div>
        <div className={`px-1 text-[10px] font-semibold text-slate-400 ${isAssistant ? '' : 'text-right'}`} style={{ color: '#94a3b8' }}>
          {isAssistant ? 'Orion' : 'You'} · {formatTime(message.createdAt)}
        </div>
        {message.choices?.length ? (
          <div className={`flex flex-wrap gap-2 ${isAssistant ? 'max-w-full' : 'justify-end'}`}>
            {message.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoice(choice)}
                className="rounded-full border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-bold text-[#2563EB] transition hover:bg-[#EFF6FF]"
                style={{ backgroundColor: '#ffffff', color: '#2563EB', borderColor: '#BFDBFE' }}
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
