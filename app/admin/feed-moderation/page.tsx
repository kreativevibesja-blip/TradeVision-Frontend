import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminFeedModerationPage() {
  return <AdminToolPage title="Feed Moderation" subtitle="Review reports, remove posts, hide harmful ideas, ban or mute users, and feature high-quality posts." rows={[['Reported EUR/USD post', 'Needs Review', '8m ago'], ['Featured Gold analysis', 'Active', '24m ago'], ['Muted spam account', 'Blocked', '1h ago']]} actionLabel="Review reports" />;
}
