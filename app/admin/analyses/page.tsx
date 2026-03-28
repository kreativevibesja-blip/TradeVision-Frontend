'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, resolveAssetUrl, type AdminAnalysisLog, type AnalysisResult } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import { TrendingUp, TrendingDown, Minus, Eye, X, Search } from 'lucide-react';

const getStatusBadge = (analysis: AdminAnalysisLog) => {
  if (analysis.status === 'COMPLETED') {
    return { label: 'Success', variant: 'success' as const };
  }

  if (analysis.status === 'FAILED') {
    return { label: 'Failed', variant: 'destructive' as const };
  }

  return { label: analysis.status === 'QUEUED' ? 'Queued' : 'Processing', variant: 'warning' as const };
};

const getBiasBadge = (bias: string | null) => {
  if (bias === 'BULLISH') {
    return { variant: 'success' as const, icon: <TrendingUp className="h-3 w-3 mr-1" />, label: bias };
  }

  if (bias === 'BEARISH') {
    return { variant: 'destructive' as const, icon: <TrendingDown className="h-3 w-3 mr-1" />, label: bias };
  }

  return { variant: 'warning' as const, icon: <Minus className="h-3 w-3 mr-1" />, label: bias || 'N/A' };
};

export default function AdminAnalysesPage() {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState<AdminAnalysisLog[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) loadAnalyses();
  }, [token, page, searchQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAnalyses(token!, page, searchQuery || undefined);
      setAnalyses(data.analyses);
      setTotalPages(data.pages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const openAnalysisViewer = async (analysisId: string) => {
    if (!token) {
      return;
    }

    try {
      setViewerOpen(true);
      setViewerLoading(true);
      const data = await api.admin.getAnalysisById(token, analysisId);
      setSelectedAnalysis(data.analysis);
    } catch {
      setViewerOpen(false);
      setSelectedAnalysis(null);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedAnalysis(null);
    setViewerLoading(false);
  };

  const primaryChartUrl = selectedAnalysis
    ? resolveAssetUrl(selectedAnalysis.markedImageUrl || selectedAnalysis.originalImageUrl || selectedAnalysis.imageUrl || null)
    : null;
  const htfChartUrl = selectedAnalysis
    ? resolveAssetUrl(selectedAnalysis.htfMarkedImageUrl || selectedAnalysis.htfOriginalImageUrl || null)
    : null;
  const ltfChartUrl = selectedAnalysis
    ? resolveAssetUrl(selectedAnalysis.ltfMarkedImageUrl || selectedAnalysis.ltfOriginalImageUrl || null)
    : null;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">Analysis Logs</h1>

        <Card>
          <CardContent className="p-0">
            <div className="border-b border-white/10 p-4">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by user email or name"
                  className="w-full rounded-lg border border-white/10 bg-background/60 py-2 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/40"
                />
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Model</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Pair</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">TF</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Bias</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Score</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Failure Reason</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-sm text-muted-foreground">
                          {searchQuery ? 'No analysis logs found for that user.' : 'No analysis logs found.'}
                        </td>
                      </tr>
                    ) : analyses.map((a) => {
                      const statusBadge = getStatusBadge(a);
                      const biasBadge = getBiasBadge(a.bias);

                      return (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                          <td className="p-4 min-w-[220px]">
                            <p className="text-xs text-muted-foreground break-all">{a.user?.email || 'Unknown'}</p>
                            <div className="mt-2">
                              <Badge variant={a.user?.subscription === 'PRO' ? 'default' : 'secondary'}>
                                {a.user?.subscription || 'FREE'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 min-w-[120px]">
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </td>
                          <td className="p-4 min-w-[220px]">
                            <p className="text-xs text-muted-foreground">{a.modelUsed || 'Unknown'}</p>
                            {a.usedFallback ? (
                              <div className="mt-2">
                                <Badge variant="warning">Fallback used</Badge>
                              </div>
                            ) : null}
                          </td>
                          <td className="p-4 font-medium">{a.pair}</td>
                          <td className="p-4 text-muted-foreground">{a.timeframe}</td>
                          <td className="p-4">
                            <Badge variant={biasBadge.variant}>
                              {biasBadge.icon}
                              {biasBadge.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{a.confidence ?? '-'}{a.confidence !== null ? '/100' : ''}</td>
                          <td className="p-4 max-w-[320px] text-xs text-muted-foreground whitespace-normal break-words">{a.failureReason || '-'}</td>
                          <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">{formatJamaicaDateTime(a.createdAt)}</td>
                          <td className="p-4">
                            <Button variant="outline" size="sm" onClick={() => openAnalysisViewer(a.id)} aria-label={`View analysis ${a.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-4">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {viewerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedAnalysis ? `${selectedAnalysis.pair} ${selectedAnalysis.timeframe}` : 'Loading analysis'}
                </h2>
                {selectedAnalysis ? (
                  <p className="text-sm text-slate-400">
                    {selectedAnalysis.bias || 'N/A'} • {selectedAnalysis.confidence ?? '-'}{selectedAnalysis.confidence !== null ? '/100' : ''}
                  </p>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={closeViewer} aria-label="Close analysis viewer">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-6">
              {viewerLoading ? (
                <div className="py-16 text-center text-sm text-slate-400">Loading analysis...</div>
              ) : selectedAnalysis ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Bias</p><p className="mt-2 text-sm font-medium text-white">{selectedAnalysis.bias || 'N/A'}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p><p className="mt-2 text-sm font-medium text-white">{selectedAnalysis.confidence ?? '-'}{selectedAnalysis.confidence !== null ? '/100' : ''}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Signal</p><p className="mt-2 text-sm font-medium text-white">{selectedAnalysis.signalType || 'N/A'}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Current Price</p><p className="mt-2 text-sm font-medium text-white">{selectedAnalysis.currentPrice ?? '-'}</p></CardContent></Card>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {selectedAnalysis.isDualChart ? (
                      <>
                        <Card>
                          <CardContent className="p-4">
                            <p className="mb-3 text-sm font-medium text-white">Higher Timeframe Chart</p>
                            {htfChartUrl ? <img src={htfChartUrl} alt="Higher timeframe analysis chart" className="w-full rounded-xl border border-white/10 bg-black/20" /> : <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No chart available</div>}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="mb-3 text-sm font-medium text-white">Lower Timeframe Chart</p>
                            {ltfChartUrl ? <img src={ltfChartUrl} alt="Lower timeframe analysis chart" className="w-full rounded-xl border border-white/10 bg-black/20" /> : <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No chart available</div>}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card className="lg:col-span-2">
                        <CardContent className="p-4">
                          <p className="mb-3 text-sm font-medium text-white">Chart</p>
                          {primaryChartUrl ? <img src={primaryChartUrl} alt="Analysis chart" className="w-full rounded-xl border border-white/10 bg-black/20" /> : <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No chart available</div>}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm font-medium text-white">Trade Levels</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div><p className="text-xs uppercase tracking-wide text-slate-500">Stop Loss</p><p className="mt-1 text-sm text-white">{selectedAnalysis.stopLoss ?? '-'}</p></div>
                          <div><p className="text-xs uppercase tracking-wide text-slate-500">TP1</p><p className="mt-1 text-sm text-white">{selectedAnalysis.takeProfit1 ?? '-'}</p></div>
                          <div><p className="text-xs uppercase tracking-wide text-slate-500">TP2</p><p className="mt-1 text-sm text-white">{selectedAnalysis.takeProfit2 ?? '-'}</p></div>
                          <div><p className="text-xs uppercase tracking-wide text-slate-500">TP3</p><p className="mt-1 text-sm text-white">{selectedAnalysis.takeProfit3 ?? '-'}</p></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm font-medium text-white">Verdict</p>
                        <p className="text-sm text-slate-200">{selectedAnalysis.finalVerdict?.message || selectedAnalysis.message || '-'}</p>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Strategy</p>
                          <p className="mt-1 text-sm text-white">{selectedAnalysis.strategy || '-'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-medium text-white">Reasoning</p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{selectedAnalysis.reasoning || '-'}</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-slate-400">Unable to load analysis.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
