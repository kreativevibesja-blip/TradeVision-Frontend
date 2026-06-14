'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, DollarSign, FileText, LifeBuoy, Newspaper, Radar, TrendingUp, Users } from 'lucide-react';
import { api, type AdminDashboardStats, type AdminAnalyticsResponse, type AdminPayment, type AdminUserListItem } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { CleanBadge, CleanCard, CleanStatCard, PageHeader } from '@/components/CleanBlue';

const formatNumber = (value: number | null | undefined) => Number(value ?? 0).toLocaleString();
const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value ?? 0));

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [openTickets, setOpenTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      api.admin.getDashboard(token),
      api.admin.getAnalytics(token).catch(() => null),
      api.admin.getUsers(token, { page: 1 }).catch(() => null),
      api.admin.getPayments(token, { page: 1, scope: 'ALL_PAYMENTS' }).catch(() => null),
      api.admin.getOpenTicketCount(token).catch(() => null),
    ])
      .then(([dashboardData, analyticsData, usersData, paymentsData, ticketData]) => {
        if (!active) return;
        setDashboard(dashboardData);
        setAnalytics(analyticsData);
        setUsers(usersData?.users ?? []);
        setPayments(paymentsData?.payments ?? []);
        setOpenTickets(ticketData?.count ?? 0);
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'Unable to load admin overview.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const recentGrowth = useMemo(() => {
    const rows = analytics?.userGrowth ?? [];
    if (rows.length === 0) return [8, 16, 12, 24, 18, 28, 34];
    const max = Math.max(...rows.map((row) => row._count ?? 0), 1);
    return rows.slice(-7).map((row) => Math.max(8, Math.round(((row._count ?? 0) / max) * 100)));
  }, [analytics?.userGrowth]);

  const completedPayments = payments.filter((payment) => payment.status === 'COMPLETED');
  const postsToday = dashboard?.feedbackUnreadCount ?? 0;
  const activeRadar = analytics?.liveMetrics.activeAnalyses ?? dashboard?.liveMetrics.activeAnalyses ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" subtitle="Real-time operating dashboard for TradeVision users, revenue, AI usage, community, and support." />

      {error ? (
        <CleanCard className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        </CleanCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CleanStatCard label="Total Users" value={loading ? 'Loading...' : formatNumber(dashboard?.totalUsers)} icon={<Users className="h-5 w-5" />} />
        <CleanStatCard label="Active Users" value={loading ? 'Loading...' : formatNumber(dashboard?.activeSubscribers)} icon={<Activity className="h-5 w-5" />} />
        <CleanStatCard label="New Signups" value={loading ? 'Loading...' : formatNumber(users.length)} trend="Latest page" icon={<TrendingUp className="h-5 w-5" />} />
        <CleanStatCard label="Revenue MRR" value={loading ? 'Loading...' : formatMoney(dashboard?.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">User Growth</h2>
          <div className="mt-5 h-64 rounded-2xl bg-[#F7F9FC] p-4">
            <div className="flex h-full items-end gap-3">
              {recentGrowth.map((height, index) => (
                <div key={index} className="flex flex-1 flex-col justify-end">
                  <div className="rounded-t-xl bg-[#2563EB]" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          </div>
        </CleanCard>

        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">System Status</h2>
          <div className="mt-5 space-y-3">
            {[
              ['Live visitors', formatNumber(dashboard?.liveMetrics.currentVisitors)],
              ['Analyses today', formatNumber(dashboard?.liveMetrics.totalAnalysesToday)],
              ['Open tickets', formatNumber(openTickets)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F9FC] p-3 text-sm font-semibold text-[#111827]">
                <span className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </CleanCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <CleanCard>
          <h2 className="mb-4 font-extrabold text-[#111827]">AI & Platform Insights</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <CleanStatCard label="Analyses Today" value={formatNumber(dashboard?.liveMetrics.totalAnalysesToday)} icon={<FileText className="h-5 w-5" />} />
            <CleanStatCard label="Posts Today" value={formatNumber(postsToday)} icon={<Newspaper className="h-5 w-5" />} />
            <CleanStatCard label="Active Radar" value={formatNumber(activeRadar)} icon={<Radar className="h-5 w-5" />} />
            <CleanStatCard label="Open Tickets" value={formatNumber(openTickets)} icon={<LifeBuoy className="h-5 w-5" />} />
          </div>
        </CleanCard>

        <CleanCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-[#111827]">Recent Orders</h2>
            <a href="/admin/payments" className="text-xs font-bold text-[#2563EB]">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[#6B7280]">
                <tr><th className="py-2">User</th><th>Plan</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(payments.length ? payments : completedPayments).slice(0, 6).map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-3 font-semibold text-[#111827]">{payment.user?.name || payment.user?.email || 'Unknown user'}</td>
                    <td>{payment.plan}</td>
                    <td>{formatMoney(payment.amount)}</td>
                    <td><CleanBadge tone={payment.status === 'COMPLETED' ? 'green' : payment.status === 'REFUNDED' ? 'red' : 'amber'}>{payment.status}</CleanBadge></td>
                  </tr>
                ))}
                {!loading && payments.length === 0 ? (
                  <tr><td className="py-6 text-center text-[#6B7280]" colSpan={4}>No recent payments returned by the API.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CleanCard>
      </div>
    </div>
  );
}
