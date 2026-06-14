import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminReportsPage() {
  return <AdminToolPage title="Reports" subtitle="Export user growth, revenue, analysis usage, community activity, moderation, and support reports." rows={[['Revenue overview', 'Active', 'Today'], ['Community activity', 'Active', 'Today'], ['Moderation report', 'Needs Review', 'Yesterday']]} actionLabel="Export report" />;
}
