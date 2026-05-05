'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AnalysisResult } from '@/lib/api';

export interface ReactionChallengeBounds {
  minPrice: number;
  maxPrice: number;
  source: 'input' | 'inferred';
}

export interface ReactionChallengeResult {
  userEntry: number;
  aiEntry: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  score: number;
  distanceLabel: string;
  timing: string;
  verdict: string;
  coaching: string;
}

interface Props {
  open: boolean;
  analysis: AnalysisResult;
  imageUrl: string | null;
  bounds: ReactionChallengeBounds | null;
  submitting?: boolean;
  initialResult?: ReactionChallengeResult | null;
  onClose: () => void;
  onSubmit: (userEntry: number) => void;
}

const formatPrice = (value: number | null | undefined, pair: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  const normalized = pair.toUpperCase();
  if (normalized.includes('BTC') || normalized.includes('ETH') || normalized.includes('US30') || normalized.includes('NAS100') || normalized.includes('SPX500')) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (normalized.includes('JPY')) return value.toFixed(3);
  if (normalized.includes('XAU')) return value.toFixed(1);
  return value.toFixed(4);
};

export function ReactionChallengeModal({ open, analysis, imageUrl, bounds, submitting = false, initialResult, onClose, onSubmit }: Props) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [userEntry, setUserEntry] = useState<string>('');
  const [markerY, setMarkerY] = useState<number | null>(null);
  const result = useMemo(() => initialResult ?? null, [initialResult]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (result?.userEntry) {
      setUserEntry(String(result.userEntry));
    }
  }, [open, result?.userEntry]);

  const applyPointerSelection = (clientY: number) => {
    if (!bounds || !imageRef.current) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const y = clamp(clientY - rect.top, 0, rect.height);
    const ratio = 1 - y / rect.height;
    const mappedPrice = bounds.minPrice + ratio * (bounds.maxPrice - bounds.minPrice);

    setMarkerY((y / rect.height) * 100);
    setUserEntry(String(Number(mappedPrice.toFixed(6))));
  };

  const handleChartClick = (event: React.MouseEvent<HTMLImageElement>) => {
    applyPointerSelection(event.clientY);
  };

  const handleChartPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    applyPointerSelection(event.clientY);
  };

  const submit = () => {
    const parsed = Number(userEntry);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    onSubmit(parsed);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[#071019] text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="grid gap-0 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(0,219,222,0.16),_transparent_42%)] p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">Reaction Challenge</p>
                    <h3 className="mt-1 text-2xl font-semibold">Where would you enter?</h3>
                    <p className="mt-2 text-sm text-white/65">Click the chart where you would trigger the trade. We’ll compare your timing to the AI execution map.</p>
                  </div>
                  <Button variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5" onClick={onClose}>Close</Button>
                </div>
                <div className="mt-5 rounded-[24px] border border-white/10 bg-black/25 p-3">
                  {imageUrl ? (
                    <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-black/30">
                      <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Reaction challenge chart"
                        className="max-h-[60vh] w-full cursor-crosshair object-contain"
                        onClick={handleChartClick}
                        onPointerDown={handleChartPointerDown}
                        style={{ touchAction: 'manipulation' }}
                      />
                      {markerY !== null ? (
                        <div className="pointer-events-none absolute inset-x-0" style={{ top: `${markerY}%` }}>
                          <div className="relative">
                            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cyan-300/70" />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-cyan-300/50 bg-cyan-400/20 p-1.5 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.45)]">
                              <Crosshair className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex min-h-[280px] items-center justify-center rounded-[18px] border border-dashed border-white/10 text-sm text-white/50">Challenge image unavailable for this analysis.</div>
                  )}
                </div>
                {bounds ? (
                  <p className="mt-3 text-xs text-white/50">Chart mapping range: {formatPrice(bounds.minPrice, analysis.pair)} to {formatPrice(bounds.maxPrice, analysis.pair)}.</p>
                ) : null}
              </div>
              <div className="p-5 lg:p-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Your call</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Input value={userEntry} onChange={(event) => setUserEntry(event.target.value)} placeholder="Enter price or click the chart" type="number" step="any" />
                    <Button onClick={submit} disabled={submitting || !userEntry.trim()} className="w-full bg-cyan-400 text-black hover:bg-cyan-300">
                      {submitting ? 'Scoring your entry...' : 'Submit Entry'}
                    </Button>
                  </div>
                </div>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">AI comparison</span>
                  </div>
                  {result ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Accuracy</p>
                          <p className="mt-1 text-3xl font-semibold text-cyan-200">{result.score}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Distance</p>
                          <p className="mt-1 text-lg font-semibold text-white">{result.distanceLabel}</p>
                          <p className="text-xs text-white/45">{result.timing}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/8 p-4">
                        <p className="text-sm font-medium text-white">{result.verdict}</p>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">{result.coaching}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">AI Entry</p>
                          <p className="mt-1 font-semibold text-white">{formatPrice(result.aiEntry, analysis.pair)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Stop Loss</p>
                          <p className="mt-1 font-semibold text-white">{formatPrice(result.stopLoss, analysis.pair)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Take Profit</p>
                          <p className="mt-1 font-semibold text-white">{formatPrice(result.takeProfit, analysis.pair)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-white/60">Submit your entry to reveal the AI entry, stop loss, and take profit map for this setup.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));