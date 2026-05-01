'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { api, type Announcement, type AnnouncementType } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import {
  Megaphone, Sparkles, X, Clock3, Rocket, Wrench,
  Percent, Shield, PartyPopper, ArrowRight, Zap, Star,
} from 'lucide-react';

const DISMISSED_UPDATES_KEY = 'tradevision_dismissed_updates';

/* ─── Theme config per announcement type ─── */
interface ThemeConfig {
  icon: typeof Rocket;
  badge: string;
  badgeBg: string;
  badgeBorder: string;
  badgeIcon: typeof Rocket;
  gradient: string;
  glow: string;
  accentRing: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  ctaGradient: string;
  decorations: React.ReactNode;
}

const floatingKeyframes = `
@keyframes float-slow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(3deg)} }
@keyframes float-med  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(-2deg)} }
@keyframes pulse-glow  { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
@keyframes confetti-1  { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(60px) rotate(360deg);opacity:0} }
@keyframes confetti-2  { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(80px) rotate(-270deg);opacity:0} }
@keyframes shimmer     { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
`;

const ConfettiDot = ({ className, delay }: { className: string; delay: string }) => (
  <div className={`absolute h-2 w-2 rounded-full ${className}`} style={{ animation: `confetti-1 2.5s ${delay} infinite` }} />
);

