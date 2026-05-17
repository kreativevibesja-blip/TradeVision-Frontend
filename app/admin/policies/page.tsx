'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Search, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type AdminPolicyAcceptance } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';

export default function AdminPoliciesPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState<AdminPolicyAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    setLoading(true);
    api.admin.getPolicyAcceptances(token, { page, search })
      .then((data) => {
        if (!active) {
          return;
        }

        setRecords(data.acceptances);
        setTotalPages(data.pages);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page, search, token]);

  const acceptedCount = records.filter((record) => record.accepted).length;
  const uniqueUsers = new Set(records.map((record) => record.user_id)).size;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="premium-panel premium-noise overflow-hidden p-6 sm:p-8">
        <div className="ambient-orb -left-8 top-0 h-32 w-32 opacity-60" />
        <div className="ambient-orb bottom-0 right-0 h-36 w-36 opacity-40" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="premium-kicker mb-4">Compliance</div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-[-0.05em] text-white sm:text-4xl">Policy Acceptances</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">Review the current no-refund policy audit trail, track policy version acknowledgements, and search acceptance records by user, plan, version, or network metadata.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="mobile-card rounded-[22px] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visible records</div>
              <div className="mt-1 text-2xl font-semibold text-white">{records.length}</div>
            </div>
            <div className="mobile-card rounded-[22px] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Accepted</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-100">{acceptedCount}</div>
            </div>
            <div className="mobile-card rounded-[22px] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Users</div>
              <div className="mt-1 text-2xl font-semibold text-amber-100">{uniqueUsers}</div>
            </div>
          </div>
        </div>
      </section>

      <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setPage(1);
                    setSearch(searchInput.trim());
                  }
                }}
                placeholder="Search by user, plan, version, IP, or user agent"
                className="premium-input h-11 pl-10"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearch(searchInput.trim());
              }}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,223,112,0.24)] bg-[rgba(255,223,112,0.12)] px-5 text-sm font-medium text-[var(--gold-light)] transition hover:bg-[rgba(255,223,112,0.18)]"
            >
              Apply Search
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-14 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading policy acceptances...
            </div>
          ) : (
            <div className="terminal-table max-h-[72vh] overflow-auto rounded-[28px]">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur-xl">
                  <tr className="border-b border-[rgba(255,223,112,0.12)]">
                    <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Policy</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Version</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Accepted At</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">IP</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">No policy acceptances match the current filters.</td>
                    </tr>
                  ) : records.map((record) => (
                    <tr key={record.id} className="border-b border-white/5 align-top hover:bg-white/5">
                      <td className="p-4">
                        <div className="font-medium text-white">{record.user?.name || 'Unknown User'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{record.user?.email || record.user_id}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{record.plan_id}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {record.policy_type}
                        </div>
                      </td>
                      <td className="p-4 text-white/80">{record.policy_version}</td>
                      <td className="p-4 text-white/80">{formatJamaicaDateTime(record.accepted_at)}</td>
                      <td className="p-4 text-xs text-white/70">{record.ip_address || 'Unknown'}</td>
                      <td className="max-w-[280px] p-4 text-xs text-white/60">
                        <div className="line-clamp-3 break-words">{record.user_agent || 'Unavailable'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Page {page} of {Math.max(totalPages, 1)}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-full border border-white/10 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="rounded-full border border-white/10 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10"
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}