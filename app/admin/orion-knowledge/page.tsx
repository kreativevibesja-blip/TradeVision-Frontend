import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminOrionKnowledgePage() {
  return <AdminToolPage title="Orion Knowledge Studio" subtitle="Add knowledge entries, edit answers, map keywords/intents, upload documents, categorize knowledge, and manage fallback responses." rows={[['Market structure guide', 'Active', 'Today'], ['Billing FAQ intent', 'Active', 'Today'], ['PDF import queue', 'Needs Review', '45m ago']]} actionLabel="Add knowledge" />;
}
