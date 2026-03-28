'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { api, type Announcement } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import { Megaphone, Sparkles, X, Clock3 } from 'lucide-react';

const DISMISSED_UPDATES_KEY = 'tradevision_dismissed_updates';

export function GlobalUpdatesModal() {
  const pathname = usePathname();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = sessionStorage.getItem(DISMISSED_UPDATES_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setDismissedIds(parsed.filter((value): value is string => typeof value === 'string'));
      }
    } catch {
      sessionStorage.removeItem(DISMISSED_UPDATES_KEY);
    }
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setOpen(false);
      return;
    }

    let cancelled = false;
    api.getActiveAnnouncements()
      .then((data) => {
        if (!cancelled) {
          setAnnouncements(data.announcements || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnnouncements([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const nextAnnouncement = useMemo(
    () => announcements.find((announcement) => !dismissedIds.includes(announcement.id)),
    [announcements, dismissedIds]
  );

  useEffect(() => {
    setOpen(Boolean(nextAnnouncement) && !pathname.startsWith('/admin'));
  }, [nextAnnouncement, pathname]);

  const closeAnnouncement = () => {
    if (!nextAnnouncement) {
      setOpen(false);
      return;
    }

    const nextDismissed = [...dismissedIds, nextAnnouncement.id];
    setDismissedIds(nextDismissed);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DISMISSED_UPDATES_KEY, JSON.stringify(nextDismissed));
    }
    setOpen(false);
  };

  if (!nextAnnouncement || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/72 px-4 py-8 backdrop-blur-md"
          onClick={closeAnnouncement}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.24 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_32px_100px_rgba(8,145,178,0.24)] sm:p-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.04),transparent)]" />
            <button
              onClick={closeAnnouncement}
              aria-label="Close update"
              className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/14 text-cyan-300 ring-1 ring-cyan-300/20">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      Platform Update
                    </span>
                    {nextAnnouncement.expiresAt && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                        <Clock3 className="h-3.5 w-3.5" />
                        Live Until {formatJamaicaDateTime(nextAnnouncement.expiresAt)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{nextAnnouncement.title}</h2>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base">{nextAnnouncement.content}</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeAnnouncement}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}