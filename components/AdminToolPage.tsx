import { CleanBadge, CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';

export function AdminToolPage({
  title,
  subtitle,
  rows,
  actionLabel = 'Create New',
}: {
  title: string;
  subtitle: string;
  rows: Array<[string, string, string]>;
  actionLabel?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} action={<CleanButton>{actionLabel}</CleanButton>} />
      <CleanCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-[#6B7280]">
              <tr>
                <th className="py-3">Name</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {rows.map(([name, status, updated]) => (
                <tr key={name}>
                  <td className="py-4 font-bold text-[#111827]">{name}</td>
                  <td><CleanBadge tone={status === 'Needs Review' ? 'amber' : status === 'Blocked' ? 'red' : 'green'}>{status}</CleanBadge></td>
                  <td className="text-[#6B7280]">{updated}</td>
                  <td className="text-right"><button className="font-bold text-[#2563EB]">Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CleanCard>
    </div>
  );
}
