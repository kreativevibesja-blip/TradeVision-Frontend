'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatJamaicaDate } from '@/lib/jamaica-time';
import TradeCommandCenterModal from '@/components/TradeCommandCenterModal';
import TrackSetupButton from '@/components/TrackSetupButton';
import {
  BarChart3,
  Upload,
  Crown,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  ArrowRight,
  Zap,
  CreditCard,
  CandlestickChart,
  RadioTower,
  Target,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commandCenterTarget, setCommandCenterTarget] = useState<{ id: string; pair: string; price?: number } | null>(null);

  useEffect(() => {
    if (token) {
      void refreshUser();
      loadAnalyses();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading your dashboard...</p>
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
            <p className="text-muted-foreground mb-4">Please sign in to view your dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaidPlan = user.subscription !== 'FREE';
  const isTopTier = user.subscription === 'TOP_TIER' || user.subscription === 'VIP_AUTO_TRADER';
  const monthlyLimitLabel = isTopTier ? '500 analyses per month' : '300 analyses per month';
  const usageLabel = isPaidPlan ? 'Monthly Usage' : 'Daily Usage';
  const usageValue = isPaidPlan ? monthlyLimitLabel : '2';
  const usagePercent = isPaidPlan ? 0 : ((user.dailyUsage || 0) / 2) * 100;

  return (
    <div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.name || user.email.split('@')[0]}</p>
            </div>
            <Link href="/analyze">
              <Button variant="gradient" className="gap-2">
                <Upload className="h-4 w-4" />
                New Analysis
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Subscription</span>
                  <Badge variant={isPaidPlan ? 'default' : 'secondary'}>
                    {isPaidPlan ? <Crown className="h-3 w-3 mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                    {user.subscription}
                  </Badge>
                </div>
                {!isPaidPlan && (
                  <Link href="/pricing" className="block">
                    <Button variant="outline" size="sm" className="w-full mt-2">Upgrade to Pro</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{usageLabel}</span>
                  <span className="text-sm font-medium">{isPaidPlan ? usageValue : `${user.dailyUsage || 0} / ${usageValue}`}</span>
                </div>
                {!isPaidPlan && (
                  <Progress value={usagePercent} className="h-2 mt-2" indicatorClassName={usagePercent >= 100 ? 'bg-red-500' : 'bg-primary'} />
                )}
                {isPaidPlan && (
                  <p className="text-2xl font-bold text-green-400 mt-2">{isTopTier ? '500 / month' : '300 / month'}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <span className="text-sm text-muted-foreground">Total Analyses</span>
                <p className="text-3xl font-bold mt-2">{total}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Billing</span>
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">View plan status, expiry, and renewal options.</p>
                <Link href="/dashboard/billing" className="block">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    Manage Billing
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Analyses */}
          <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="mobile-card overflow-hidden">
              <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
                <div className="space-y-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                    <CandlestickChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">TradingView Live Chart Analysis</h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Open a live TradingView chart, pick a symbol and timeframe, and run a Pro-only AI analysis backed by real OHLC market data.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isPaidPlan ? (
                    <Link href="/dashboard/tradingview">
                      <Button variant="gradient" className="gap-2">
                        <CandlestickChart className="h-4 w-4" />
                        Open Live Chart
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/pricing">
                        <Button className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
                          <Crown className="h-4 w-4" />
                          Unlock Pro Access
                        </Button>
                      </Link>
                      <p className="text-xs text-muted-foreground">Live TradingView analysis is available on paid plans.</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card overflow-hidden">
              <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
                <div className="space-y-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <RadioTower className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Deriv Live Charts</h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Stream live Deriv synthetic candles, switch symbols and timeframes, and draw AI supply and demand overlays directly on the chart.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isPaidPlan ? (
                    <Link href="/dashboard/deriv">
                      <Button variant="gradient" className="gap-2">
                        <RadioTower className="h-4 w-4" />
                        Open Deriv Charts
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/pricing">
                        <Button className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
                          <Crown className="h-4 w-4" />
                          Unlock Pro Access
                        </Button>
                      </Link>
                      <p className="text-xs text-muted-foreground">Deriv live charts are available on paid plans.</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Command Center Info Banner */}
          {analyses.length > 0 && (
            <Card className="mobile-card border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Target className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white">Trade Command Center</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click the blue <span className="text-blue-400 font-medium">Command</span> button on any analysis below for real-time trade execution guidance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">No analyses yet</p>
                  <Link href="/analyze">
                    <Button variant="gradient" size="sm">Analyze Your First Chart</Button>
                  </Link>
                </div>
              ) : (
                <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                  {analyses.map((a) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                          {a.bias === 'BULLISH' ? (
                            <TrendingUp className="h-5 w-5 text-green-400" />
                          ) : a.bias === 'BEARISH' ? (
                            <TrendingDown className="h-5 w-5 text-red-400" />
                          ) : (
                            <Minus className="h-5 w-5 text-yellow-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{a.pair}</p>
                            <Badge variant={a.bias === 'BULLISH' ? 'success' : a.bias === 'BEARISH' ? 'destructive' : 'warning'} className="text-xs">
                              {a.bias}
                            </Badge>
                            {a.marketCondition ? (
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {a.marketCondition}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{a.timeframe}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatJamaicaDate(a.createdAt)}
                            </span>
                            {a.confidence && (
                              <span>Score: {a.confidence}/100</span>
                            )}
                            {a.counterTrendPlan?.bias && a.counterTrendPlan.bias !== 'none' ? (
                              <span className="text-rose-300">Counter plan</span>
                            ) : null}
                            {a.leftSidePlan?.bias && a.leftSidePlan.bias !== 'none' ? (
                              <span className="text-amber-300">Left-side plan</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 flex-wrap justify-end">
                        <TrackSetupButton analysisId={a.id} />
                        <Button
                          size="sm"
                          className="gap-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                          onClick={() => setCommandCenterTarget({ id: a.id, pair: a.pair, price: a.currentPrice })}
                        >
                          <Target className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Command</span>
                        </Button>
                        <Link href={`/analyze?analysisId=${encodeURIComponent(a.id)}`} className="shrink-0">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
