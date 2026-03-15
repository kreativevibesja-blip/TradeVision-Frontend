'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AdminAnalysesPage() {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Pair</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">TF</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Bias</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Score</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Strategy</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <p className="text-xs text-muted-foreground">{a.user?.email || 'Unknown'}</p>
                      </td>
                      <td className="p-4 font-medium">{a.pair}</td>
                      <td className="p-4 text-muted-foreground">{a.timeframe}</td>
                      <td className="p-4">
                        <Badge variant={a.bias === 'BULLISH' ? 'success' : a.bias === 'BEARISH' ? 'destructive' : 'warning'}>
                          {a.bias === 'BULLISH' ? <TrendingUp className="h-3 w-3 mr-1" /> : a.bias === 'BEARISH' ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                          {a.bias || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{a.confidence || '-'}/100</td>
                      <td className="p-4 text-xs text-muted-foreground">{a.strategy || '-'}</td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
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
