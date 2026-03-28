'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminDashboardStats } from '@/lib/api';
import { Users, Crown, FileText, DollarSign, TrendingUp, Activity, RadioTower, PlayCircle } from 'lucide-react';

const REFRESH_INTERVAL_MS = 30_000;

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadStats();
    const intervalId = window.setInterval(() => {
      void loadStats(false);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [token]);

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
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Dashboard Overview</h1>

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
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Info Cards */}
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
