'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { type AdminAnalyticsResponse } from '@/lib/api';
import { addDaysToDateInputValue, formatJamaicaDate, getJamaicaDateInputValue } from '@/lib/jamaica-time';
import { BarChart3, Users, CalendarRange, DollarSign, RadioTower, PlayCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
const Line = dynamic(async () => (await import('react-chartjs-2')).Line, { ssr: false });
const Bar = dynamic(async () => (await import('react-chartjs-2')).Bar, { ssr: false });

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
    },
  },
};

const DEFAULT_API_URL = 'http://localhost:4000/api';

const normalizeApiUrl = (value?: string) => {
  const rawValue = value?.trim();
  if (!rawValue) {
    return DEFAULT_API_URL;
  }

  try {
    const parsedUrl = new URL(rawValue);
    const normalizedPath = parsedUrl.pathname === '/' ? '/api' : parsedUrl.pathname.replace(/\/$/, '');
    parsedUrl.pathname = normalizedPath.endsWith('/api') ? normalizedPath : `${normalizedPath}/api`;
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return rawValue.replace(/\/$/, '').endsWith('/api')
      ? rawValue.replace(/\/$/, '')
      : `${rawValue.replace(/\/$/, '')}/api`;
  }
};

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
const REFRESH_INTERVAL_MS = 30_000;

type RangePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

const getPresetRange = (preset: Exclude<RangePreset, 'custom'>) => {
  const today = getJamaicaDateInputValue();

  if (preset === 'today') {
    return { from: today, to: today };
  }

  if (preset === 'yesterday') {
    const yesterday = addDaysToDateInputValue(today, -1);
    return { from: yesterday, to: yesterday };
  }

  if (preset === '7d') {
    return { from: addDaysToDateInputValue(today, -6), to: today };
  }

  return { from: addDaysToDateInputValue(today, -29), to: today };
};

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<RangePreset>('30d');
  const initialRange = getPresetRange('30d');
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadAnalytics();
    const intervalId = window.setInterval(() => {
      void loadAnalytics(false);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [token, fromDate, toDate]);

  const loadAnalytics = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const response = await fetch(`${API_URL}/admin/analytics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token!}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch {
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const applyPreset = (nextPreset: RangePreset) => {
    setPreset(nextPreset);
    if (nextPreset === 'custom') {
      return;
    }

    const range = getPresetRange(nextPreset);
    setFromDate(range.from);
    setToDate(range.to);
  };

  const processGroupedData = (data?: any[], sumKey?: string) => {
    const byDate: Record<string, number> = {};
    (data || []).forEach((item: any) => {
      const date = formatJamaicaDate(item.createdAt, { month: 'short', day: 'numeric' });
      byDate[date] = (byDate[date] || 0) + (sumKey ? (item._sum?.[sumKey] || 0) : (item._count || 1));
    });
    return {
      labels: Object.keys(byDate),
      values: Object.values(byDate),
    };
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
    );
  }

  const userGrowth = processGroupedData(analytics?.userGrowth);
  const analysesPerDay = processGroupedData(analytics?.analysesPerDay);
  const revenue = processGroupedData(analytics?.revenueData, 'amount');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: '7 Days', value: '7d' },
              { label: '1 Month', value: '30d' },
              { label: 'Custom', value: 'custom' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={preset === option.value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => applyPreset(option.value as RangePreset)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(event) => {
                    setPreset('custom');
                    setFromDate(event.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(event) => {
                    setPreset('custom');
                    setToDate(event.target.value);
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pb-1">
                <CalendarRange className="h-4 w-4" />
                {analytics?.range ? `${formatJamaicaDate(analytics.range.from)} - ${formatJamaicaDate(analytics.range.to)}` : 'Select a date range'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Current Live Visitors</p>
                  <p className="mt-3 text-3xl font-bold">{analytics?.liveMetrics.currentVisitors || 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Seen in the last 5 minutes</p>
                </div>
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                  <RadioTower className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Visitors Today</p>
                  <p className="mt-3 text-3xl font-bold">{analytics?.liveMetrics.totalVisitorsToday || 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Unique sessions tracked today</p>
                </div>
                <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Analyses Running</p>
                  <p className="mt-3 text-3xl font-bold">{analytics?.liveMetrics.activeAnalyses || 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Queued or processing right now</p>
                </div>
                <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-300">
                  <PlayCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Analyses Today</p>
                  <p className="mt-3 text-3xl font-bold">{analytics?.liveMetrics.totalAnalysesToday || 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Total analysis jobs created today</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              User Growth (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userGrowth.labels.length > 0 ? (
              <div className="h-80">
                <Line
                  data={{
                    labels: userGrowth.labels,
                    datasets: [{
                      data: userGrowth.values,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                    }],
                  }}
                  options={chartOptions}
                />
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-400" />
              Analyses Per Day (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysesPerDay.labels.length > 0 ? (
              <div className="h-80">
                <Bar
                  data={{
                    labels: analysesPerDay.labels,
                    datasets: [{
                      data: analysesPerDay.values,
                      backgroundColor: 'rgba(34, 197, 94, 0.5)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 1,
                      borderRadius: 4,
                    }],
                  }}
                  options={chartOptions}
                />
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-400" />
              Revenue (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.labels.length > 0 ? (
              <div className="h-96">
                <Line
                  data={{
                    labels: revenue.labels,
                    datasets: [{
                      data: revenue.values,
                      borderColor: 'rgb(234, 179, 8)',
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      fill: true,
                      tension: 0.4,
                    }],
                  }}
                  options={chartOptions}
                />
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No revenue data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
