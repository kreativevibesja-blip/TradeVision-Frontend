'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { ChevronDown, Send, Sparkles } from 'lucide-react';
import { OrionMessageBubble } from '@/orion/components/OrionMessageBubble';
import { OrionQuickActions } from '@/orion/components/OrionQuickActions';
import { OrionTypingBubble } from '@/orion/components/OrionTypingBubble';
import { Button } from '@/components/ui/button';
import type { OrionChatChoice, OrionMessage, OrionQuickAction, OrionQuickActionId } from '@/orion/types';

export function OrionChatWindow({
  open,
  greeting,
  pageLabel,
  pageSummary,
  messages,
  quickActions,
  input,
  isTyping,
  onClose,
  onInputChange,
  onSubmit,
  onQuickAction,
  onChoice,
}: {
  open: boolean;
  greeting: string;
  pageLabel: string;
  pageSummary: string;
  messages: OrionMessage[];
  quickActions: OrionQuickAction[];
  input: string;
  isTyping: boolean;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onQuickAction: (actionId: OrionQuickActionId) => void;
  onChoice: (choice: OrionChatChoice) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [isTyping, messages, open]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 140) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 22, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          drag="y"
          dragElastic={0.04}
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          className="pointer-events-auto fixed bottom-20 right-4 z-[80] flex h-[min(70vh,640px)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-[rgba(96,165,250,0.2)] bg-[linear-gradient(180deg,rgba(7,12,24,0.72),rgba(2,6,23,0.84))] shadow-[0_28px_90px_rgba(2,6,23,0.64),0_0_0_1px_rgba(59,130,246,0.1)] backdrop-blur-[22px] sm:bottom-24 sm:right-6 max-sm:right-2 max-sm:h-[min(58vh,500px)] max-sm:w-[min(20rem,calc(100vw-1rem))] max-sm:rounded-[24px]"
        >
          <div className="border-b border-blue-300/14 bg-[linear-gradient(180deg,rgba(15,23,42,0.74),rgba(8,15,31,0.64))] px-4 py-3.5 sm:px-4 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-blue-100/68">
                  <Sparkles className="h-3.5 w-3.5" />
                  Orion AI
                </div>
                <div className="mt-2 text-base font-semibold tracking-[-0.04em] text-white sm:text-lg">Institutional trading mentor</div>
                <div className="mt-2 max-w-[18rem] text-sm leading-6 text-white/66">{greeting}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-white/58 transition hover:border-blue-300/24 hover:text-white"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 rounded-[20px] border border-white/8 bg-[rgba(15,23,42,0.5)] px-3 py-2.5 max-sm:hidden">
              <div className="text-[10px] uppercase tracking-[0.24em] text-blue-100/62">Detected page</div>
              <div className="mt-2 text-sm font-semibold text-white">{pageLabel}</div>
              <div className="mt-1 text-sm leading-6 text-white/54">{pageSummary}</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[rgba(2,6,23,0.2)] px-4 py-3.5 sm:px-4 sm:py-4">
            <OrionQuickActions actions={quickActions} onAction={onQuickAction} />
            <div className="space-y-4">
              {messages.map((message) => (
                <OrionMessageBubble key={message.id} message={message} onChoice={onChoice} />
              ))}
              {isTyping ? <OrionTypingBubble /> : null}
            </div>
          </div>

          <div className="border-t border-blue-300/12 bg-[linear-gradient(180deg,rgba(8,15,31,0.74),rgba(2,6,23,0.86))] px-4 py-3 sm:px-4 sm:py-3.5 pb-[calc(0.85rem+env(safe-area-inset-bottom))]">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
                rows={1}
                placeholder="Ask Orion about analysis, Trade Radar, subscriptions, support, BOS, CHOCH, or workflow guidance..."
                className="min-h-11 flex-1 resize-none rounded-[20px] border border-blue-300/16 bg-[rgba(15,23,42,0.5)] px-4 py-2.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/32 focus:border-blue-300/34 focus:bg-[rgba(30,41,59,0.62)]"
              />
              <Button variant="gradient" size="icon" onClick={onSubmit} className="h-11 w-11 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}