'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { MessageCircle, Paperclip, Send, X } from 'lucide-react';
import { OrionMessageBubble } from '@/orion/components/OrionMessageBubble';
import { OrionQuickActions } from '@/orion/components/OrionQuickActions';
import { OrionTypingBubble } from '@/orion/components/OrionTypingBubble';
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
  attachedFileLabel,
  attachDisabled,
  onClose,
  onInputChange,
  onSubmit,
  onAttachFile,
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
  attachedFileLabel?: string | null;
  attachDisabled?: boolean;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onAttachFile: (file: File) => void | Promise<void>;
  onQuickAction: (actionId: OrionQuickActionId) => void;
  onChoice: (choice: OrionChatChoice) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasUserMessages = messages.some((message) => message.role === 'user');

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
          className="pointer-events-auto relative z-[80] flex h-[min(30rem,calc(100vh-7rem))] w-[min(21rem,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.18)] max-sm:h-[min(16.75rem,calc(100vh-10rem))] max-sm:w-[min(16.75rem,calc(100vw-2rem))]"
          style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#e2e8f0' }}
        >
          <div
            className="border-b border-blue-400 bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-white"
            style={{ background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)', color: '#ffffff', borderColor: '#60a5fa' }}
          >
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

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-white px-3 py-3 text-slate-900 max-sm:space-y-2.5 max-sm:px-2.5 max-sm:py-2.5" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
            <div className="rounded-[16px] border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-5 text-blue-700" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#dbeafe' }}>
              <span className="font-semibold text-blue-900" style={{ color: '#1e3a8a' }}>{pageLabel}</span>
              <span className="text-blue-700" style={{ color: '#2563eb' }}> · {pageSummary}</span>
            </div>
            <div className="space-y-3">
              {messages.map((message) => (
                <OrionMessageBubble key={message.id} message={message} onChoice={onChoice} />
              ))}
              {isTyping ? <OrionTypingBubble /> : null}
            </div>
            {!hasUserMessages ? <OrionQuickActions actions={quickActions} onAction={onQuickAction} /> : null}
          </div>

          <div className="border-t border-sky-100 bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-sm:px-2.5 max-sm:py-2.5" style={{ backgroundColor: '#ffffff', borderColor: '#dbeafe' }}>
            {attachedFileLabel ? (
              <div className="mb-2 flex items-center gap-2 rounded-full border border-blue-100 bg-sky-50 px-3 py-1.5 text-xs text-blue-700" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#dbeafe' }}>
                <Paperclip className="h-3.5 w-3.5" />
                <span className="truncate">{attachedFileLabel}</span>
              </div>
            ) : null}
            <div className="flex items-end gap-3 max-sm:gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onAttachFile(file);
                  }

                  event.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachDisabled}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 max-sm:h-9 max-sm:w-9"
                style={{ backgroundColor: '#ffffff', color: '#2563eb', borderColor: '#bfdbfe' }}
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
                placeholder="Type your message..."
                className="min-h-10 min-w-0 flex-1 resize-none rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 max-sm:min-h-9 max-sm:px-3.5 max-sm:py-2"
                style={{ backgroundColor: '#ffffff', color: '#334155', borderColor: '#cbd5e1' }}
              />
              <button
                type="button"
                onClick={onSubmit}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition hover:opacity-95 max-sm:h-9 max-sm:w-9"
                style={{ background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)', color: '#ffffff' }}
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