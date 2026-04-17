'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Crown, Loader2, ShieldAlert, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult } from '@/lib/api';

const formatPrice = (value: number | null | undefined, pair: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }

  const normalized = pair.toUpperCase();
  if (normalized.includes('BTC') || normalized.includes('US30') || normalized.includes('NAS100') || normalized.includes('SPX500')) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  if (normalized.includes('JPY')) {
    return value.toFixed(3);
  }

  if (normalized.includes('XAU')) {
    return value.toFixed(1);
  }

  return value.toFixed(4);
};

const formatZone = (
  zone: { min: number | null; max: number | null } | null | undefined,
  pair: string,
) => {
  if (!zone || typeof zone.min !== 'number' || typeof zone.max !== 'number') {
    return 'Not available';
  }

  return `${formatPrice(zone.min, pair)} - ${formatPrice(zone.max, pair)}`;
};

type OneTapPlan = {
  key: 'primary' | 'counter-trend' | 'left-side';
  label: string;
  tone: 'default' | 'aggressive' | 'future';
  bias: string;
  action: string;
  entry: string;
  confirmation: string;
  stopLoss: string;
  targets: string[];
  reason: string;
  warning?: string;
};

function OneTapPageContent() {
  const searchParams = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const analysisId = searchParams.get('analysisId');

  useEffect(() => {
    if (!token || !analysisId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const result = await api.getAnalysis(analysisId, token);
        if (!cancelled) {
          setAnalysis(result.analysis);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || 'Unable to load the selected analysis.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [analysisId, token]);

  const plans = useMemo<OneTapPlan[]>(() => {
    if (!analysis) {
      return [];
    }

    const nextPlans: OneTapPlan[] = [];

    if (analysis.entryZone || analysis.stopLoss != null || analysis.takeProfit1 != null) {
      nextPlans.push({
        key: 'primary',
        label: 'Primary Setup',
        tone: 'default',
        bias: analysis.bias || 'NEUTRAL',
        action: analysis.finalVerdict?.action || analysis.recommendation || 'wait',
        entry: formatZone(analysis.entryZone, analysis.pair),
        confirmation: analysis.confirmation === 'none' ? 'No confirmation yet' : analysis.confirmation,
        stopLoss: formatPrice(analysis.stopLoss, analysis.pair),
        targets: [analysis.takeProfit1, analysis.takeProfit2, analysis.takeProfit3]
          .filter((value): value is number => typeof value === 'number')
          .map((value) => formatPrice(value, analysis.pair)),
        reason: analysis.reasoning,
        warning: analysis.message,
      });
    }

    if (analysis.counterTrendPlan?.bias && analysis.counterTrendPlan.bias !== 'none') {
      nextPlans.push({
        key: 'counter-trend',
        label: 'Counter-Trend Variant',
        tone: 'aggressive',
        bias: analysis.counterTrendPlan.bias,
        action: analysis.counterTrendPlan.action,
        entry: formatZone(analysis.counterTrendPlan.entryZone, analysis.pair),
        confirmation: analysis.counterTrendPlan.confirmation === 'none' ? 'Support or resistance rejection' : analysis.counterTrendPlan.confirmation,
        stopLoss: formatPrice(analysis.counterTrendPlan.stopLoss, analysis.pair),
        targets: [analysis.counterTrendPlan.takeProfit1, analysis.counterTrendPlan.takeProfit2, analysis.counterTrendPlan.takeProfit3]
          .filter((value): value is number => typeof value === 'number')
          .map((value) => formatPrice(value, analysis.pair)),
        reason: analysis.counterTrendPlan.reason,
        warning: analysis.counterTrendPlan.warning,
      });
    }

    if (analysis.leftSidePlan?.bias && analysis.leftSidePlan.bias !== 'none') {
      nextPlans.push({
        key: 'left-side',
        label: 'Left-Side Setup',
        tone: 'future',
        bias: analysis.leftSidePlan.bias,
        action: analysis.leftSidePlan.action,
        entry: formatZone(analysis.leftSidePlan.entryZone, analysis.pair),
        confirmation: analysis.leftSidePlan.confirmation === 'none' ? 'Return into the older left-side zone and confirm' : analysis.leftSidePlan.confirmation,
        stopLoss: formatPrice(analysis.leftSidePlan.stopLoss, analysis.pair),
        targets: [analysis.leftSidePlan.takeProfit1, analysis.leftSidePlan.takeProfit2, analysis.leftSidePlan.takeProfit3]
          .filter((value): value is number => typeof value === 'number')
          .map((value) => formatPrice(value, analysis.pair)),
        reason: analysis.leftSidePlan.reason,
        warning: analysis.leftSidePlan.warning,
      });
    }

    return nextPlans;
  }, [analysis]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="mobile-card max-w-xl">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sign in to open the One-Tap workspace.
        </CardContent>
      </Card>
    );
  }

  if (user.subscription !== 'TOP_TIER' && user.subscription !== 'VIP_AUTO_TRADER') {
    return (
      <Card className="mobile-card max-w-2xl overflow-hidden border-violet-500/20 bg-violet-500/5">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">One-Tap is available on the PRO+ plan</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Upgrade to PRO+ to open manual One-Tap execution plans built from your saved analyses.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/checkout?plan=TOP_TIER">
              <Button className="gap-2 bg-violet-600 text-white hover:bg-violet-500">
                <Crown className="h-4 w-4" />
                Upgrade to PRO+
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisId) {
    return (
      <Card className="mobile-card max-w-2xl">
        <CardContent className="p-8 space-y-4 text-center">
          <Zap className="mx-auto h-10 w-10 text-violet-300" />
          <div>
            <h1 className="text-2xl font-semibold">Open One-Tap from an analysis</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start from a saved analysis result so the workspace can load the correct entry, stop, and targets.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="mobile-card max-w-2xl border-red-500/20 bg-red-500/5">
        <CardContent className="p-8 space-y-4 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-300" />
          <div>
            <h1 className="text-2xl font-semibold">Unable to load One-Tap</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error || 'The selected analysis could not be loaded.'}</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mobile-card overflow-hidden border-violet-500/20 bg-violet-500/5">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                <Zap className="h-3.5 w-3.5" />
                One-Tap Manual Workspace
              </div>
              <div>
                <h1 className="text-2xl font-semibold sm:text-3xl">{analysis.pair} {analysis.timeframe}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Use this screen as your manual execution checklist. Nothing is auto-sent to a broker here.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">{analysis.bias || 'neutral'}</Badge>
              {analysis.marketCondition ? <Badge variant="outline" className="capitalize">{analysis.marketCondition}</Badge> : null}
              <Badge variant="outline">{analysis.confidence}/100</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={plan.tone === 'aggressive'
                ? 'mobile-card border-rose-500/30 bg-rose-500/5'
                : plan.tone === 'future'
                  ? 'mobile-card border-amber-500/30 bg-amber-500/5'
                  : 'mobile-card border-violet-500/30 bg-violet-500/5'}
            >
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-violet-300" />
                  {plan.label}
                  <Badge variant="outline" className="capitalize">{plan.bias} · {plan.action}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.warning ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                    {plan.warning}
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4 text-cyan-300" />
                      Entry
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.entry}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-amber-300" />
                      Confirmation
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">{plan.confirmation}</p>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-200">
                      <ShieldAlert className="h-4 w-4" />
                      Stop Loss
                    </div>
                    <p className="text-sm text-red-100">{plan.stopLoss}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Targets
                    </div>
                    <p className="text-sm text-emerald-100">{plan.targets.length > 0 ? plan.targets.join(' / ') : 'Not available'}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium">Execution Note</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.reason}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="text-lg">Execution Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Confirm the selected plan still matches live structure.</p>
              <p>2. Wait for the listed confirmation before entering.</p>
              <p>3. Place the stop at the invalidation level, not at a random distance.</p>
              <p>4. Scale or secure at TP1 if momentum stalls near liquidity.</p>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="text-lg">Open Full Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Need the full structure breakdown, support and resistance zones, or markup image again?
              </p>
              <Link href={`/analyze?analysisId=${encodeURIComponent(analysis.id)}`}>
                <Button variant="outline" className="w-full gap-2">
                  View Full Analysis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OneTapPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <OneTapPageContent />
    </Suspense>
  );
}