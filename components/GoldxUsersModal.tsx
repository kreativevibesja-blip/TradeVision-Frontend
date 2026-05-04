'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, FileArchive, KeyRound, Loader2, Mail, RefreshCcw, ShieldCheck, Waves, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, type GoldxAdminUserDetails, type GoldxAdminUserRow } from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  token: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString();
};

export function GoldxUsersModal({ open, onClose, token }: Props) {
  const [users, setUsers] = useState<GoldxAdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [details, setDetails] = useState<GoldxAdminUserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'reissue' | 'email' | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoading(true);
    setActionMessage(null);
    api.admin.getGoldxUsers(token)
      .then((result) => {
        setUsers(result.users);
        if (!selectedUserId && result.users[0]) {
          setSelectedUserId(result.users[0].userId);
        }
      })
      .finally(() => setLoading(false));
  }, [open, token]);

  useEffect(() => {
    if (!open || !selectedUserId) {
      setDetails(null);
      return;
    }

    setDetailsLoading(true);
    setActionMessage(null);
    api.admin.getGoldxUserDetails(selectedUserId, token)
      .then((result) => setDetails(result.user))
      .finally(() => setDetailsLoading(false));
  }, [open, selectedUserId, token]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      user.email.toLowerCase().includes(term)
      || (user.name || '').toLowerCase().includes(term)
      || user.labels.join(' ').toLowerCase().includes(term)
    );
  }, [search, users]);

  const handleReissue = async () => {
    if (!details) return;
    setBusyAction('reissue');
    setActionMessage(null);
    try {
      const result = await api.admin.reissueGoldxLicense(details.id, token);
      const refreshed = await api.admin.getGoldxUserDetails(details.id, token);
      setDetails(refreshed.user);
      setUsers((current) => current.map((item) => item.userId === details.id ? {
        ...item,
        hasEa: true,
        labels: item.labels.includes('EA') ? item.labels : [...item.labels, 'EA'],
      } : item));
      setActionMessage(result.licenseKey ? `New key issued: ${result.licenseKey}` : result.message);
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to reissue the GoldX license key.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleEmailFiles = async () => {
    if (!details) return;
    setBusyAction('email');
    setActionMessage(null);
    try {
      await api.admin.sendGoldxFilesEmail(details.id, token);
      setActionMessage('GoldX EA delivery email sent successfully.');
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to send the GoldX EA delivery email.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="flex h-[88vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-amber-400/15 bg-[#0b0d14] text-white shadow-[0_28px_100px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex w-[360px] flex-col border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.15),_transparent_40%),rgba(255,255,255,0.02)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-200/70">Admin GoldX</p>
                  <h2 className="mt-1 text-xl font-semibold">GoldX Users</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="px-5 py-4">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search GoldX users..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>
              <div className="overflow-y-auto px-3 pb-3">
                {loading ? (
                  <div className="flex items-center justify-center py-14 text-sm text-white/55">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading GoldX users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-14 text-center text-sm text-white/45">No GoldX EA or Pulse users found.</div>
                ) : filteredUsers.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => setSelectedUserId(user.userId)}
                    className={`mb-2 w-full rounded-2xl border p-4 text-left transition-all ${selectedUserId === user.userId ? 'border-amber-400/35 bg-amber-400/10' : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{user.name || 'Unnamed user'}</p>
                        <p className="mt-1 truncate text-xs text-white/50">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="border-white/10 bg-black/20 text-[10px] tracking-[0.14em] text-white/70">
                        {user.platformSubscription}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.hasEa ? <Badge className="bg-amber-500/15 text-amber-200">EA</Badge> : null}
                      {user.hasPulse ? <Badge className="bg-cyan-500/15 text-cyan-200">Pulse</Badge> : null}
                    </div>
                    <div className="mt-3 text-xs text-white/45">
                      {user.ea.mt5Account ? `MT5 ${user.ea.mt5Account}` : user.pulse.planName || 'GoldX entitlement'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">GoldX Account Detail</p>
                <h3 className="mt-1 text-2xl font-semibold">{details?.name || details?.email || 'Select a user'}</h3>
              </div>
              <div className="p-6">
                {detailsLoading ? (
                  <div className="flex min-h-[300px] items-center justify-center text-sm text-white/55">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading GoldX details...
                  </div>
                ) : !details ? (
                  <div className="flex min-h-[300px] items-center justify-center text-sm text-white/45">Select a GoldX user to inspect entitlement details.</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Email</p>
                        <p className="mt-2 break-all text-sm font-medium">{details.email}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Role</p>
                        <p className="mt-2 text-sm font-medium">{details.role}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Platform Plan</p>
                        <p className="mt-2 text-sm font-medium">{details.platformSubscription}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Joined</p>
                        <p className="mt-2 text-sm font-medium">{formatDate(details.createdAt)}</p>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="rounded-[28px] border border-amber-400/20 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_48%),rgba(255,255,255,0.03)] p-5">
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-amber-300" />
                          <h4 className="text-lg font-semibold">GoldX EA</h4>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Subscription</p>
                            <p className="mt-2 text-sm font-medium">{details.goldxEa.subscriptionStatus || 'Not active'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">License</p>
                            <p className="mt-2 text-sm font-medium">{details.goldxEa.licenseStatus || 'Not issued'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">MT5 Account</p>
                            <p className="mt-2 text-sm font-medium">{details.goldxEa.mt5Account || 'Not bound yet'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Expires</p>
                            <p className="mt-2 text-sm font-medium">{formatDate(details.goldxEa.expiresAt || details.goldxEa.currentPeriodEnd)}</p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-amber-200/70">Visible License Key</p>
                          <p className="mt-3 break-all font-mono text-lg font-semibold text-white">
                            {details.goldxEa.pendingLicenseKey || 'No plaintext key stored. Reissue to generate a new one.'}
                          </p>
                          <p className="mt-2 text-xs text-white/50">
                            {details.goldxEa.pendingLicenseKey
                              ? `Issued ${formatDate(details.goldxEa.pendingKeyIssuedAt)}${details.goldxEa.pendingKeyExpiresAt ? ` • Expires ${formatDate(details.goldxEa.pendingKeyExpiresAt)}` : ''}`
                              : 'GoldX stores the hashed key for verification. Use reissue when the original key is no longer visible.'}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button onClick={handleReissue} disabled={busyAction !== null} className="bg-amber-500 text-black hover:bg-amber-400">
                            {busyAction === 'reissue' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                            Issue New Key
                          </Button>
                          <Button onClick={handleEmailFiles} disabled={busyAction !== null} variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5">
                            {busyAction === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                            Email EA Files
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_48%),rgba(255,255,255,0.03)] p-5">
                        <div className="flex items-center gap-2">
                          <Waves className="h-5 w-5 text-cyan-300" />
                          <h4 className="text-lg font-semibold">GoldX Pulse</h4>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Access</p>
                            <p className="mt-2 text-sm font-medium">{details.goldxPulse.active ? 'Active' : 'Inactive'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Source</p>
                            <p className="mt-2 text-sm font-medium">{details.goldxPulse.source}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Plan</p>
                            <p className="mt-2 text-sm font-medium">{details.goldxPulse.planName || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Expiry</p>
                            <p className="mt-2 text-sm font-medium">{formatDate(details.goldxPulse.expiresAt)}</p>
                          </div>
                        </div>
                        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                          {details.goldxPulse.reason || 'GoldX Pulse access is active for this account.'}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Billing status</p>
                        <p className="mt-2 text-sm font-medium">{details.billing.status}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Billing expires</p>
                        <p className="mt-2 text-sm font-medium">{formatDate(details.billing.expiresAt)}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Account status</p>
                        <p className="mt-2 text-sm font-medium">{details.banned ? 'Banned' : 'Active'}</p>
                      </div>
                    </div>

                    {actionMessage ? (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="break-all">{actionMessage}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}