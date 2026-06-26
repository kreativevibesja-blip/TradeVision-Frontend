'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { Minus, Paperclip, Send, X } from 'lucide-react';
import { OrionMessageBubble } from '@/orion/components/OrionMessageBubble';
import { OrionQuickActions } from '@/orion/components/OrionQuickActions';
import { OrionTypingBubble } from '@/orion/components/OrionTypingBubble';
import type { OrionChatChoice, OrionMessage, OrionQuickAction, OrionQuickActionId } from '@/orion/types';
import { cn } from '@/lib/utils';

export function OrionChatWindow({
  open,
  pageLabel,
  pageSummary,
  messages,
  quickActions,
  input,
  isTyping,
  attachedFileLabel,
  attachDisabled,
  onClose,
  onInputChange,
  onSubmit,
  onAttachFile,
  onQuickAction,
  onChoice,
  variant = 'floating',
  className,
}: {
  open: boolean;
  greeting: string;
  pageLabel: string;
  pageSummary: string;
  messages: OrionMessage[];
  quickActions: OrionQuickAction[];
  input: string;
  isTyping: boolean;
  attachedFileLabel?: string | null;
  attachDisabled?: boolean;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onAttachFile: (file: File) => void | Promise<void>;
  onQuickAction: (actionId: OrionQuickActionId) => void;
  onChoice: (choice: OrionChatChoice) => void;
  variant?: 'floating' | 'embedded';
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasUserMessages = messages.some((message) => message.role === 'user');

  useEffect(() => {
    if (!open) return;
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [isTyping, messages, open]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 140) onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 22, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          drag={variant === 'floating' ? 'y' : false}
          dragElastic={0.04}
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={variant === 'floating' ? handleDragEnd : undefined}
          className={cn(
            'pointer-events-auto relative flex min-h-0 flex-col overflow-hidden border border-[#E5E7EB] bg-white text-[#111827]',
            variant === 'floating'
              ? 'z-[80] h-[min(34.5rem,calc(100vh-8rem))] min-h-[28rem] w-[min(24.5rem,calc(100vw-1.25rem))] max-w-[24.5rem] origin-bottom-right rounded-[18px] shadow-[0_22px_70px_rgba(15,23,42,0.24)] max-sm:h-[min(34rem,calc(100vh-5.5rem))] max-sm:min-h-[26rem] max-sm:w-[calc(100vw-1rem)]'
              : 'h-full w-full max-w-none rounded-2xl shadow-[0_10px_30px_rgba(17,24,39,0.06)]',
            className,
          )}
        >
          <div className="bg-[linear-gradient(135deg,#1D4ED8_0%,#2563EB_52%,#0EA5E9_100%)] px-4 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-extrabold leading-none text-white">Orion Assistant</h2>
                <p className="mt-2 max-w-[19rem] text-xs font-medium leading-4 text-white/90">Ask about your analysis, trade plan, account, billing, and platform tools.</p>
              </div>
              {variant === 'floating' ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
                    aria-label="Minimize Orion chat"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close Orion chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain bg-white p-4 text-[#111827]">
            <div className="max-w-[82%] whitespace-normal rounded-br-2xl rounded-tl-2xl rounded-tr-2xl bg-[#EEF2F7] px-3.5 py-3 text-sm leading-6 text-[#1F2937] [overflow-wrap:anywhere] [word-break:break-word]">
              <span className="font-bold text-[#111827]">{pageLabel}</span>
              <span> · {pageSummary}</span>
            </div>

            <div className="space-y-4">
              {messages.map((message) => (
                <OrionMessageBubble key={message.id} message={message} onChoice={onChoice} />
              ))}
              {isTyping ? <OrionTypingBubble /> : null}
            </div>

          </div>

          <div className="border-t border-[#E5E7EB] bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {attachedFileLabel ? (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-medium text-[#1D4ED8]">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="truncate">{attachedFileLabel}</span>
              </div>
            ) : null}
            {quickActions.length ? (
              <div className="mb-2">
                <OrionQuickActions actions={quickActions} onAction={onQuickAction} compact={hasUserMessages} />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onAttachFile(file);
                  event.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachDisabled}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#2563EB] transition hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Attach chart"
              >
                <Paperclip className="h-4 w-4" />
              </button>
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
                placeholder="Type your question..."
                className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-3 text-sm leading-5 text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2563EB]"
              />
              <button
                type="button"
                onClick={onSubmit}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm transition hover:bg-[#1D4ED8]"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
