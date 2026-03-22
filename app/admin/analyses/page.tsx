'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminAnalysisLog } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (token) loadAnalyses();
  }, [token, page]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAnalyses(token!, page);
      setAnalyses(data.analyses);
      setTotalPages(data.pages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">Analysis Logs</h1>

      <Card>
        <CardContent className="p-0">
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
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => {
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
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
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
  );
}
