'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminDashboardStats } from '@/lib/api';
import { usePageActivity } from '@/hooks/usePageActivity';
import { trackPollingMetric } from '@/lib/egressMetrics';
import { Users, Crown, FileText, DollarSign, TrendingUp, Activity, RadioTower, PlayCircle } from 'lucide-react';

const REFRESH_INTERVAL_MS = 30_000;

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { isActive } = usePageActivity();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !isActive) {
      return;
    }

    const stopMetric = trackPollingMetric('admin-dashboard');

    void loadStats();
    const intervalId = window.setInterval(() => {
      void loadStats(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      stopMetric();
      window.clearInterval(intervalId);
    };
  }, [isActive, token]);

  const loadStats = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const data = await api.admin.getDashboard(token!);
      setStats(data);
    } catch {
      // silently fail
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Active Subscribers',
      value: stats?.activeSubscribers || 0,
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Total Analyses',
      value: stats?.totalAnalyses || 0,
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'Live Visitors',
      value: stats?.liveMetrics.currentVisitors || 0,
      icon: RadioTower,
      color: 'from-cyan-500 to-sky-500',
    },
    {
      label: 'Running Analyses',
      value: stats?.liveMetrics.activeAnalyses || 0,
      icon: PlayCircle,
      color: 'from-rose-500 to-orange-500',
    },
  ];

  const totalUsers = stats?.totalUsers ?? 0;
  const activeSubscribers = stats?.activeSubscribers ?? 0;
  const totalAnalyses = stats?.totalAnalyses ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <div className="mb-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="premium-panel-muted overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="premium-kicker mb-4">Platform Pulse</div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-[-0.05em] sm:text-4xl">Dashboard Overview</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              See revenue, demand, live trading activity, and support pressure from one premium control surface.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[rgba(255,223,112,0.14)] bg-white/[0.03] p-4">
                <div className="metric-label">Users</div>
                <div className="metric-value mt-2">{totalUsers}</div>
              </div>
              <div className="rounded-[22px] border border-[rgba(255,223,112,0.14)] bg-white/[0.03] p-4">
                <div className="metric-label">Subscribers</div>
                <div className="metric-value mt-2">{activeSubscribers}</div>
              </div>
              <div className="rounded-[22px] border border-[rgba(255,223,112,0.14)] bg-white/[0.03] p-4">
                <div className="metric-label">Revenue</div>
                <div className="metric-value mt-2">${totalRevenue.toFixed(0)}</div>
              </div>
            </div>
            <div className="mt-6 luxury-divider" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="mobile-card rounded-[22px] p-4">
                <div className="metric-label">Conversion</div>
                <div className="mt-2 font-mono text-2xl text-white">{totalUsers > 0 ? `${((activeSubscribers / totalUsers) * 100).toFixed(1)}%` : '0%'}</div>
              </div>
              <div className="mobile-card rounded-[22px] p-4">
                <div className="metric-label">Rev / Sub</div>
                <div className="mt-2 font-mono text-2xl text-white">${activeSubscribers > 0 ? (totalRevenue / activeSubscribers).toFixed(2) : '0.00'}</div>
              </div>
              <div className="mobile-card rounded-[22px] p-4">
                <div className="metric-label">Analyses / User</div>
                <div className="mt-2 font-mono text-2xl text-white">{totalUsers > 0 ? (totalAnalyses / totalUsers).toFixed(1) : '0'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="premium-kicker mb-4">Status Grid</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="inline-flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />Online</span>
              </div>
              <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-muted-foreground">AI Runtime</span>
                <span className="inline-flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />Active</span>
              </div>
              <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-muted-foreground">Payments</span>
                <span className="inline-flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br p-3 ${stat.color}`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="metric-value">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="flex items-center gap-2 text-sm text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">AI Service</span>
                <span className="flex items-center gap-2 text-sm text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">PayPal Gateway</span>
                <span className="flex items-center gap-2 text-sm text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="text-sm font-medium">
                  {totalUsers > 0
                    ? `${((activeSubscribers / totalUsers) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Revenue/User</span>
                <span className="text-sm font-medium">
                  ${activeSubscribers > 0
                    ? (totalRevenue / activeSubscribers).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Analyses/User</span>
                <span className="text-sm font-medium">
                  {totalUsers > 0
                    ? (totalAnalyses / totalUsers).toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RadioTower className="h-5 w-5 text-cyan-400" />
              Live Pulse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Visitors Live</p>
                <p className="mt-3 text-2xl font-semibold">{stats?.liveMetrics.currentVisitors || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Seen in the last 5 minutes</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Visitors Today</p>
                <p className="mt-3 text-2xl font-semibold">{stats?.liveMetrics.totalVisitorsToday || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Unique visitor sessions today</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Analyses Running</p>
                <p className="mt-3 text-2xl font-semibold">{stats?.liveMetrics.activeAnalyses || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Queued or processing right now</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Analyses Today</p>
                <p className="mt-3 text-2xl font-semibold">{stats?.liveMetrics.totalAnalysesToday || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total analysis jobs created today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
