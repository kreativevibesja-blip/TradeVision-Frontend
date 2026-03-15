'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react';
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
import { Line, Bar } from 'react-chartjs-2';

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

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) loadAnalytics();
  }, [token]);

  const loadAnalytics = async () => {
    try {
      const data = await api.admin.getAnalytics(token!);
      setAnalytics(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const processGroupedData = (data: any[], sumKey?: string) => {
    const byDate: Record<string, number> = {};
    (data || []).forEach((item: any) => {
      const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

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
            ) : (
              <p className="text-center py-8 text-muted-foreground">No revenue data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
