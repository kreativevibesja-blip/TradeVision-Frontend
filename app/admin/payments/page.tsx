'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminPayment, type AdminPaymentDateRangeFilter, type AdminPaymentPlanFilter, type AdminPaymentStatusFilter } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import { Building2, CheckCircle2, CreditCard, Landmark, Loader2, Wallet, XCircle } from 'lucide-react';

const paymentStatuses: Array<Exclude<AdminPaymentStatusFilter, 'ALL'>> = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
const paymentPlans: Array<Exclude<AdminPaymentPlanFilter, 'ALL'>> = ['FREE', 'PRO', 'TOP_TIER'];
type PaymentsView = 'all' | 'bank-transfers';

const paymentMethodLabel: Record<AdminPayment['paymentMethod'], string> = {
  PAYPAL: 'PayPal',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  COUPON: 'Coupon',
};

const bankLabel: Record<'SCOTIABANK' | 'NCB', string> = {
  SCOTIABANK: 'ScotiaBank',
  NCB: 'N.C.B',
};

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<AdminPaymentStatusFilter>('ALL');
  const [plan, setPlan] = useState<AdminPaymentPlanFilter>('ALL');
  const [dateRange, setDateRange] = useState<AdminPaymentDateRangeFilter>('30d');
  const [activeView, setActiveView] = useState<PaymentsView>('all');
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadPayments();
  }, [token, page, status, plan, dateRange, activeView]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getPayments(token!, {
        page,
        status,
        plan,
        paymentMethod: activeView === 'bank-transfers' ? 'BANK_TRANSFER' : 'ALL',
        dateRange,
      });
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

  const paymentMethodVariant = (method: AdminPayment['paymentMethod']) => {
    if (method === 'BANK_TRANSFER') return 'warning';
    if (method === 'PAYPAL' || method === 'CARD') return 'success';
    return 'secondary';
  };

  const handlePaymentStatusUpdate = async (paymentId: string, nextStatus: 'COMPLETED' | 'FAILED') => {
    if (!token) {
      return;
    }

    try {
      setUpdatingPaymentId(paymentId);
      await api.admin.updatePaymentStatus(paymentId, nextStatus, token);
      await loadPayments();
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const pendingTransfers = payments.filter((payment) => payment.paymentMethod === 'BANK_TRANSFER' && payment.status === 'PENDING').length;
  const visibleRevenue = payments.filter((payment) => payment.status === 'COMPLETED').reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review automated checkouts, track bank transfers, and approve manual upgrades from one workspace.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visible records</div>
            <div className="mt-1 text-2xl font-semibold">{payments.length}</div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Pending transfers</div>
            <div className="mt-1 text-2xl font-semibold text-amber-100">{pendingTransfers}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Completed value</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-100">${visibleRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setPage(1); setActiveView('all'); }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${activeView === 'all' ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                >
                  <Wallet className="h-4 w-4" />
                  All Payments
                </button>
                <button
                  type="button"
                  onClick={() => { setPage(1); setActiveView('bank-transfers'); }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${activeView === 'bank-transfers' ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                >
                  <Landmark className="h-4 w-4" />
                  Bank Transfers
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={plan}
                  onChange={(event) => { setPage(1); setPlan(event.target.value as AdminPaymentPlanFilter); }}
                  className="h-8 rounded-lg border border-input bg-background/50 px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">All plans</option>
                  {paymentPlans.map((paymentPlan) => (
                    <option key={paymentPlan} value={paymentPlan}>{paymentPlan}</option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(event) => { setPage(1); setStatus(event.target.value as AdminPaymentStatusFilter); }}
                  className="h-8 rounded-lg border border-input bg-background/50 px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">All statuses</option>
                  {paymentStatuses.map((paymentStatus) => (
                    <option key={paymentStatus} value={paymentStatus}>{paymentStatus}</option>
                  ))}
                </select>

                <select
                  value={dateRange}
                  onChange={(event) => { setPage(1); setDateRange(event.target.value as AdminPaymentDateRangeFilter); }}
                  className="h-8 rounded-lg border border-input bg-background/50 px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>

              {activeView === 'all' ? (
                <div className="max-h-[70vh] overflow-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur-xl">
                      <tr className="border-b border-white/10">
                        <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Reference</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Method</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Plan</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <div className="font-medium">{payment.user?.name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">{payment.user?.email || 'No email available'}</div>
                          </td>
                          <td className="p-4 font-mono text-xs text-muted-foreground">{payment.paypalOrderId}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Badge variant={paymentMethodVariant(payment.paymentMethod) as any}>{paymentMethodLabel[payment.paymentMethod]}</Badge>
                              {payment.bankTransferBank ? <Badge variant="outline">{bankLabel[payment.bankTransferBank]}</Badge> : null}
                            </div>
                          </td>
                          <td className="p-4 font-medium">${payment.amount.toFixed(2)}</td>
                          <td className="p-4"><Badge>{payment.plan}</Badge></td>
                          <td className="p-4"><Badge variant={statusVariant(payment.status) as any}>{payment.status}</Badge></td>
                          <td className="p-4 text-xs text-muted-foreground">{formatJamaicaDateTime(payment.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur-xl">
                      <tr className="border-b border-white/10">
                        <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Bank</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Reference</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Submitted</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No bank transfer requests match the current filters.</td>
                        </tr>
                      ) : payments.map((payment) => {
                        const busy = updatingPaymentId === payment.id;

                        return (
                          <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">
                              <div className="font-medium">{payment.user?.name || 'Unknown User'}</div>
                              <div className="text-xs text-muted-foreground">{payment.user?.email || 'No email available'}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="rounded-full border border-white/10 bg-white/5 p-2 text-primary">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium">{payment.bankTransferBank ? bankLabel[payment.bankTransferBank] : 'Bank not set'}</div>
                                  <div className="text-xs text-muted-foreground">Manual verification</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-xs text-muted-foreground">{payment.paypalOrderId}</td>
                            <td className="p-4 font-medium">${payment.amount.toFixed(2)}</td>
                            <td className="p-4 text-xs text-muted-foreground">{formatJamaicaDateTime(payment.createdAt)}</td>
                            <td className="p-4">
                              <div className="flex flex-col gap-2">
                                <Badge variant={statusVariant(payment.status) as any}>
                                  {payment.status === 'FAILED' ? 'DIDN\'T RECEIVE' : payment.status}
                                </Badge>
                                {payment.verifiedAt ? <span className="text-xs text-muted-foreground">Verified {formatJamaicaDateTime(payment.verifiedAt)}</span> : null}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => handlePaymentStatusUpdate(payment.id, 'COMPLETED')}
                                  disabled={busy || payment.status === 'COMPLETED'}
                                >
                                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  Mark Paid
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handlePaymentStatusUpdate(payment.id, 'FAILED')}
                                  disabled={busy || payment.status === 'FAILED'}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Didn&apos;t Receive
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

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
