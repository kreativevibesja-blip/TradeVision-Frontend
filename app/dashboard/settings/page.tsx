'use client';

import { Save } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage profile, privacy, markets traded, notifications, and performance visibility." />
      <CleanCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" defaultValue={user?.name || ''} placeholder="Display name" />
          <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" defaultValue={user?.email || ''} placeholder="Email" />
          <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB] sm:col-span-2" placeholder="Markets traded: Forex, Gold, Crypto..." />
          <textarea className="min-h-28 rounded-xl border border-[#E5E7EB] p-4 text-sm outline-none focus:border-[#2563EB] sm:col-span-2" placeholder="Bio" />
        </div>
        <div className="mt-5 space-y-3">
          {['Hide performance stats from public profile', 'Email me event reminders', 'Notify me when radar setups approach entry'].map((label) => (
            <label key={label} className="flex items-center gap-3 text-sm font-semibold text-[#4B5563]">
              <input type="checkbox" className="h-4 w-4 accent-[#2563EB]" />
              {label}
            </label>
          ))}
        </div>
        <CleanButton className="mt-5"><Save className="h-4 w-4" />Save settings</CleanButton>
      </CleanCard>
    </div>
  );
}
