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
      <div className={`max-w-[84%] ${isAssistant ? '' : 'items-end'} flex flex-col gap-2`}>
        <div
          className={isAssistant
            ? 'rounded-[24px] rounded-bl-md border border-[rgba(96,165,250,0.22)] bg-[linear-gradient(180deg,rgba(10,18,35,0.88),rgba(3,7,18,0.94))] px-4 py-3 text-white shadow-[0_20px_45px_rgba(2,6,23,0.35)]'
            : 'rounded-[24px] rounded-br-md border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.2),rgba(14,165,233,0.14),rgba(255,255,255,0.05))] px-4 py-3 text-white shadow-[0_18px_38px_rgba(2,6,23,0.32)]'}
        >
          <div className="whitespace-pre-wrap text-sm leading-7">{renderedText}</div>
        </div>
        <div className={`px-1 text-[10px] uppercase tracking-[0.22em] text-white/34 ${isAssistant ? '' : 'text-right'}`}>
          {isAssistant ? 'Orion' : 'You'} · {formatTime(message.createdAt)}
        </div>
        {message.choices?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoice(choice)}
                className="rounded-full border border-blue-300/16 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/78 transition hover:border-blue-300/36 hover:bg-blue-400/10 hover:text-white"
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