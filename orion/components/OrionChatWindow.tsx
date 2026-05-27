'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
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
          initial={{ opacity: 0, y: 28, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 22, scale: 0.94 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          drag="y"
          dragElastic={0.04}
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          className="pointer-events-auto relative z-[80] flex h-[min(30rem,calc(100vh-7rem))] w-[min(21rem,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden rounded-[18px] border border-[#e5e7eb] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] max-sm:h-[min(28rem,calc(100vh-6rem))] max-sm:w-[min(20rem,calc(100vw-1rem))]"
        >
          <div className="border-b border-[#8b5cf6] bg-[linear-gradient(135deg,#8b5cf6,#6366f1)] px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat Window</span>
                </div>
                <div className="mt-1 truncate text-xs text-white/80">Orion AI</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-white px-3 py-3.5">
            <div className="rounded-[16px] border border-[#ede9fe] bg-[#f5f3ff] px-3 py-2.5 text-xs leading-5 text-[#5b21b6]">
              <span className="font-semibold text-[#4c1d95]">{pageLabel}</span>
              <span className="text-[#6d28d9]"> · {pageSummary}</span>
            </div>
            <div className="space-y-3">
              {messages.map((message) => (
                <OrionMessageBubble key={message.id} message={message} onChoice={onChoice} />
              ))}
              {isTyping ? <OrionTypingBubble /> : null}
            </div>
            <OrionQuickActions actions={quickActions} onAction={onQuickAction} />
          </div>

          <div className="border-t border-[#ede9fe] bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
                placeholder="Type your message..."
                className="min-h-10 min-w-0 flex-1 resize-none rounded-full border border-[#d1d5db] bg-white px-4 py-2.5 text-sm leading-5 text-[#374151] outline-none transition placeholder:text-[#9ca3af] focus:border-[#8b5cf6]"
              />
              <Button variant="gradient" size="icon" onClick={onSubmit} className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6366f1)] shadow-none hover:opacity-95">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}