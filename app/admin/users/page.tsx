'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminUserDetails, type AdminUserListItem } from '@/lib/api';
import { addDaysToDateInputValue, formatJamaicaDate, formatJamaicaDateTime, getEndOfJamaicaDayIso, getJamaicaDateInputValue, getStartOfJamaicaDayIso } from '@/lib/jamaica-time';
import { Users, Search, Crown, Ban, ShieldCheck, Zap, X, CalendarRange, KeyRound, CheckCircle2, ShieldX } from 'lucide-react';
import { ProSubscribersModal } from '@/components/ProSubscribersModal';

type SubscriptionFilter = 'ALL' | 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
type DateFilter = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

const buildDateRange = (filter: DateFilter, customFrom: string, customTo: string) => {
  const today = getJamaicaDateInputValue();

  if (filter === 'TODAY') {
    return { createdFrom: getStartOfJamaicaDayIso(today), createdTo: getEndOfJamaicaDayIso(today) };
  }

  if (filter === 'LAST_7_DAYS' || filter === 'LAST_30_DAYS') {
    const days = filter === 'LAST_7_DAYS' ? 7 : 30;
    return {
      createdFrom: getStartOfJamaicaDayIso(addDaysToDateInputValue(today, -(days - 1))),
      createdTo: getEndOfJamaicaDayIso(today),
    };
  }

  if (filter === 'CUSTOM' && customFrom && customTo) {
    return { createdFrom: getStartOfJamaicaDayIso(customFrom), createdTo: getEndOfJamaicaDayIso(customTo) };
  }

  return { createdFrom: undefined, createdTo: undefined };
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserDetails | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [resettingUsage, setResettingUsage] = useState(false);
  const [showProSubs, setShowProSubs] = useState(false);
  const [grantingGoldx, setGrantingGoldx] = useState(false);
  const [revokingGoldx, setRevokingGoldx] = useState(false);
  const [goldxGrantMessage, setGoldxGrantMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadUsers();
  }, [token, page, subscriptionFilter, dateFilter, customDateFrom, customDateTo]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    const updatedSelectedUser = users.find((user) => user.id === selectedUser.id);
    if (updatedSelectedUser) {
      setSelectedUser(updatedSelectedUser);
    }
  }, [users, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !token) {
      setSelectedUserDetails(null);
      setLoadingUserDetails(false);
      setGoldxGrantMessage(null);
      return;
    }

    let cancelled = false;
    setLoadingUserDetails(true);

    api.admin.getUserDetails(selectedUser.id, token)
      .then((data) => {
        if (!cancelled) {
          setSelectedUserDetails(data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedUserDetails(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUserDetails(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUser, token]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { createdFrom, createdTo } = buildDateRange(dateFilter, customDateFrom, customDateTo);
      const data = await api.admin.getUsers(token!, {
        search: search || undefined,
        page,
        subscription: subscriptionFilter === 'ALL' ? undefined : subscriptionFilter,
        createdFrom,
        createdTo,
      });
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    if (page === 1) {
      void loadUsers();
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSubscriptionFilter('ALL');
    setDateFilter('ALL');
    setCustomDateFrom('');
    setCustomDateTo('');
    setPage(1);
    if (page === 1) {
      void loadUsers();
    }
  };

  const updateUser = async (id: string, updates: any) => {
    try {
      await api.admin.updateUser(id, updates, token!);
      loadUsers();
      setSelectedUser((current) => {
        if (!current || current.id !== id) {
          return current;
        }

        return {
          ...current,
          ...updates,
        };
      });

      if (selectedUser?.id === id) {
        const data = await api.admin.getUserDetails(id, token!);
        setSelectedUserDetails(data.user);
      }
    } catch {
    }
  };

  const resetUsage = async (id: string) => {
    if (!token) {
      return;
    }

    try {
      setResettingUsage(true);
      await api.admin.resetUserUsage(id, token);
      await loadUsers();
      const details = await api.admin.getUserDetails(id, token);
      setSelectedUserDetails(details.user);
      setSelectedUser((current) => {
        if (!current || current.id !== id) {
          return current;
        }

        return {
          ...current,
          lastUsageReset: new Date().toISOString(),
          usage: current.usage
            ? {
                ...current.usage,
                current: 0,
              }
            : current.usage,
        };
      });
    } catch {
    } finally {
      setResettingUsage(false);
    }
  };

  const grantGoldxAccess = async (id: string) => {
    if (!token) {
      return;
    }

    try {
      setGrantingGoldx(true);
      const result = await api.admin.grantGoldxAccess(id, token);
      setGoldxGrantMessage(result.licenseKey
        ? `GoldX access granted. License key: ${result.licenseKey}`
        : result.message);

      const data = await api.admin.getUserDetails(id, token);
      setSelectedUserDetails(data.user);
    } catch {
      setGoldxGrantMessage('Failed to grant GoldX access.');
    } finally {
      setGrantingGoldx(false);
    }
  };

  const revokeGoldxAccess = async (licenseId: string, userId: string) => {
    if (!token) {
      return;
    }

    try {
      setRevokingGoldx(true);
      await api.goldx.admin.revokeLicense(licenseId, token);
      setGoldxGrantMessage('GoldX access revoked. Granting access again will generate a new license key.');

      const data = await api.admin.getUserDetails(userId, token);
      setSelectedUserDetails(data.user);
    } catch {
      setGoldxGrantMessage('Failed to revoke GoldX access.');
    } finally {
      setRevokingGoldx(false);
    }
  };

  const paymentMethodLabel = (payment: AdminUserDetails['billing']['recentPayments'][number]) => {
    if (payment.paymentMethod === 'BANK_TRANSFER' && payment.bankTransferBank) {
      return `Bank Transfer (${payment.bankTransferBank})`;
    }

    if (payment.paymentMethod === 'PAYPAL') return 'PayPal';
    if (payment.paymentMethod === 'CARD') return 'Card';
    if (payment.paymentMethod === 'COUPON') return 'Coupon';
    return 'Bank Transfer';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setShowProSubs(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 transition-all text-sm font-medium"
        >
          <Crown className="w-4 h-4" />
          Pro Subscribers
        </button>
      </div>

      <ProSubscribersModal open={showProSubs} onClose={() => setShowProSubs(false)} token={token!} />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex flex-col gap-2 lg:w-44">
              <label className="text-xs font-medium text-muted-foreground">Plan</label>
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value as SubscriptionFilter)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">All users</option>
                <option value="FREE">Free users</option>
                <option value="PRO">Pro users</option>
                <option value="TOP_TIER">PRO+ users</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 lg:w-48">
              <label className="text-xs font-medium text-muted-foreground">Joined</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">All time</option>
                <option value="TODAY">Today</option>
                <option value="LAST_7_DAYS">Last 7 days</option>
                <option value="LAST_30_DAYS">Last 30 days</option>
                <option value="CUSTOM">Custom range</option>
              </select>
            </div>
            {dateFilter === 'CUSTOM' ? (
              <>
                <div className="flex flex-col gap-2 lg:w-40">
                  <label className="text-xs font-medium text-muted-foreground">From</label>
                  <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 lg:w-40">
                  <label className="text-xs font-medium text-muted-foreground">To</label>
                  <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} />
                </div>
              </>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading users...</div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Usage</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Analyses</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="cursor-pointer border-b border-white/5 hover:bg-white/5" onClick={() => setSelectedUser(u)}>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{u.name || 'No name'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={u.subscription !== 'FREE' ? 'default' : 'secondary'}>
                          {u.subscription !== 'FREE' ? <Crown className="h-3 w-3 mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                          {u.subscription}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {u.banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-foreground">
                          {u.usage?.current ?? 0}/{u.usage?.limit ?? (u.subscription !== 'FREE' ? 300 : 2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {u.subscription !== 'FREE' ? 'Current month' : 'Today'}
                        </p>
                      </td>
                      <td className="p-4 text-muted-foreground">{u._count?.analyses || 0}</td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {formatJamaicaDate(u.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          {u.subscription === 'FREE' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateUser(u.id, { subscription: 'PRO' });
                              }}
                              title="Upgrade to Pro"
                            >
                              <Crown className="h-3 w-3" />
                            </Button>
                          ) : u.subscription === 'PRO' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateUser(u.id, { subscription: 'TOP_TIER' });
                              }}
                              title="Upgrade to PRO+"
                            >
                              <Crown className="h-3 w-3 text-amber-400" />
                            </Button>
                          ) : u.subscription === 'TOP_TIER' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateUser(u.id, { subscription: 'PRO' });
                                }}
                                title="Downgrade to Pro"
                              >
                                <Zap className="h-3 w-3" />
                              </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateUser(u.id, { subscription: 'TOP_TIER' });
                              }}
                              title="Downgrade to PRO+"
                            >
                              <Zap className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              updateUser(u.id, { banned: !u.banned });
                            }}
                            title={u.banned ? 'Unban' : 'Ban'}
                          >
                            {u.banned ? <ShieldCheck className="h-3 w-3 text-green-400" /> : <Ban className="h-3 w-3 text-red-400" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedUser(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">User Details</p>
                <h2 className="mt-1 text-xl font-semibold">{selectedUser.name || selectedUser.email}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="mt-1 text-sm font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="mt-1 break-all text-sm font-medium">{selectedUser.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="mt-1 text-sm font-medium uppercase">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="mt-1 text-sm font-medium">{selectedUser.subscription}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm font-medium">{selectedUser.banned ? 'Banned' : 'Active'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="mt-1 text-sm font-medium">{formatJamaicaDateTime(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarRange className="h-4 w-4 text-cyan-400" />
                    Usage Snapshot
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    {selectedUser.usage?.current ?? 0}
                    <span className="ml-1 text-sm text-muted-foreground">/ {selectedUser.usage?.limit ?? 0}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Reset basis: {selectedUser.usage?.period === 'month' ? 'monthly' : 'daily'}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetUsage(selectedUser.id)}
                    disabled={resettingUsage}
                    className="mt-3"
                  >
                    {resettingUsage ? 'Resetting...' : 'Reset Usage'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-muted-foreground">Analyses</p>
                    <p className="mt-2 text-xl font-semibold">{selectedUser._count?.analyses ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-muted-foreground">Payments</p>
                    <p className="mt-2 text-xl font-semibold">{selectedUser._count?.payments ?? 0}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Usage Reset</p>
                  <p className="mt-1 text-sm font-medium">
                    {selectedUser.lastUsageReset ? formatJamaicaDateTime(selectedUser.lastUsageReset) : 'Not available'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Subscription expiry</p>
                      <p className="mt-1 text-sm font-medium">
                        {loadingUserDetails
                          ? 'Loading...'
                          : selectedUserDetails?.billing.expiresAt
                            ? formatJamaicaDateTime(selectedUserDetails.billing.expiresAt)
                            : selectedUser.subscription === 'FREE'
                              ? 'Free plan'
                              : 'Not available'}
                      </p>
                    </div>
                    {selectedUserDetails ? (
                      <Badge variant={selectedUserDetails.billing.status === 'active' ? 'success' : 'outline'}>
                        {selectedUserDetails.billing.status.toUpperCase()}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">GoldX access</p>
                      <p className="mt-1 text-sm font-medium">
                        {loadingUserDetails
                          ? 'Loading...'
                          : selectedUserDetails?.goldx.hasAccess
                            ? selectedUserDetails.goldx.subscriptionStatus === 'cancelled' && selectedUserDetails.goldx.currentPeriodEnd
                              ? `Active until ${formatJamaicaDateTime(selectedUserDetails.goldx.currentPeriodEnd)}`
                              : 'Active'
                            : 'Not granted'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {loadingUserDetails
                          ? 'Checking GoldX entitlement...'
                          : selectedUserDetails?.goldx.expiresAt
                            ? `License expires ${formatJamaicaDateTime(selectedUserDetails.goldx.expiresAt)}`
                            : 'Grant GoldX without changing the user\'s core TradeVision plan.'}
                      </p>
                      {selectedUserDetails?.goldx.mt5Account ? (
                        <p className="mt-1 text-xs text-muted-foreground">MT5 account: {selectedUserDetails.goldx.mt5Account}</p>
                      ) : null}
                    </div>
                    {selectedUserDetails ? (
                      <Badge variant={selectedUserDetails.goldx.hasAccess ? 'success' : 'outline'}>
                        {selectedUserDetails.goldx.hasAccess ? 'ACTIVE' : 'NOT GRANTED'}
                      </Badge>
                    ) : null}
                  </div>
                  {!selectedUserDetails?.goldx.hasAccess ? (
                    <Button className="mt-4" onClick={() => grantGoldxAccess(selectedUser.id)} disabled={grantingGoldx || loadingUserDetails}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      {grantingGoldx ? 'Granting GoldX...' : 'Grant GoldX Access'}
                    </Button>
                  ) : selectedUserDetails?.goldx.licenseId ? (
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => revokeGoldxAccess(selectedUserDetails.goldx.licenseId!, selectedUser.id)}
                      disabled={revokingGoldx || loadingUserDetails}
                    >
                      <ShieldX className="mr-2 h-4 w-4" />
                      {revokingGoldx ? 'Revoking GoldX...' : 'Revoke GoldX Access'}
                    </Button>
                  ) : null}
                  {goldxGrantMessage ? (
                    <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="break-all">{goldxGrantMessage}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedUser.subscription === 'FREE' ? (
                    <Button onClick={() => updateUser(selectedUser.id, { subscription: 'PRO' })}>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  ) : selectedUser.subscription === 'PRO' ? (
                    <Button onClick={() => updateUser(selectedUser.id, { subscription: 'TOP_TIER' })}>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to PRO+
                    </Button>
                  ) : selectedUser.subscription === 'TOP_TIER' ? (
                    <Button variant="outline" onClick={() => updateUser(selectedUser.id, { subscription: 'PRO' })}>
                      <Zap className="mr-2 h-4 w-4" />
                      Downgrade to Pro
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => updateUser(selectedUser.id, { subscription: 'TOP_TIER' })}>
                      <Zap className="mr-2 h-4 w-4" />
                      Downgrade to PRO+
                    </Button>
                  )}
                  <Button variant={selectedUser.banned ? 'outline' : 'destructive'} onClick={() => updateUser(selectedUser.id, { banned: !selectedUser.banned })}>
                    {selectedUser.banned ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                    {selectedUser.banned ? 'Unban user' : 'Ban user'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Recent payments</p>
                        <p className="text-xs text-muted-foreground">Payment method, amount, and latest activity</p>
                      </div>
                      <Badge variant="outline">{selectedUser._count?.payments ?? 0} total</Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      {loadingUserDetails ? (
                        <p className="text-sm text-muted-foreground">Loading payments...</p>
                      ) : selectedUserDetails?.billing.recentPayments.length ? (
                        selectedUserDetails.billing.recentPayments.map((payment) => (
                          <div key={payment.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{paymentMethodLabel(payment)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {payment.plan} plan • {payment.currency} {payment.amount.toFixed(2)}
                                </p>
                              </div>
                              <Badge variant={payment.status === 'COMPLETED' ? 'success' : payment.status === 'FAILED' ? 'destructive' : 'outline'}>
                                {payment.status}
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {formatJamaicaDateTime(payment.verifiedAt || payment.createdAt)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent payments found.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Open tickets</p>
                        <p className="text-xs text-muted-foreground">Support requests still awaiting resolution</p>
                      </div>
                      <Badge variant={selectedUserDetails?.openTicketCount ? 'destructive' : 'outline'}>
                        {loadingUserDetails ? '...' : selectedUserDetails?.openTicketCount ?? 0}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      {loadingUserDetails ? (
                        <p className="text-sm text-muted-foreground">Loading tickets...</p>
                      ) : selectedUserDetails?.openTickets.length ? (
                        selectedUserDetails.openTickets.map((ticket) => (
                          <div key={ticket.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{ticket.ticketNumber}</p>
                                <p className="mt-1 text-sm text-white/85">{ticket.subject}</p>
                              </div>
                              <Badge variant="outline">{ticket.status}</Badge>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {ticket.category} • {ticket.priority} • {formatJamaicaDateTime(ticket.createdAt)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No open tickets.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
