import { AdminToolPage } from '@/components/AdminToolPage';

export default function AdminSupportTicketsPage() {
  return <AdminToolPage title="Support Tickets" subtitle="Review user tickets, reply to conversations, assign priority, and close resolved issues." rows={[['Billing renewal issue', 'Needs Review', '12m ago'], ['Chart upload bug', 'Active', '36m ago'], ['Orion knowledge request', 'Active', '2h ago']]} actionLabel="Open queue" />;
}
