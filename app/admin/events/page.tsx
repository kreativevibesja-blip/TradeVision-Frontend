import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminEventsPage() {
  return <AdminToolPage title="Events" subtitle="Create market events, webinars, live training, platform events, and reminder campaigns." rows={[['FOMC Meeting', 'Active', 'Today'], ['Liquidity Webinar', 'Active', 'Yesterday'], ['GDP Release Reminder', 'Needs Review', '2 days ago']]} actionLabel="Create event" />;
}
