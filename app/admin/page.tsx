'use client';

import { Activity, DollarSign, FileText, LifeBuoy, Newspaper, Radar, TrendingUp, Users } from 'lucide-react';
import { CleanBadge, CleanCard, CleanStatCard, PageHeader } from '@/components/CleanBlue';

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" subtitle="Clean operating dashboard for TradeVision users, revenue, AI usage, community, and support." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CleanStatCard label="Total Users" value="12,543" trend="+12.5%" icon={<Users className="h-5 w-5" />} />
        <CleanStatCard label="Active Users" value="8,921" trend="+8.3%" icon={<Activity className="h-5 w-5" />} />
        <CleanStatCard label="New Signups" value="1,429" trend="+15.2%" icon={<TrendingUp className="h-5 w-5" />} />
        <CleanStatCard label="Revenue MRR" value="$48,920" trend="+10.7%" icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">User Growth</h2>
          <div className="mt-5 h-64 rounded-2xl bg-[#F7F9FC] p-4">
            <div className="flex h-full items-end gap-3">
              {[35, 44, 58, 49, 71, 70, 90].map((height, index) => (
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
            {['All systems operational', '99.8% uptime', 'Community polling healthy'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-[#F7F9FC] p-3 text-sm font-semibold text-[#111827]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
                {item}
              </div>
            ))}
          </div>
        </CleanCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <CleanCard>
          <h2 className="mb-4 font-extrabold text-[#111827]">AI & Platform Insights</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <CleanStatCard label="Analyses Today" value="25,621" trend="+9.4%" icon={<FileText className="h-5 w-5" />} />
            <CleanStatCard label="Posts Today" value="1,392" trend="+11.3%" icon={<Newspaper className="h-5 w-5" />} />
            <CleanStatCard label="Active Radar" value="418" trend="+13.8%" icon={<Radar className="h-5 w-5" />} />
            <CleanStatCard label="Open Tickets" value="27" icon={<LifeBuoy className="h-5 w-5" />} />
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
                {['John D.', 'Sarah K.', 'Mike R.', 'David L.'].map((user, index) => (
                  <tr key={user}><td className="py-3 font-semibold text-[#111827]">{user}</td><td>Pro Monthly</td><td>$39.95</td><td><CleanBadge tone={index === 3 ? 'red' : 'green'}>{index === 3 ? 'Refunded' : 'Paid'}</CleanBadge></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </CleanCard>
      </div>
    </div>
  );
}