const THEMES: Record<AnnouncementType, ThemeConfig> = {
  update: {
    icon: Rocket,
    badge: 'Platform Update',
    badgeBg: 'bg-cyan-300/10',
    badgeBorder: 'border-cyan-300/20',
    badgeIcon: Rocket,
    gradient: 'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]',
    glow: 'shadow-[0_32px_100px_rgba(8,145,178,0.24)]',
    accentRing: 'ring-cyan-300/20',
    iconBg: 'bg-cyan-400/14',
    iconColor: 'text-cyan-300',
    borderColor: 'border-cyan-400/20',
    ctaGradient: 'from-cyan-500 to-sky-600',
    decorations: (
      <>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
        <div className="absolute -left-4 bottom-8 h-16 w-16 rounded-full bg-sky-500/10 blur-xl" style={{ animation: 'pulse-glow 3s 1s ease-in-out infinite' }} />
        <Rocket className="absolute right-8 top-16 h-5 w-5 text-cyan-400/20" style={{ animation: 'float-slow 6s ease-in-out infinite' }} />
      </>
    ),
  },
  maintenance: {
    icon: Wrench,
    badge: 'Maintenance',
    badgeBg: 'bg-amber-300/10',
    badgeBorder: 'border-amber-300/20',
    badgeIcon: Wrench,
    gradient: 'bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]',
    glow: 'shadow-[0_32px_100px_rgba(245,158,11,0.18)]',
    accentRing: 'ring-amber-300/20',
    iconBg: 'bg-amber-400/14',
    iconColor: 'text-amber-300',
    borderColor: 'border-amber-400/20',
    ctaGradient: 'from-amber-500 to-orange-600',
    decorations: (
      <>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
        <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-amber-400/20 via-amber-400/5 to-transparent" />
        {/* Gear-style dashes */}
        <div className="absolute right-6 top-20 flex gap-1.5 opacity-20">
          {[...Array(3)].map((_, i) => <div key={i} className="h-1 w-4 rounded-full bg-amber-300" style={{ animation: `pulse-glow 2s ${i * 0.3}s ease-in-out infinite` }} />)}
        </div>
      </>
    ),
  },
  discount: {
    icon: Percent,
    badge: 'Limited Offer',
    badgeBg: 'bg-pink-300/10',
    badgeBorder: 'border-pink-300/20',
    badgeIcon: Zap,
    gradient: 'bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.20),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]',
    glow: 'shadow-[0_32px_100px_rgba(236,72,153,0.22)]',
    accentRing: 'ring-pink-300/20',
    iconBg: 'bg-pink-400/14',
    iconColor: 'text-pink-300',
    borderColor: 'border-pink-400/20',
    ctaGradient: 'from-pink-500 via-fuchsia-500 to-purple-600',
    decorations: (
      <>
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-pink-500/12 blur-2xl" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
        <div className="absolute -left-4 bottom-4 h-20 w-20 rounded-full bg-purple-500/10 blur-xl" style={{ animation: 'pulse-glow 4s 0.5s ease-in-out infinite' }} />
        {/* Confetti */}
        <ConfettiDot className="left-[15%] top-4 bg-pink-400" delay="0s" />
        <ConfettiDot className="left-[30%] top-2 bg-purple-400" delay="0.4s" />
        <ConfettiDot className="right-[20%] top-6 bg-fuchsia-400" delay="0.8s" />
        <ConfettiDot className="right-[35%] top-3 bg-yellow-400" delay="1.2s" />
        <Star className="absolute right-10 top-14 h-4 w-4 text-yellow-400/30" style={{ animation: 'float-med 4s ease-in-out infinite' }} />
        {/* Shimmer stripe */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/40 to-transparent" style={{ backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />
      </>
    ),
  },
  new_feature: {
    icon: Sparkles,
    badge: 'New Feature',
    badgeBg: 'bg-emerald-300/10',
    badgeBorder: 'border-emerald-300/20',
    badgeIcon: Sparkles,
    gradient: 'bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(52,211,153,0.18),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]',
    glow: 'shadow-[0_32px_100px_rgba(16,185,129,0.22)]',
    accentRing: 'ring-emerald-300/20',
    iconBg: 'bg-emerald-400/14',
    iconColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/20',
    ctaGradient: 'from-emerald-500 to-teal-600',
    decorations: (
      <>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
        <Sparkles className="absolute right-6 top-16 h-5 w-5 text-emerald-400/25" style={{ animation: 'float-slow 5s ease-in-out infinite' }} />
        <Sparkles className="absolute left-[60%] bottom-8 h-3 w-3 text-teal-400/20" style={{ animation: 'float-med 4s 1s ease-in-out infinite' }} />
      </>
    ),
  },
  security: {
    icon: Shield,
    badge: 'Security Notice',
    badgeBg: 'bg-rose-300/10',
    badgeBorder: 'border-rose-300/20',
    badgeIcon: Shield,
    gradient: 'bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(225,29,72,0.16),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]',
    glow: 'shadow-[0_32px_100px_rgba(244,63,94,0.18)]',
    accentRing: 'ring-rose-300/20',
    iconBg: 'bg-rose-400/14',
    iconColor: 'text-rose-300',
    borderColor: 'border-rose-400/20',
    ctaGradient: 'from-rose-500 to-red-600',
    decorations: (
      <>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
        <Shield className="absolute right-8 top-16 h-5 w-5 text-rose-400/20" style={{ animation: 'float-slow 6s ease-in-out infinite' }} />
        {/* Alert bar at top */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
      </>
    ),
  },
  event: {
    icon: PartyPopper,
    badge: 'Special Event',
    badgeBg: 'bg-yellow-300/10',
    badgeBorder: 'border-yellow-300/20',
    badgeIcon: PartyPopper,
    gradient: 'bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(234,179,8,0.18),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]',
    glow: 'shadow-[0_32px_100px_rgba(234,179,8,0.18)]',
    accentRing: 'ring-yellow-300/20',
    iconBg: 'bg-yellow-400/14',
    iconColor: 'text-yellow-300',
    borderColor: 'border-yellow-400/20',
    ctaGradient: 'from-yellow-500 to-amber-600',
    decorations: (
      <>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-500/10 blur-2xl" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
        <ConfettiDot className="left-[12%] top-6 bg-yellow-400" delay="0.2s" />
        <ConfettiDot className="left-[25%] top-3 bg-amber-400" delay="0.6s" />
        <ConfettiDot className="right-[18%] top-5 bg-orange-400" delay="1s" />
        <PartyPopper className="absolute right-8 top-16 h-5 w-5 text-yellow-400/25" style={{ animation: 'float-slow 5s ease-in-out infinite' }} />
      </>
    ),
  },
};

const PLAN_LABELS: Record<string, string> = { PRO: 'PRO', TOP_TIER: 'PRO+', GOLDX: 'GoldX', GOLDX_PULSE: 'GoldX Pulse' };

export function GlobalUpdatesModal() {
  const pathname = usePathname();
  const router = useRouter();
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

  const announcementType: AnnouncementType = nextAnnouncement.type || 'update';
  const theme = THEMES[announcementType] || THEMES.update;
  const Icon = theme.icon;
  const BadgeIcon = theme.badgeIcon;

  const isDiscount = announcementType === 'discount' && nextAnnouncement.couponCode;
  const discountBaseUrl = nextAnnouncement.targetPlan === 'GOLDX'
    ? '/goldx/checkout'
    : `/checkout?plan=${encodeURIComponent(nextAnnouncement.targetPlan || 'PRO')}`;
  const checkoutUrl = isDiscount
    ? nextAnnouncement.targetPlan === 'GOLDX'
      ? discountBaseUrl
      : `${discountBaseUrl}&coupon=${encodeURIComponent(nextAnnouncement.couponCode!)}`
    : null;

  // Plan promotion CTA — shown for ANY update with a targetPlan (even non-discount)
  const hasPlanPromo = !isDiscount && nextAnnouncement.targetPlan;
  const planPromoUrl = hasPlanPromo
    ? (nextAnnouncement.targetPlan === 'GOLDX'
        ? '/goldx/checkout'
        : `/checkout?plan=${encodeURIComponent(nextAnnouncement.targetPlan!)}`)
    : null;
  const planLabel = PLAN_LABELS[nextAnnouncement.targetPlan || 'PRO'] || 'PRO';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: floatingKeyframes }} />
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
              className={`relative w-full max-w-2xl overflow-hidden rounded-[28px] border ${theme.borderColor} ${theme.gradient} p-6 ${theme.glow} sm:p-8`}
            >
              {/* Decorative elements per type */}
              {theme.decorations}

              {/* Subtle glass overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.04),transparent)]" />

              <button
                onClick={closeAnnouncement}
                aria-label="Close update"
                className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg} ${theme.iconColor} ring-1 ${theme.accentRing}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border ${theme.badgeBorder} ${theme.badgeBg} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${theme.iconColor}`}>
                        <BadgeIcon className="h-3.5 w-3.5" />
                        {theme.badge}
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

                {/* Content */}
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:p-6">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base">{nextAnnouncement.content}</p>
                </div>

                {/* Discount CTA */}
                {isDiscount && checkoutUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-[20px] border border-pink-400/20 bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-purple-500/10 p-5"
                  >
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                      <div className="text-center sm:text-left">
                        <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                          <Zap className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-semibold text-white">
                            Use code <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-pink-300">{nextAnnouncement.couponCode}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Automatically applied at checkout for the {PLAN_LABELS[nextAnnouncement.targetPlan || 'PRO']} plan
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          closeAnnouncement();
                          router.push(checkoutUrl);
                        }}
                        className={`group inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${theme.ctaGradient} px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]`}
                      >
                        Claim Discount
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Plan promotion CTA — shown for non-discount updates with a targetPlan */}
                {hasPlanPromo && planPromoUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`rounded-[20px] border ${theme.borderColor} bg-gradient-to-r from-white/5 via-white/[0.03] to-white/5 p-5`}
                  >
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                      <div className="text-center sm:text-left">
                        <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-semibold text-white">
                            Unlock the full experience with {planLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Get access to premium features and priority support
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          closeAnnouncement();
                          router.push(planPromoUrl);
                        }}
                        className={`group inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${theme.ctaGradient} px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]`}
                      >
                        Get {planLabel} Plan Now
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Footer actions */}
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
    </>
  );
}