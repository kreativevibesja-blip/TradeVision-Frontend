'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Zap,
  Clock,
  Brain,
  Activity,
  TrendingUp,
  BarChart3,
  Target,
  Sparkles,
  AlertTriangle,
  Crown,
} from 'lucide-react';

const ROTATING_MESSAGES = [
  { text: 'Analyzing market structure...', icon: BarChart3 },
  { text: 'Identifying liquidity zones...', icon: Activity },
  { text: 'Scanning for order blocks...', icon: Target },
  { text: 'Detecting Smart Money footprints...', icon: Brain },
  { text: 'Refining entry points...', icon: TrendingUp },
  { text: 'Validating risk-reward ratio...', icon: Sparkles },
  { text: 'Finalizing your setup...', icon: Zap },
];

const POLL_INTERVAL_MS = 2_500;

function QueuePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const jobId = searchParams.get('jobId');
  const analysisId = searchParams.get('analysisId');

  const [status, setStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [position, setPosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotate messages
  useEffect(() => {
    messageRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 3_000);
    return () => {
      if (messageRef.current) clearInterval(messageRef.current);
    };
  }, []);

  // Simulated progress bar
  useEffect(() => {
    progressRef.current = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (status === 'completed') return 100;
        if (status === 'processing') return Math.min(prev + 1.5, 88);
        // Queued: advance slowly up to 15%
        return Math.min(prev + 0.3, 15);
      });
    }, 300);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [status]);

  // Poll backend
  const poll = useCallback(async () => {
    if (!jobId || !token) return;

    try {
      const data = await api.getQueueStatus(jobId, token);
      setStatus(data.status);
      setPosition(data.position);
      setEstimatedWait(data.estimatedWait);

      if (data.status === 'completed' && data.result) {
        setSimulatedProgress(100);
        // Redirect to the analysis page after a short delay for the animation
        setTimeout(() => {
          router.push(`/analyze?analysisId=${data.analysisId || analysisId}`);
        }, 800);
      }

      if (data.status === 'failed') {
        setError(data.error || 'Analysis failed. Please try again.');
      }
    } catch {
      // Silently retry on network errors
    }
  }, [jobId, token, router, analysisId]);

  useEffect(() => {
    if (!jobId || !token) return;

    poll(); // Initial poll
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, token, poll]);

  if (!jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto" />
          <p className="text-muted-foreground">No job ID provided.</p>
          <Link href="/analyze" className="text-primary hover:underline">
            Go to Analysis
          </Link>
        </div>
      </div>
    );
  }

  const currentMessage = ROTATING_MESSAGES[messageIndex];
  const MessageIcon = currentMessage.icon;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="mobile-card p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold sm:text-3xl">
              <span className="text-gradient">Analyzing Your Chart</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Our AI is processing your chart with Smart Money Concepts
            </p>
          </div>

          {/* Animated Radar / Pulse */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32">
              {/* Outer pulse rings */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-500/30"
                animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1 }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Rotating status text */}
          <div className="text-center h-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium text-foreground"
              >
                <MessageIcon className="h-4 w-4 text-primary" />
                {currentMessage.text}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
                initial={{ width: '0%' }}
                animate={{ width: `${simulatedProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-6rem', '30rem'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{status === 'processing' ? 'Processing...' : status === 'completed' ? 'Done!' : 'In queue'}</span>
              <span>{Math.round(simulatedProgress)}%</span>
            </div>
          </div>

          {/* Queue position */}
          {status === 'queued' && position > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4 text-center space-y-1"
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Queue Position</span>
              </div>
              <p className="text-3xl font-bold text-gradient">#{position}</p>
              {estimatedWait > 0 && (
                <p className="text-xs text-muted-foreground">
                  Estimated wait: ~{estimatedWait < 60 ? `${estimatedWait}s` : `${Math.ceil(estimatedWait / 60)}m`}
                </p>
              )}
            </motion.div>
          )}

          {/* Processing indicator */}
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4 text-center space-y-1"
            >
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity className="h-4 w-4 text-green-400" />
                </motion.div>
                <span className="text-sm font-medium text-green-400">AI is analyzing your chart</span>
              </div>
              <p className="text-xs text-muted-foreground">This usually takes 8–15 seconds</p>
            </motion.div>
          )}

          {/* Error state */}
          {status === 'failed' && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4 text-center space-y-3 border-red-500/30"
            >
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Analysis Failed</span>
              </div>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Link
                href="/analyze"
                className="inline-block px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors"
              >
                Try Again
              </Link>
            </motion.div>
          )}

          {/* Upgrade CTA */}
          {user?.subscription !== 'PRO' && status === 'queued' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 p-5 text-center space-y-3"
            >
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 animate-pulse" />

              <div className="relative space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-300">Skip the queue with Pro</span>
                  <Zap className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Get instant AI analysis, dual-chart mode, and advanced SMC insights
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold text-sm hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg shadow-yellow-500/20"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Link>
              </div>
            </motion.div>
          )}

          {/* "AI thinking steps" animation */}
          <div className="grid grid-cols-4 gap-2">
            {['Structure', 'Liquidity', 'Entry', 'Signal'].map((step, i) => {
              const isActive = status === 'processing'
                ? simulatedProgress > (i + 1) * 15
                : status === 'completed';
              const isCurrent = status === 'processing' && simulatedProgress > i * 15 && simulatedProgress <= (i + 1) * 15;

              return (
                <div key={step} className="text-center space-y-1.5">
                  <motion.div
                    className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-500 ${
                      isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : isCurrent
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-white/5 text-muted-foreground border border-white/10'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {isActive ? '✓' : i + 1}
                  </motion.div>
                  <p className={`text-[10px] sm:text-xs ${isActive ? 'text-green-400' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <QueuePageContent />
    </Suspense>
  );
}
