'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Mail, Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { api, type PaidSubscriberItem } from '@/lib/api';

interface ProSubscribersModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
}

const PLAN_LABELS: Record<string, string> = {
  PRO: 'PRO',
  TOP_TIER: 'PRO+',
  VIP_AUTO_TRADER: 'VIP',
  FREE: 'Free',
};

const PLAN_COLORS: Record<string, string> = {
  PRO: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  TOP_TIER: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  VIP_AUTO_TRADER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  FREE: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

function getStatusInfo(sub: PaidSubscriberItem) {
  if (sub.status === 'expired') {
    return { label: 'Expired', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle };
  }
  if (sub.daysLeft !== null && sub.daysLeft <= 7) {
    return { label: `${sub.daysLeft}d left`, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock };
  }
  if (sub.daysLeft !== null) {
    return { label: `${sub.daysLeft}d left`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle };
  }
  return { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle };
}

export function ProSubscribersModal({ open, onClose, token }: ProSubscribersModalProps) {
  const [subscribers, setSubscribers] = useState<PaidSubscriberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    api.admin.getPaidSubscribers(token)
      .then((res) => setSubscribers(res.subscribers))
      .catch(() => setError('Failed to load subscribers'))
      .finally(() => setLoading(false));
  }, [open, token]);

  const handleSendReminder = async (userId: string) => {
    setSendingId(userId);
    try {
      await api.admin.sendRenewalReminder(userId, token);
      setSentIds((prev) => new Set(prev).add(userId));
    } catch {
      // show inline error could be added
    } finally {
      setSendingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#111118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-violet-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Crown className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Pro Subscribers</h2>
                  <p className="text-xs text-zinc-500">
                    {subscribers.length} paid subscriber{subscribers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-20 text-red-400 text-sm">{error}</div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-sm">No paid subscribers found</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {subscribers.map((sub) => {
                    const status = getStatusInfo(sub);
                    const StatusIcon = status.icon;
                    const isSending = sendingId === sub.id;
                    const isSent = sentIds.has(sub.id);

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white truncate">
                              {sub.name || 'Unnamed User'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PLAN_COLORS[sub.plan] || PLAN_COLORS.FREE}`}>
                              {PLAN_LABELS[sub.plan] || sub.plan}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500 truncate">{sub.email}</div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-4 ml-4">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </div>

                          {/* Send button */}
                          <button
                            onClick={() => handleSendReminder(sub.id)}
                            disabled={isSending || isSent}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSent
                                ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                                : 'bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40'
                            } disabled:opacity-50`}
                          >
                            {isSending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isSent ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                            {isSent ? 'Sent' : 'Remind'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
