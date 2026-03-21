'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Percent,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  Copy,
  CheckCircle2,
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    maxUses: '',
    perUserLimit: '1',
    expiresAt: '',
  });

  useEffect(() => {
    if (token) loadCoupons();
  }, [token]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getCoupons(token!);
      setCoupons(data.coupons);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!form.code.trim()) { setError('Code is required'); return; }
    if (!form.value || Number(form.value) <= 0) { setError('Value must be a positive number'); return; }
    if (form.type === 'percentage' && Number(form.value) > 100) { setError('Percentage cannot exceed 100'); return; }

    try {
      setCreating(true);
      await api.admin.createCoupon(
        {
          code: form.code.toUpperCase().trim(),
          type: form.type,
          value: Number(form.value),
          maxUses: parseInt(form.maxUses, 10) || 0,
          perUserLimit: parseInt(form.perUserLimit, 10) || 1,
          expiresAt: form.expiresAt || null,
        },
        token!
      );
      setForm({ code: '', type: 'percentage', value: '', maxUses: '', perUserLimit: '1', expiresAt: '' });
      setShowCreate(false);
      loadCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.admin.toggleCoupon(id, token!);
      loadCoupons();
    } catch {
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.admin.deleteCoupon(id, token!);
      loadCoupons();
    } catch {
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;

  const getStatus = (coupon: Coupon) => {
    if (!coupon.active) return { label: 'Disabled', variant: 'secondary' as const };
    if (isExpired(coupon)) return { label: 'Expired', variant: 'destructive' as const };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { label: 'Exhausted', variant: 'warning' as const };
    return { label: 'Active', variant: 'success' as const };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Create Coupon Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    Create Coupon
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setError(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Coupon Code</label>
                    <Input
                      placeholder="e.g. SAVE20"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Discount Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        Value {form.type === 'percentage' ? '(%)' : '($)'}
                      </label>
                      <Input
                        type="number"
                        placeholder={form.type === 'percentage' ? '20' : '5.00'}
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        min="0"
                        step={form.type === 'fixed' ? '0.01' : '1'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Max Uses (0 = unlimited)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.maxUses}
                        onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Per User Limit</label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={form.perUserLimit}
                        onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Expiration Date (optional)</label>
                    <Input
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreate} disabled={creating} className="flex-1">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCreate(false); setError(''); }} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Percent className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No coupons yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Create your first coupon to offer discounts</p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-muted-foreground">Code</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Value</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Uses</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Per User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Expires</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const status = getStatus(coupon);
                    return (
                      <tr key={coupon.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold">
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => copyCode(coupon.code, coupon.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy code"
                            >
                              {copiedId === coupon.id ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground capitalize">{coupon.type}</td>
                        <td className="p-4 font-medium">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {coupon.usedCount} / {coupon.maxUses === 0 ? '∞' : coupon.maxUses}
                        </td>
                        <td className="p-4 text-muted-foreground">{coupon.perUserLimit}</td>
                        <td className="p-4 text-muted-foreground text-xs">
                          {coupon.expiresAt
                            ? new Date(coupon.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Never'}
                        </td>
                        <td className="p-4">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(coupon.id)}
                              title={coupon.active ? 'Disable' : 'Enable'}
                            >
                              {coupon.active ? (
                                <ToggleRight className="h-4 w-4 text-green-400" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(coupon.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
