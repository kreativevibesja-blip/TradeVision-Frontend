'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const REASONS = [
  'Great experience',
  'Easy to use',
  'Confusing interface',
  'Missing features',
  'Too slow',
  'Other',
] as const;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function FeedbackModal({ open, onClose, userId }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showTextInput = reason === 'Other';

  const handleSubmit = async () => {
    if (!supabase || rating === 0 || !reason) return;

    setSubmitting(true);
    try {
      await supabase.from('feedback').insert({
        user_id: userId,
        rating,
        reason,
        message: message.trim() || null,
      });
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch {
      // Silent fail — non-critical
    } finally {
      setSubmitting(false);
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
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[400px] rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 shadow-lg"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <span className="text-5xl">🙌</span>
                <p className="text-lg font-semibold">Thanks for the feedback!</p>
                <p className="text-sm text-muted-foreground">We appreciate you taking the time.</p>
              </motion.div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">How&apos;s your experience?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We&apos;d love your feedback — it only takes a few seconds.
                  </p>
                </div>

                {/* Star rating */}
                <div className="mb-4 flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoveredStar || rating);
                    return (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="rounded-lg p-1 transition-all duration-150 hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors duration-150 ${
                            active ? 'text-amber-400' : 'text-zinc-600'
                          }`}
                          fill={active ? 'currentColor' : 'none'}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Reason dropdown */}
                <div className="mb-3">
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/80 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="" disabled>
                      Select a reason...
                    </option>
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional textarea */}
                <AnimatePresence>
                  {showTextInput && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3 overflow-hidden"
                    >
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us more..."
                        rows={3}
                        maxLength={500}
                        className="w-full resize-none rounded-lg border border-white/10 bg-zinc-800/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  disabled={rating === 0 || !reason || submitting}
                  onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? 'Sending...' : 'Submit Feedback'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
