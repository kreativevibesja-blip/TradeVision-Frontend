import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminContentPage() {
  return <AdminToolPage title="Content" subtitle="Manage announcements, education content, market outlook posts, and featured platform material." rows={[['Weekly market outlook', 'Active', 'Today'], ['Beginner guide refresh', 'Needs Review', 'Yesterday'], ['Product update banner', 'Active', '3 days ago']]} actionLabel="Create content" />;
}
