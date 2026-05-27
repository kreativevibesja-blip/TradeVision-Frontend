'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { TicketForm } from '@/components/TicketForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ORION_WORKFLOW_EVENT } from '@/orion/services/orionWorkflowEvents';
import { LifeBuoy, X } from 'lucide-react';

export function SupportButton() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [orionDraft, setOrionDraft] = useState<{
    subject?: string;
    message?: string;
    category?: 'ACCOUNT' | 'BILLING' | 'ANALYSIS' | 'BUG' | 'FEATURE' | 'GENERAL';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  } | null>(null);
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
    const handleOrionWorkflow = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: string;
        draft?: {
          subject?: string;
          message?: string;
          category?: 'ACCOUNT' | 'BILLING' | 'ANALYSIS' | 'BUG' | 'FEATURE' | 'GENERAL';
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        };
      }>;

      if (customEvent.detail?.type !== 'open-support-ticket') {
        return;
      }

      setOrionDraft(customEvent.detail.draft ?? null);
      setMenuOpen(false);
      setModalOpen(true);
    };

    window.addEventListener(ORION_WORKFLOW_EVENT, handleOrionWorkflow as EventListener);
    return () => window.removeEventListener(ORION_WORKFLOW_EVENT, handleOrionWorkflow as EventListener);
  }, []);
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
                    <TicketForm open={modalOpen} draft={orionDraft} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isLiveWorkspace ? null : null}
    </>
  );
}
