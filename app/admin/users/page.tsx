'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminUserListItem } from '@/lib/api';
import { Users, Search, Crown, Ban, ShieldCheck, Zap, X, CalendarRange } from 'lucide-react';

type SubscriptionFilter = 'ALL' | 'FREE' | 'PRO';
type DateFilter = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

const toStartOfDayIso = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString();
const toEndOfDayIso = (value: string) => new Date(`${value}T23:59:59.999Z`).toISOString();

const buildDateRange = (filter: DateFilter, customFrom: string, customTo: string) => {
  const now = new Date();

  if (filter === 'TODAY') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { createdFrom: start.toISOString(), createdTo: end.toISOString() };
  }

  if (filter === 'LAST_7_DAYS' || filter === 'LAST_30_DAYS') {
    const days = filter === 'LAST_7_DAYS' ? 7 : 30;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { createdFrom: start.toISOString(), createdTo: end.toISOString() };
  }

  if (filter === 'CUSTOM' && customFrom && customTo) {
    return { createdFrom: toStartOfDayIso(customFrom), createdTo: toEndOfDayIso(customTo) };
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
    } catch {
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

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
                        <Badge variant={u.subscription === 'PRO' ? 'default' : 'secondary'}>
                          {u.subscription === 'PRO' ? <Crown className="h-3 w-3 mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
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
                          {u.usage?.current ?? 0}/{u.usage?.limit ?? (u.subscription === 'PRO' ? 300 : 2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {u.subscription === 'PRO' ? 'Current month' : 'Today'}
                        </p>
                      </td>
                      <td className="p-4 text-muted-foreground">{u._count?.analyses || 0}</td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
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
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateUser(u.id, { subscription: 'FREE' });
                              }}
                              title="Downgrade to Free"
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
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
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
                    <p className="mt-1 text-sm font-medium">{new Date(selectedUser.createdAt).toLocaleString()}</p>
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
                    {selectedUser.lastUsageReset ? new Date(selectedUser.lastUsageReset).toLocaleString() : 'Not available'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedUser.subscription === 'FREE' ? (
                    <Button onClick={() => updateUser(selectedUser.id, { subscription: 'PRO' })}>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => updateUser(selectedUser.id, { subscription: 'FREE' })}>
                      <Zap className="mr-2 h-4 w-4" />
                      Downgrade to Free
                    </Button>
                  )}
                  <Button variant={selectedUser.banned ? 'outline' : 'destructive'} onClick={() => updateUser(selectedUser.id, { banned: !selectedUser.banned })}>
                    {selectedUser.banned ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                    {selectedUser.banned ? 'Unban user' : 'Ban user'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
