import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminSubscriptionsPage() {
  return <AdminToolPage title="Subscriptions" subtitle="Manage Free, Pro Weekly, and Pro Monthly access, cancellations, and renewals." rows={[['Pro Monthly Subscribers', 'Active', 'Today'], ['Pro Weekly Renewals', 'Needs Review', '1h ago'], ['Cancelled Renewals', 'Active', 'Yesterday']]} actionLabel="Export subscriptions" />;
}
