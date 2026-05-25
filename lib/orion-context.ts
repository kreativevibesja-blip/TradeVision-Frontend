'use client';

import type { AnalysisResult, ScannedSignal } from '@/lib/api';

export const ORION_CONTEXT_EVENT = 'orion-context:update';

export type OrionFocusContext =
  | {
      kind: 'analysis';
      id: string;
      title: string;
      market: string;
      timeframe: string;
      confidence: number;
      trend: AnalysisResult['trend'];
      signalType: AnalysisResult['signalType'];
      entryBias: NonNullable<AnalysisResult['entryPlan']>['bias'] | 'none';
    }
  | {
      kind: 'live-signal';
      id: string;
      source: ScannedSignal['source'];
      title: string;
      market: string;
      timeframe: string;
      direction: ScannedSignal['direction'];
      confidence: number;
      grade: ScannedSignal['grade'];
      status: ScannedSignal['status'];
    };

export const buildOrionAnalysisContext = (analysis: AnalysisResult): OrionFocusContext => ({
  kind: 'analysis',
  id: analysis.id,
  title: `${analysis.pair} ${analysis.timeframe} analysis`,
  market: analysis.pair,
  timeframe: analysis.timeframe,
  confidence: analysis.confidence,
  trend: analysis.trend,
  signalType: analysis.signalType,
  entryBias: analysis.entryPlan?.bias ?? 'none',
});

export const buildOrionLiveSignalContext = (
  signal: Pick<ScannedSignal, 'key' | 'source' | 'symbolLabel' | 'timeframe' | 'direction' | 'confidence' | 'grade' | 'status'>,
): OrionFocusContext => ({
  kind: 'live-signal',
  id: signal.key,
  source: signal.source,
  title: `${signal.symbolLabel} ${signal.direction.toUpperCase()} live setup`,
  market: signal.symbolLabel,
  timeframe: signal.timeframe,
  direction: signal.direction,
  confidence: signal.confidence,
  grade: signal.grade,
  status: signal.status,
});

export const emitOrionContext = (context: OrionFocusContext | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<OrionFocusContext | null>(ORION_CONTEXT_EVENT, { detail: context }));
};