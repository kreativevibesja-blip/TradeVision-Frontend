'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  type UserReferralDashboard,
  type ReferralCode,
} from '@/lib/api';
import { formatJamaicaDate } from '@/lib/jamaica-time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  Check,
  Loader2,
  Gift,
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  ExternalLink,
  Percent,
} from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytradevision.online';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  qualified: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  processing: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function ReferralDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<UserReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  // Code editing
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Payout
  const [paypalEmail, setPaypalEmail] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.referral.getDashboard(token);
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUpdateCode = async () => {
    if (!token || !newCode.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      await api.referral.updateMyCode(newCode.trim(), token);
      setEditingCode(false);
      await load();
    } catch (err: any) {
      setCodeError(err.message || 'Failed to update code');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!token || !paypalEmail.trim()) return;
    setPayoutLoading(true);
    setPayoutMessage(null);
    try {
      await api.referral.requestPayout(paypalEmail.trim(), token);
      setPayoutMessage({ type: 'success', text: 'Payout request submitted! You\'ll be notified once it\'s processed.' });
      setPaypalEmail('');
      await load();
    } catch (err: any) {
      setPayoutMessage({ type: 'error', text: err.message || 'Failed to request payout' });
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Gift className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Referral Program</h2>
          <p className="text-muted-foreground">Unable to load referral data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const referralLink = data.referralCode ? `${SITE_URL}/signup?ref=${data.referralCode.code}` : '';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Referral Program</h1>
        <p className="text-muted-foreground mt-1">
          Earn commission by inviting others to TradeVision AI
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="mobile-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Total Earnings</span>
            </div>
            <p className="text-xl font-bold">${data.stats.totalEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Total Referrals</span>
            </div>
            <p className="text-xl font-bold">{data.stats.totalReferrals}</p>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Converted</span>
            </div>
            <p className="text-xl font-bold">{data.stats.qualifiedReferrals}</p>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Rate</span>
            </div>
            <p className="text-xl font-bold">{data.stats.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code + Link */}
      <Card className="mobile-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.referralCode && !editingCode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 font-mono text-lg tracking-widest text-center">
                  {data.referralCode.code}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(data.referralCode!.code, 'code')}
                >
                  {copied === 'code' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { setEditingCode(true); setNewCode(data.referralCode!.code); }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-muted-foreground truncate">
                  {referralLink}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(referralLink, 'link')}
                >
                  {copied === 'link' ? <Check className="h-4 w-4 text-green-400" /> : <ExternalLink className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : editingCode ? (
            <div className="space-y-3">
              <Input
                placeholder="Enter new code (4-16 chars)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={16}
              />
              {codeError && <p className="text-sm text-red-400">{codeError}</p>}
              <div className="flex gap-2">
                <Button onClick={handleUpdateCode} disabled={codeLoading || !newCode.trim()}>
                  {codeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
                <Button variant="outline" onClick={() => { setEditingCode(false); setCodeError(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">Your referral code is not available yet.</p>
              <Button variant="outline" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          )}

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Percent className="h-4 w-4 text-primary" />
              <span>Your referrals get <strong>{data.discountPercent}% off</strong> their subscription</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Table */}
      <Card className="mobile-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-400" />
            Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No earnings yet. Share your referral link to start earning!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">User</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.commissions.map((c) => (
                    <tr key={c.id} className="border-b border-white/5">
                      <td className="py-3 px-2">
                        {c.referredUser?.email || 'Unknown'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className={statusColors[c.status] || ''}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">${Number(c.amount).toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {formatJamaicaDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Section */}
      <Card className="mobile-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-blue-400" />
            Withdraw Earnings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="text-xl font-bold text-green-400">
                ${data.stats.approvedBalance.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">Paid Out</p>
              <p className="text-xl font-bold">${data.stats.paidBalance.toFixed(2)}</p>
            </div>
          </div>

          {data.stats.pendingBalance > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-300">
              <Clock className="inline h-4 w-4 mr-1" />
              ${data.stats.pendingBalance.toFixed(2)} pending approval
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="PayPal email address"
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleRequestPayout}
              disabled={payoutLoading || !paypalEmail.trim() || data.stats.approvedBalance < 10}
            >
              {payoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
              Withdraw
            </Button>
          </div>

          {data.stats.approvedBalance < 10 && (
            <p className="text-xs text-muted-foreground">Minimum payout: $10.00</p>
          )}

          {payoutMessage && (
            <div className={`rounded-xl p-3 text-sm ${payoutMessage.type === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
              {payoutMessage.text}
            </div>
          )}

          {/* Payout History */}
          {data.payouts.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium mb-3">Payout History</h4>
              <div className="space-y-2">
                {data.payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-sm">
                    <div>
                      <span className="font-medium">${Number(p.amount).toFixed(2)}</span>
                      <span className="text-muted-foreground ml-2">→ {p.paypalEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[p.status] || ''}>
                        {p.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatJamaicaDate(p.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
