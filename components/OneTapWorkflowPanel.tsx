'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OneTapWorkflowPanelProps {
  open: boolean;
  title: string;
  subtitle: string;
  steps: string[];
  fullscreen?: boolean;
}

export function OneTapWorkflowPanel({
  open,
  title,
  subtitle,
  steps,
  fullscreen = false,
}: OneTapWorkflowPanelProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setActiveStepIndex(0);
      return;
    }

    setActiveStepIndex(0);

    if (steps.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, 1250);

    return () => window.clearInterval(interval);
  }, [open, steps]);

  const progress = useMemo(() => {
    if (steps.length <= 1) {
      return open ? 82 : 0;
    }

    return 18 + Math.round((activeStepIndex / (steps.length - 1)) * 74);
  }, [activeStepIndex, open, steps]);

  if (!open) {
    return null;
  }

  const panel = (
    <Card className="w-full max-w-md overflow-hidden border-cyan-400/20 bg-slate-950/92 shadow-[0_25px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl">
      <CardContent className="p-6 sm:p-7">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
            <Zap className="h-6 w-6" />
          </div>

          <div className="space-y-3">
            <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">One-Tap Workflow</Badge>
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <AnimatePresence mode="wait">
              <motion.p
                key={steps[activeStepIndex] ?? title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="text-sm font-medium text-cyan-100"
              >
                {steps[activeStepIndex] ?? title}
              </motion.p>
            </AnimatePresence>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-slate-400">Preparing your trade plan and loading the result page.</p>
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
            {steps.map((step, index) => {
              const isComplete = index < activeStepIndex;
              const isCurrent = index === activeStepIndex;

              return (
                <div key={step} className="flex items-center gap-2 text-sm">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Loader2 className={`h-4 w-4 ${isCurrent ? 'animate-spin text-cyan-200' : 'text-slate-500'}`} />
                  )}
                  <span className={isComplete || isCurrent ? 'text-slate-100' : 'text-slate-500'}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!fullscreen) {
    return panel;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 px-6 backdrop-blur-sm">
      {panel}
    </div>
  );
}