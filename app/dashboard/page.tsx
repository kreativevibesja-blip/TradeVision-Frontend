'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Activity, BarChart3, BrainCircuit, ChevronRight, Eye, LineChart, ShieldCheck, Target, TrendingDown, TrendingUp, Upload, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult } from '@/lib/api';
import { formatJamaicaDate } from '@/lib/jamaica-time';
import TradeCommandCenterModal from '@/components/TradeCommandCenterModal';
import TrackSetupButton from '@/components/TrackSetupButton';

const normalizeBias = (bias?: string | null) => {
  const value = (bias ?? '').toLowerCase();
  if (value.includes('bull')) return 'bullish';
  if (value.includes('bear')) return 'bearish';
  return 'neutral';
};

const getSessionIntelligence = () => {
  const hour = new Date().getUTCHours();
  if (hour < 7) return { label: 'Asian Session', sentiment: 'Measured liquidity', volatility: 42 };
  if (hour < 13) return { label: 'London Session', sentiment: 'Expansion active', volatility: 78 };
  if (hour < 20) return { label: 'New York Session', sentiment: 'Momentum-driven', volatility: 71 };
  return { label: 'Post Session', sentiment: 'Selective conditions', volatility: 36 };
};

export default function DashboardPage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commandCenterTarget, setCommandCenterTarget] = useState<{ id: string; pair: string; price?: number } | null>(null);

  useEffect(() => {
    const loadAnalyses = async () => {
      try {
        const data = await api.getAnalyses(token!, 1);
        setAnalyses(data.analyses);
        setTotal(data.total);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      void refreshUser();
      void loadAnalyses();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading, refreshUser]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading your workspace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your workspace</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionIntel = getSessionIntelligence();
  const averageConfidence = analyses.length ? Math.round(analyses.reduce((sum, analysis) => sum + (analysis.confidence || 0), 0) / analyses.length) : 82;
  const bullishCount = analyses.filter((analysis) => normalizeBias(analysis.bias) === 'bullish').length;
  const bearishCount = analyses.filter((analysis) => normalizeBias(analysis.bias) === 'bearish').length;
  const highQualitySetups = analyses.filter((analysis) => analysis.setupQuality === 'high' || (analysis.confidence || 0) >= 78).length;
  const momentumScore = Math.min(98, Math.max(52, Math.round((averageConfidence * 0.72) + (highQualitySetups * 4))));
  const opportunityTrackingCount = Math.max(3, Math.min(14, highQualitySetups + 2));
  const onboardingSummary = user.onboarding?.summary ?? 'Orion AI is prioritizing structure-led analysis and execution quality across your workspace.';

  const heroMetrics = [
    { label: 'AI confidence', value: `${averageConfidence}%`, detail: 'Orion composite scoring', icon: BrainCircuit },
    { label: 'Market sentiment', value: bullishCount >= bearishCount ? 'Bullish tilt' : 'Bearish tilt', detail: `${bullishCount} bullish / ${bearishCount} bearish`, icon: LineChart },
    { label: 'Volatility conditions', value: `${sessionIntel.volatility}/100`, detail: sessionIntel.sentiment, icon: Waves },
    { label: 'Structured opportunities', value: `${opportunityTrackingCount}`, detail: 'High-quality analyses identified', icon: BrainCircuit },
  ];

  const scoringBands = [
    { label: 'Structure Score', value: Math.max(68, averageConfidence - 6) },
    { label: 'Trend Strength', value: Math.max(64, momentumScore - 8) },
    { label: 'Momentum Score', value: momentumScore },
    { label: 'Liquidity Quality', value: Math.max(61, averageConfidence - 9 + highQualitySetups * 2) },
    { label: 'Volatility Quality', value: sessionIntel.volatility },
    { label: 'RR Potential', value: Math.max(58, averageConfidence - 4) },
    { label: 'Setup Confidence', value: averageConfidence },
  ];

  const journalInsights = [
    'Your best recent decisions are concentrated when structure and liquidity align.',
    'Weak momentum sessions should be filtered before execution planning begins.',
    'Orion AI is configured to coach discipline, not broadcast signals.',
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="space-y-6">
        <section className="overflow-hidden rounded-[36px] border border-[rgba(96,165,250,0.22)] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_30%),linear-gradient(180deg,rgba(8,15,31,0.96),rgba(3,7,18,0.98))] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="premium-kicker mb-4 border-[rgba(96,165,250,0.24)] bg-[rgba(59,130,246,0.12)] text-blue-100">TradeVision AI - Institutional Trading Intelligence</div>
              <h1 className="text-4xl font-bold tracking-[-0.08em] text-white sm:text-5xl lg:text-6xl">Precision Analysis. Smarter Execution.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">Powered by Orion AI. This workspace is built to help you understand markets better, improve execution, identify quality opportunities, and trade with structure instead of noise.</p>
              <p className="mt-5 max-w-2xl rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-7 text-white/72">{onboardingSummary}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/analyze">
                  <Button variant="gradient" size="lg" className="w-full gap-2 sm:w-auto">
                    <Upload className="h-4 w-4" />
                    Run AI Chart Analysis
                  </Button>
                </Link>
                <Link href="/dashboard/tradingview">
                  <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto">
                    <Waves className="h-4 w-4" />
                    Open Live Analysis
                  </Button>
                </Link>
                <Link href="/dashboard/command-center">
                  <Button variant="ghost" size="lg" className="w-full gap-2 sm:w-auto">
                    <Target className="h-4 w-4" />
                    Command Center
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="mobile-card rounded-[26px] p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="metric-label">{metric.label}</div>
                    <metric.icon className="h-4 w-4 text-[var(--gold-light)]" />
                  </div>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.06em] text-white">{metric.value}</div>
                  <div className="mt-2 text-sm text-white/56">{metric.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">Live Market Pulse</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Institutional environment readout</h2>
                </div>
                <Badge variant="outline" className="border-blue-300/20 text-blue-100">{sessionIntel.label}</Badge>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="metric-label">Session intelligence</div>
                  <div className="mt-3 text-lg font-semibold text-white">{sessionIntel.sentiment}</div>
                  <div className="mt-2 text-sm text-white/54">Liquidity behavior and expansion conditions are being tracked in real time.</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="metric-label">Trending opportunities</div>
                  <div className="mt-3 text-lg font-semibold text-white">{highQualitySetups || 0} active candidates</div>
                  <div className="mt-2 text-sm text-white/54">Only structure-led setups are promoted toward execution planning.</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="metric-label">Weak market warning</div>
                  <div className="mt-3 text-lg font-semibold text-white">{sessionIntel.volatility < 50 ? 'Elevated caution' : 'Conditions tradable'}</div>
                  <div className="mt-2 text-sm text-white/54">ORION AI favors confirmation when momentum quality deteriorates.</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 sm:p-7">
              <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">AI Analysis Quality Scoring</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Setup confidence architecture</h2>
              <div className="mt-6 space-y-4">
                {scoringBands.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm text-white/72">
                      <span>{item.label}</span>
                      <span className="font-mono text-white">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2.5 bg-white/8" indicatorClassName="bg-[linear-gradient(90deg,#38bdf8,#60a5fa,#2563eb)]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/18 bg-blue-400/10 text-blue-100"><Target className="h-5 w-5" /></div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">Command Center</div>
                  <div className="mt-1 text-xl font-semibold text-white">Execution planning workspace</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/62">Promote a structured analysis into an institutional execution panel with price awareness, invalidation context, and disciplined review flow.</p>
              <Link href="/dashboard/command-center" className="mt-5 block">
                <Button variant="outline" className="w-full justify-between gap-2">
                  Open Command Center
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/18 bg-blue-400/10 text-blue-100"><BrainCircuit className="h-5 w-5" /></div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">AI Analysis Workflow</div>
                  <div className="mt-1 text-xl font-semibold text-white">From chart to execution plan</div>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-white/68">
                {['Upload clean chart context', 'Review structure and liquidity', 'Validate invalidation and RR', 'Promote only strong setups'].map((status, index) => (
                  <div key={status} className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span>{status}</span>
                    <span className="font-mono text-blue-100">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/18 bg-blue-400/10 text-blue-100"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">Trader Development</div>
                  <div className="mt-1 text-xl font-semibold text-white">Journal intelligence</div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {journalInsights.map((item) => (
                  <div key={item} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/68">{item}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">Recent Analyses</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Your latest intelligence archive</h2>
                </div>
                <div className="text-sm text-white/50">{total} total analyses</div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-white/54">Loading analyses...</div>
              ) : analyses.length === 0 ? (
                <div className="py-14 text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-white/18" />
                  <p className="mt-4 text-sm text-white/54">No analyses yet. Start by uploading a chart for ORION AI.</p>
                  <Link href="/analyze" className="mt-5 inline-block">
                    <Button variant="gradient" size="sm">Analyze your first chart</Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-6 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                  {analyses.map((analysis) => {
                    const bias = normalizeBias(analysis.bias);

                    return (
                      <motion.div key={analysis.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                              {bias === 'bullish' ? <TrendingUp className="h-5 w-5 text-emerald-300" /> : bias === 'bearish' ? <TrendingDown className="h-5 w-5 text-rose-300" /> : <Activity className="h-5 w-5 text-blue-200" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-lg font-semibold text-white">{analysis.pair}</div>
                                <Badge variant={bias === 'bullish' ? 'success' : bias === 'bearish' ? 'destructive' : 'outline'}>{bias}</Badge>
                                {analysis.marketCondition ? <Badge variant="outline" className="capitalize">{analysis.marketCondition}</Badge> : null}
                              </div>
                              <div className="mt-3 grid gap-2 text-sm text-white/56 sm:grid-cols-3">
                                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2">Timeframe: <span className="text-white">{analysis.timeframe}</span></div>
                                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2">Confidence: <span className="text-white">{analysis.confidence || 0}%</span></div>
                                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2">Analyzed: <span className="text-white">{analysis.createdAt ? formatJamaicaDate(analysis.createdAt) : 'Recent'}</span></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                            <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto"><TrackSetupButton analysisId={analysis.id} /></div>
                            <Button size="sm" className="w-full gap-2 border border-blue-400/24 bg-blue-500/16 text-blue-100 hover:bg-blue-500/24 sm:w-auto" onClick={() => setCommandCenterTarget({ id: analysis.id, pair: analysis.pair, price: analysis.currentPrice })}>
                              <Target className="h-4 w-4" />
                              Open Command Center
                            </Button>
                            <Link href={`/analyze?analysisId=${encodeURIComponent(analysis.id)}`} className="w-full sm:w-auto">
                              <Button variant="ghost" size="sm" className="w-full gap-2 sm:w-auto">
                                <Eye className="h-4 w-4" />
                                Review Analysis
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 sm:p-7">
                <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">System Architecture</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Scalable, worker-led intelligence</h2>
                <div className="mt-5 space-y-3 text-sm text-white/66">
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">Supabase handles auth, profiles, subscriptions, onboarding responses, journals, and saved analyses.</div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">Heavy analysis, live chart enrichment, and execution tooling are delegated to backend workers, queues, caching, and websocket delivery.</div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">Realtime is reserved for active sessions, notifications, and live workspaces rather than constant database polling.</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 sm:p-7">
                <div className="text-[11px] uppercase tracking-[0.28em] text-blue-100/70">Workspace Priorities</div>
                <div className="mt-5 space-y-3">
                  {[
                    'Run new chart analysis when structure is clearly visible.',
                    'Promote only high-quality analyses into execution planning.',
                    'Use command center for execution planning, not impulsive entry chasing.',
                    'Review outcomes through the journal to build consistency.',
                  ].map((item) => (
                    <div key={item} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/68">{item}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </motion.div>

      <TradeCommandCenterModal
        tradeId={commandCenterTarget?.id ?? ''}
        pair={commandCenterTarget?.pair ?? ''}
        currentPrice={commandCenterTarget?.price}
        open={commandCenterTarget !== null}
        onClose={() => setCommandCenterTarget(null)}
      />
    </div>
  );
}