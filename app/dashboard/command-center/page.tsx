'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult } from '@/lib/api';
import { formatJamaicaDate } from '@/lib/jamaica-time';
import TradeCommandCenterModal from '@/components/TradeCommandCenterModal';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Loader2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function CommandCenterPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTarget, setActiveTarget] = useState<{ id: string; pair: string; price?: number } | null>(null);

  const loadAnalyses = async (p = page) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getAnalyses(token, p);
      setAnalyses(data.analyses);
      setTotal(data.total);
      setPages(data.pages);
      setPage(data.page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAnalyses();
    else if (!authLoading) setLoading(false);
  }, [token, authLoading]);

  const filtered = search.trim()
    ? analyses.filter((a) =>
        a.pair.toLowerCase().includes(search.trim().toLowerCase())
      )
    : analyses;

  const biasIcon = (bias?: string) => {
    if (bias === 'bullish') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (bias === 'bearish') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Target className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Command Center</h1>
            <p className="text-xs text-gray-500">
              Select any past analysis to launch real-time execution guidance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[10px] text-gray-500">{total} analyses available</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Filter by pair (e.g. EUR/USD, XAU/USD)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors"
        />
      </div>

      {/* Analysis List */}
      <Card className="mobile-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            Your Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading analyses...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Target className="h-10 w-10 mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 mb-1">
                {search ? 'No matching analyses' : 'No analyses yet'}
              </p>
              <p className="text-xs text-gray-600">
                {search
                  ? 'Try a different pair name'
                  : 'Upload a chart on the Analyze page to get started'}
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence mode="popLayout">
                {filtered.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/5 hover:border-white/10 transition-colors cursor-pointer"
                    onClick={() => setActiveTarget({ id: a.id, pair: a.pair, price: a.currentPrice })}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {biasIcon(a.bias)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-white truncate">{a.pair}</p>
                          {a.bias && (
                            <Badge
                              variant={a.bias === 'bullish' ? 'success' : a.bias === 'bearish' ? 'destructive' : 'secondary'}
                              className="text-[10px] uppercase"
                            >
                              {a.bias}
                            </Badge>
                          )}
                          {a.confidence != null && (
                            <span className="text-[10px] text-gray-500 tabular-nums">
                              {a.confidence}/10
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                          {a.timeframe}{a.isDualChart ? ` + ${a.ltfTimeframe || 'LTF'}` : ''} · {a.createdAt ? formatJamaicaDate(a.createdAt) : ''}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="gap-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 shadow-[0_0_10px_rgba(59,130,246,0.15)] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTarget({ id: a.id, pair: a.pair, price: a.currentPrice });
                      }}
                    >
                      <Target className="h-3.5 w-3.5" />
                      Launch
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadAnalyses(page - 1)}
                className="gap-1 text-xs text-gray-400"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-xs text-gray-600">
                Page {page} of {pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pages}
                onClick={() => loadAnalyses(page + 1)}
                className="gap-1 text-xs text-gray-400"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Command Center Modal */}
      <TradeCommandCenterModal
        tradeId={activeTarget?.id ?? ''}
        pair={activeTarget?.pair ?? ''}
        currentPrice={activeTarget?.price}
        open={activeTarget !== null}
        onClose={() => setActiveTarget(null)}
      />
    </div>
  );
}
