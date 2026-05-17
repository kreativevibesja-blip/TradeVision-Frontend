'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { TicketForm } from '@/components/TicketForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronUp, LifeBuoy, PlusCircle, X } from 'lucide-react';

export function WhatsAppSupportButton() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isLiveWorkspace = pathname === '/dashboard/tradingview' || pathname === '/dashboard/deriv';

  useEffect(() => {
    if (!menuOpen && !modalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [menuOpen, modalOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  const openTicketModal = () => {
    setMenuOpen(false);
    setModalOpen(true);
  };

  if (isLiveWorkspace) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/80 backdrop-blur-md"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="mx-auto flex min-h-full w-full max-w-5xl items-start p-3 pt-20 sm:items-center sm:p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <Card className="my-auto w-full overflow-hidden border-[rgba(255,223,112,0.12)] bg-slate-950/95 shadow-[0_35px_120px_rgba(2,6,23,0.65)] sm:max-h-[94vh]">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,223,112,0.12)] bg-[linear-gradient(135deg,rgba(255,223,112,0.14),rgba(212,175,55,0.04),rgba(0,0,0,0.18))] p-4 sm:p-5">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(255,223,112,0.22)] bg-[rgba(255,223,112,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gold-light)]">
                        <LifeBuoy className="h-3.5 w-3.5" />
                        Support Desk
                      </div>
                      <h2 className="text-xl font-semibold text-white sm:text-2xl">How can we help?</h2>
                      <p className="mt-1 max-w-xl text-sm text-slate-300">
                        Create a tracked ticket for account, billing, chart analysis, or bug issues.
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setModalOpen(false)} aria-label="Close support">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable] sm:max-h-[calc(94vh-88px)] sm:p-4">
                    <TicketForm open={modalOpen} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div ref={menuRef} className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="mb-3 w-56 rounded-3xl border border-[rgba(255,223,112,0.12)] bg-slate-950/95 p-2 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={openTicketModal}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white transition-colors hover:bg-[rgba(255,223,112,0.08)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,223,112,0.12)] text-[var(--gold-light)]">
                  <PlusCircle className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">Create Ticket</span>
                  <span className="block text-xs text-slate-400">Open the tracked support form</span>
                </span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="Open help options"
          className="premium-button-shell inline-flex items-center gap-2 rounded-full border border-[rgba(255,223,112,0.28)] bg-[linear-gradient(135deg,#7a5b14,#d4af37,#f7d774)] px-3 py-3 text-black shadow-[0_18px_45px_rgba(212,175,55,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[rgba(255,223,112,0.35)] focus:ring-offset-2 focus:ring-offset-background md:gap-3 md:px-4"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/12">
            <LifeBuoy className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold md:hidden">👋</span>
          <span className="hidden text-sm font-semibold md:inline">👋 Help me</span>
          <ChevronUp className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </div>
    </>
  );
}