'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminPayment, type AdminPaymentDateRangeFilter, type AdminPaymentPlanFilter, type AdminPaymentScope, type AdminPaymentStatusFilter } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import { Building2, CheckCircle2, CreditCard, Landmark, Loader2, Mail, Send, Sparkles, Tag, Wallet, X, XCircle } from 'lucide-react';

const paymentStatuses: Array<Exclude<AdminPaymentStatusFilter, 'ALL'>> = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
const paymentPlans: Array<Exclude<AdminPaymentPlanFilter, 'ALL'>> = ['FREE', 'PRO', 'TOP_TIER', 'VIP_AUTO_TRADER'];
type PaymentsView = 'all-payments' | 'bank-transfers';

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
  const [activeView, setActiveView] = useState<PaymentsView>('all-payments');
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  // Reminder email modal state
  const [reminderTarget, setReminderTarget] = useState<AdminPayment | null>(null);
  const [reminderCoupon, setReminderCoupon] = useState('');
  const [reminderDiscountLabel, setReminderDiscountLabel] = useState('');
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (token) loadPayments();
  }, [token, page, status, plan, dateRange, activeView]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const scope: AdminPaymentScope = activeView === 'bank-transfers' ? 'BANK_TRANSFERS' : 'ALL_PAYMENTS';
      const data = await api.admin.getPayments(token!, {
        page,
        status: status,
        plan,
        scope,
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

  const openReminderModal = (payment: AdminPayment) => {
    setReminderTarget(payment);
    setReminderCoupon('');
    setReminderDiscountLabel('');
    setReminderResult(null);
  };

  const closeReminderModal = () => {
    setReminderTarget(null);
    setReminderCoupon('');
    setReminderDiscountLabel('');
    setReminderResult(null);
    setReminderSending(false);
  };

  const handleSendReminder = async () => {
    if (!token || !reminderTarget) return;
    setReminderSending(true);
    setReminderResult(null);
    try {
      const result = await api.admin.sendPaymentReminder(reminderTarget.id, token, {
        couponCode: reminderCoupon.trim() || undefined,
        discountLabel: reminderDiscountLabel.trim() || undefined,
      });
      setReminderResult({ ok: true, message: result.message });
    } catch (err: any) {
      setReminderResult({ ok: false, message: err?.message || 'Failed to send reminder email' });
    } finally {
      setReminderSending(false);
    }
  };

  const pendingPayments = payments.filter((payment) => payment.status === 'PENDING').length;
  const visibleRevenue = payments.filter((payment) => payment.status === 'COMPLETED').reduce((sum, payment) => sum + payment.amount, 0);
  const recordCountLabel = activeView === 'bank-transfers' ? 'Transfer records' : 'Total payments';
  const secondaryStatLabel = activeView === 'bank-transfers' ? 'Pending transfers' : 'Pending payments';
  const pendingCount = activeView === 'bank-transfers'
    ? payments.filter((p) => p.paymentMethod === 'BANK_TRANSFER' && p.status === 'PENDING').length
    : pendingPayments;
  const secondaryStatValue = activeView === 'bank-transfers' ? String(pendingCount) : String(pendingCount);
  const secondaryStatClasses = 'rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3';
  const secondaryStatLabelClasses = 'text-xs uppercase tracking-[0.2em] text-amber-200/80';
  const secondaryStatValueClasses = 'mt-1 text-2xl font-semibold text-amber-100';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review automated checkouts, track bank transfers, and approve manual upgrades from one workspace.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{recordCountLabel}</div>
            <div className="mt-1 text-2xl font-semibold">{payments.length}</div>
          </div>
          <div className={secondaryStatClasses}>
            <div className={secondaryStatLabelClasses}>{secondaryStatLabel}</div>
            <div className={secondaryStatValueClasses}>{secondaryStatValue}</div>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Revenue</div>
            <div className="mt-1 text-2xl font-semibold text-cyan-100">${visibleRevenue.toFixed(2)}</div>
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
                  onClick={() => { setPage(1); setStatus('ALL'); setActiveView('all-payments'); }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${activeView === 'all-payments' ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}
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

              {activeView === 'all-payments' ? (
                <div className="max-h-[70vh] overflow-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[1020px] text-sm">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur-xl">
                      <tr className="border-b border-white/10">
                        <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Reference</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Method</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Plan</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Date</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No payments match the current filters.</td>
                        </tr>
                      ) : payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <div className="font-medium">{payment.user?.name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">{payment.user?.email || 'No email available'}</div>
                          </td>
                          <td className="p-4 font-mono text-xs text-muted-foreground">{payment.paypalOrderId}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Badge variant={paymentMethodVariant(payment.paymentMethod) as any}>{paymentMethodLabel[payment.paymentMethod]}</Badge>
                            </div>
                          </td>
                          <td className="p-4 font-medium">${payment.amount.toFixed(2)}</td>
                          <td className="p-4"><Badge>{payment.plan}</Badge></td>
                          <td className="p-4"><Badge variant={statusVariant(payment.status) as any}>{payment.status}</Badge></td>
                          <td className="p-4 text-xs text-muted-foreground">{formatJamaicaDateTime(payment.createdAt)}</td>
                          <td className="p-4">
                            {payment.status === 'PENDING' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                                onClick={() => openReminderModal(payment)}
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Remind
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
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
                                {payment.status === 'PENDING' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                                    onClick={() => openReminderModal(payment)}
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                    Remind
                                  </Button>
                                )}
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

      {/* Payment Reminder Email Modal */}
      <AnimatePresence>
        {reminderTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeReminderModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111118] shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15">
                    <Send className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Send Checkout Reminder</h3>
                    <p className="text-xs text-muted-foreground">Nudge this user to complete checkout</p>
                  </div>
                </div>
                <button type="button" onClick={closeReminderModal} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 px-6 py-5">
                {/* Recipient info */}
                <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                      {(reminderTarget.user?.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{reminderTarget.user?.name || 'Unknown User'}</div>
                      <div className="text-xs text-muted-foreground truncate">{reminderTarget.user?.email || 'No email'}</div>
                    </div>
                    <div className="text-right">
                      <Badge>{reminderTarget.plan}</Badge>
                      <div className="mt-1 text-xs text-muted-foreground">${reminderTarget.amount.toFixed(2)}</div>
                    </div>
                  </div>
                  {reminderTarget.paymentMethod === 'BANK_TRANSFER' && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                      <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-200">
                        Pending bank transfer{reminderTarget.bankTransferBank ? ` · ${bankLabel[reminderTarget.bankTransferBank]}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coupon section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-white">Add Discount Coupon</span>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code e.g. SAVE20"
                      value={reminderCoupon}
                      onChange={(e) => setReminderCoupon(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 font-mono tracking-wider"
                    />
                    <input
                      type="text"
                      placeholder="Discount label e.g. 20% OFF — Save $3.99"
                      value={reminderDiscountLabel}
                      onChange={(e) => setReminderDiscountLabel(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                    />
                  </div>

                  {reminderCoupon.trim() && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-emerald-200">
                        Email will include coupon <span className="font-mono font-bold">{reminderCoupon.trim()}</span> with a direct checkout link
                      </span>
                    </div>
                  )}
                </div>

                {/* Result feedback */}
                {reminderResult && (
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                    reminderResult.ok
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                      : 'border-red-500/20 bg-red-500/10 text-red-200'
                  }`}>
                    {reminderResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                    {reminderResult.message}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
                <Button variant="outline" size="sm" onClick={closeReminderModal}>
                  {reminderResult?.ok ? 'Done' : 'Cancel'}
                </Button>
                {!reminderResult?.ok && (
                  <Button
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                    onClick={handleSendReminder}
                    disabled={reminderSending || !reminderTarget.user?.email}
                  >
                    {reminderSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {reminderSending ? 'Sending...' : 'Send Reminder'}
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
