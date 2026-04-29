'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Compass, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLATFORM_MODAL_KEY = 'tradevision_platform_intro_dismissed';

function getLocalDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PlatformIntroModal() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/platform') || pathname.startsWith('/auth/callback')) {
      setOpen(false);
      return;
    }

    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(PLATFORM_MODAL_KEY) : getLocalDateStamp();
    if (stored === getLocalDateStamp()) {
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), 1100);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLATFORM_MODAL_KEY, getLocalDateStamp());
    }
    setOpen(false);
  };

  const handleLearnMore = () => {
    dismiss();
    router.push('/platform');
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[108] flex items-center justify-center bg-slate-950/68 px-4 py-8 backdrop-blur-md"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.24 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.2),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_32px_110px_rgba(8,145,178,0.22)] sm:p-8"
          >
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />

            <button
              type="button"
              onClick={dismiss}
              aria-label="Close platform intro"
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Start Here
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-300 ring-1 ring-cyan-300/20">
                  <Compass className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Curious How TradeVision Actually Works?
                  </h2>
                  <p className="text-sm leading-7 text-slate-200 sm:text-base">
                    See how traders move from chart upload to structured analysis, live confirmations, scanner workflows, and premium tools that are built to save time and sharpen decision-making.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-200">
                Explore the full platform step by step, understand what each feature is for, and find the right plan when you are ready to unlock more.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleLearnMore} size="lg" className="w-full gap-2 sm:flex-1">
                  Learn More About The Platform
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={dismiss} className="w-full sm:w-auto">
                  Maybe Later
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}