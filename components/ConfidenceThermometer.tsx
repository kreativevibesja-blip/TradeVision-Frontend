'use client';

import { motion } from 'framer-motion';
import { Flame, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConfidenceThermometerData } from '@/lib/api';

interface Props {
  data: ConfidenceThermometerData | null;
  loading?: boolean;
  locked?: boolean;
  onUnlock?: () => void;
}

export function ConfidenceThermometer({ data, loading = false, locked = false, onUnlock }: Props) {
  const score = data?.score ?? 0;
  const fillClass = score >= 75
    ? 'from-emerald-500 via-lime-400 to-cyan-300'
    : score >= 55
      ? 'from-amber-500 via-yellow-400 to-orange-300'
      : 'from-rose-500 via-red-400 to-orange-300';

  return (
    <Card className="mobile-card overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,189,89,0.15),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-amber-300" />
          Confidence Thermometer
        </CardTitle>
      </CardHeader>
      <CardContent>
        {locked ? (
          <div className="rounded-2xl border border-amber-400/20 bg-black/20 p-5 text-center">
            <Lock className="mx-auto h-5 w-5 text-amber-300" />
            <p className="mt-3 text-sm font-medium">Advanced confidence breakdown</p>
            <p className="mt-2 text-sm text-white/65">Unlock weighted factor scoring for structure, liquidity, and confirmation quality.</p>
            <Button onClick={onUnlock} className="mt-4 bg-amber-500 text-black hover:bg-amber-400">Upgrade to Pro</Button>
          </div>
        ) : loading || !data ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-white/60">Building thermometer...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[110px_1fr]">
            <div className="flex items-center justify-center">
              <div className="relative h-64 w-16 rounded-full border border-white/10 bg-white/5 p-2">
                <motion.div
                  className={`absolute bottom-2 left-2 right-2 rounded-full bg-gradient-to-t ${fillClass}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(score, 6)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-between px-3 py-4 text-[10px] uppercase tracking-[0.18em] text-white/45">
                  <span>100</span>
                  <span>50</span>
                  <span>0</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">Weighted score</p>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="text-4xl font-semibold text-white">{score}</span>
                      <span className="pb-1 text-sm text-white/55">/100</span>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-amber-200">
                    {data.bucket}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{data.summary}</p>
              </div>
              <div className="space-y-3">
                {data.factors.map((factor) => (
                  <div key={factor.key} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{factor.label}</p>
                        <p className="text-xs text-white/55">Weight {factor.weight}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">{factor.score}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">score</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/8">
                      <motion.div
                        className={`h-2 rounded-full bg-gradient-to-r ${fillClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.score}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/60">{factor.summary}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-200/80">
                <Sparkles className="h-3.5 w-3.5" />
                Score blends the model confidence with weighted market-structure inputs.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}