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

  const growthChart = useMemo(() => {
    const rows = analytics?.userGrowth ?? [];
    const visibleRows = rows.slice(-14);
    const values = visibleRows.map((row) => row._count ?? 0);
    const labels = visibleRows.map((row) => new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const max = Math.max(...values, 1);
    const width = 560;
    const height = 220;
    const padding = 24;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const pointValues = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
    const pointLabels = labels.length ? labels : ['No data'];
    const denominator = Math.max(pointValues.length - 1, 1);
    const points = pointValues.map((value, index) => {
      const x = padding + (index / denominator) * innerWidth;
      const y = padding + innerHeight - (value / max) * innerHeight;
      return { x, y, value, label: pointLabels[index] ?? '' };
    });

    return {
      width,
      height,
      points,
      path: points.map((point) => `${point.x},${point.y}`).join(' '),
      max,
      total: values.reduce((sum, value) => sum + value, 0),
    };
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-[#111827]">User Growth</h2>
              <p className="mt-1 text-xs font-semibold text-[#6B7280]">New signups over the selected analytics range</p>
            </div>
            <CleanBadge tone="blue">{formatNumber(growthChart.total)} signups</CleanBadge>
          </div>
          <div className="mt-5 rounded-2xl bg-[#F7F9FC] p-4">
            <svg viewBox={`0 0 ${growthChart.width} ${growthChart.height}`} className="h-64 w-full overflow-visible" role="img" aria-label="User growth line chart">
              <defs>
                <linearGradient id="userGrowthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((line) => {
                const y = 24 + line * 56;
                return <line key={line} x1="24" x2="536" y1={y} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
              })}
              <polyline
                points={`24,196 ${growthChart.path} 536,196`}
                fill="url(#userGrowthFill)"
                stroke="none"
              />
              <polyline
                points={growthChart.path}
                fill="none"
                stroke="#2563EB"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              {growthChart.points.map((point, index) => (
                <g key={`${point.x}-${index}`}>
                  <circle cx={point.x} cy={point.y} r="5" fill="#2563EB" />
                  <circle cx={point.x} cy={point.y} r="9" fill="#2563EB" opacity="0.12" />
                  {index === 0 || index === growthChart.points.length - 1 ? (
                    <text x={point.x} y="216" textAnchor={index === 0 ? 'start' : 'end'} className="fill-[#6B7280] text-[11px] font-semibold">{point.label}</text>
                  ) : null}
                </g>
              ))}
              <text x="24" y="18" className="fill-[#6B7280] text-[11px] font-semibold">Max {formatNumber(growthChart.max)}</text>
            </svg>
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
          <div className="max-h-80 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white text-xs text-[#6B7280]">
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
