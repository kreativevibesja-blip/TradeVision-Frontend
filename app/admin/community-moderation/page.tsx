import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminCommunityModerationPage() {
  return <AdminToolPage title="Community Moderation" subtitle="Manage channels, delete messages, pin announcements, mute users, ban users, and review reported messages." rows={[['General channel announcement', 'Active', 'Today'], ['Reported Gold room message', 'Needs Review', '18m ago'], ['Muted duplicate poster', 'Blocked', '2h ago']]} actionLabel="Create channel" />;
}
