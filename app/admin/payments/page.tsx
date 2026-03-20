'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (token) loadPayments();
  }, [token, page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getPayments(token!, page);
      setPayments(data.payments);
      setTotalPages(data.pages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (s: string) => {
    if (s === 'COMPLETED') return 'success';
    if (s === 'PENDING') return 'warning';
    if (s === 'FAILED') return 'destructive';
    return 'secondary';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur-xl">
                    <tr className="border-b border-white/10">
                      <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">PayPal Order</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">Plan</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 text-xs text-muted-foreground">{p.user?.email || 'Unknown'}</td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">{p.paypalOrderId}</td>
                        <td className="p-4 font-medium">${p.amount.toFixed(2)}</td>
                        <td className="p-4"><Badge>{p.plan}</Badge></td>
                        <td className="p-4"><Badge variant={statusVariant(p.status) as any}>{p.status}</Badge></td>
                        <td className="p-4 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
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
