'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TicketForm } from '@/components/TicketForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LifeBuoy, MessageCircle, X } from 'lucide-react';

const whatsappUrl = 'https://wa.me/18762797956?text=Hi%20TradeVision%20AI%2C%20I%20need%20support.';

export function WhatsAppSupportButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="mx-auto flex min-h-full w-full max-w-6xl items-end p-3 sm:items-center sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <Card className="max-h-[92vh] w-full overflow-hidden border-white/10 bg-slate-950/95 shadow-[0_35px_120px_rgba(2,6,23,0.65)]">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-emerald-500/10 p-5 sm:p-6">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                        <LifeBuoy className="h-3.5 w-3.5" />
                        Support Desk
                      </div>
                      <h2 className="text-2xl font-semibold text-white">Need help with ChartMind AI?</h2>
                      <p className="mt-2 max-w-2xl text-sm text-slate-300">
                        Create a tracked ticket for account, billing, chart analysis, or bug issues. If it is urgent, jump straight to WhatsApp.
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setOpen(false)} aria-label="Close support">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="max-h-[calc(92vh-96px)] overflow-y-auto p-4 sm:p-6">
                    <TicketForm open={open} whatsappUrl={whatsappUrl} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 md:bottom-6 md:right-6">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact support on WhatsApp"
          className="hidden rounded-full border border-emerald-400/30 bg-emerald-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_18px_45px_rgba(16,185,129,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:bg-emerald-400 md:inline-flex md:items-center md:gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open support center"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500 text-white shadow-[0_18px_45px_rgba(6,182,212,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-background md:h-auto md:w-auto md:gap-2 md:px-4 md:py-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 md:h-7 md:w-7">
            <LifeBuoy className="h-5 w-5 md:h-4 md:w-4" />
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.08em] md:inline">Support Center</span>
        </button>
      </div>
    </>
  );
}