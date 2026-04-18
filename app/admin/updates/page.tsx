'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type Announcement, type AnnouncementType } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import {
  Megaphone, Plus, Loader2, Trash2, Clock3, Sparkles,
  Rocket, Wrench, Percent, Shield, PartyPopper, Tag,
} from 'lucide-react';

const PRESETS: { type: AnnouncementType; label: string; icon: typeof Rocket; color: string; bg: string; border: string; defaultTitle: string; defaultContent: string }[] = [
  {
    type: 'update',
    label: 'Update',
    icon: Rocket,
    color: 'text-cyan-300',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/30',
    defaultTitle: 'Platform Update',
    defaultContent: 'We\'ve shipped improvements to make your experience even better!',
  },
  {
    type: 'maintenance',
    label: 'Maintenance',
    icon: Wrench,
    color: 'text-amber-300',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    defaultTitle: 'Scheduled Maintenance',
    defaultContent: 'We\'ll be performing scheduled maintenance. Some features may be temporarily unavailable.',
  },
  {
    type: 'discount',
    label: 'Discount',
    icon: Percent,
    color: 'text-pink-300',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/30',
    defaultTitle: 'Special Offer',
    defaultContent: 'Don\'t miss out on this limited-time discount! Upgrade your plan today.',
  },
  {
    type: 'new_feature',
    label: 'New Feature',
    icon: Sparkles,
    color: 'text-emerald-300',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    defaultTitle: 'New Feature',
    defaultContent: 'We\'re excited to introduce a brand-new feature to ChartMind AI!',
  },
  {
    type: 'security',
    label: 'Security',
    icon: Shield,
    color: 'text-rose-300',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/30',
    defaultTitle: 'Security Update',
    defaultContent: 'We\'ve made security enhancements to keep your account safe.',
  },
  {
    type: 'event',
    label: 'Event',
    icon: PartyPopper,
    color: 'text-yellow-300',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    defaultTitle: 'Special Event',
    defaultContent: 'Something exciting is happening — stay tuned!',
  },
];

const TYPE_BADGE_MAP: Record<AnnouncementType, { label: string; className: string }> = {
  update: { label: 'Update', className: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-400/15 text-amber-300 border-amber-400/30' },
  discount: { label: 'Discount', className: 'bg-pink-400/15 text-pink-300 border-pink-400/30' },
  new_feature: { label: 'New Feature', className: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30' },
  security: { label: 'Security', className: 'bg-rose-400/15 text-rose-300 border-rose-400/30' },
  event: { label: 'Event', className: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30' },
};

export default function AdminUpdatesPage() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<AnnouncementType>('update');
  const [title, setTitle] = useState(PRESETS[0].defaultTitle);
  const [content, setContent] = useState(PRESETS[0].defaultContent);
  const [couponCode, setCouponCode] = useState('');
  const [targetPlan, setTargetPlan] = useState<'PRO' | 'TOP_TIER' | ''>('');
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('hours');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadAnnouncements();
  }, [token]);

  const loadAnnouncements = async () => {
    try {
      const data = await api.admin.getAnnouncements(token!);
      setAnnouncements(data.announcements);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (type: AnnouncementType) => {
    const preset = PRESETS.find((p) => p.type === type)!;
    setSelectedType(type);
    setTitle(preset.defaultTitle);
    setContent(preset.defaultContent);
    if (type !== 'discount') {
      setCouponCode('');
    }
  };

  const createAnnouncement = async () => {
    if (!title || !content) return;
    try {
      setCreating(true);
      await api.admin.createAnnouncement(
        {
          title,
          content,
          type: selectedType,
          ...(selectedType === 'discount' && couponCode.trim() ? { couponCode: couponCode.trim().toUpperCase() } : {}),
          ...(targetPlan ? { targetPlan } : {}),
          ...(durationValue.trim() ? { durationValue: Number(durationValue), durationUnit } : {}),
        },
        token!
      );
      selectPreset('update');
      setCouponCode('');
      setTargetPlan('');
      setDurationValue('');
      setDurationUnit('hours');
      loadAnnouncements();
    } catch {
    } finally {
      setCreating(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      setDeletingId(id);
      await api.admin.deleteAnnouncement(id, token!);
      await loadAnnouncements();
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  const activePreset = PRESETS.find((p) => p.type === selectedType)!;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">Platform Updates</h1>

      <Card className="mb-6 overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            New Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Preset type selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Update Type</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const active = selectedType === preset.type;
                return (
                  <button
                    key={preset.type}
                    onClick={() => selectPreset(preset.type)}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all
                      ${active ? `${preset.bg} ${preset.border} ${preset.color} ring-1 ring-white/10` : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
                  >
                    <Icon className="h-5 w-5" />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input placeholder="Title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="w-full h-24 p-3 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring resize-none"
            placeholder="Announcement content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Discount-specific fields */}
          {selectedType === 'discount' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 rounded-xl border border-pink-400/20 bg-pink-400/5 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-pink-300">
                <Tag className="h-4 w-4" />
                Discount Details
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Coupon Code</label>
                <Input
                  placeholder="e.g. SAVE20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Must match an existing coupon from the Coupons page</p>
              </div>
            </motion.div>
          )}

          {/* Promote Plan — available for all update types */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Promote Plan <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Users will see a &ldquo;Get Plan Now&rdquo; button at the bottom of this update.</p>
            <select
              value={targetPlan}
              onChange={(e) => setTargetPlan(e.target.value as 'PRO' | 'TOP_TIER' | '')}
              className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None — no upgrade button</option>
              <option value="PRO">PRO — $19.95/mo</option>
              <option value="TOP_TIER">PRO+ — $39.95/mo</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock3 className="h-4 w-4 text-cyan-300" />
                Auto-expire update
              </div>
              <p className="text-xs text-muted-foreground">Leave blank to keep the update active until you delete it manually.</p>
            </div>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Time"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as 'hours' | 'days')}
                className="rounded-lg border border-input bg-background/60 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <Button onClick={createAnnouncement} disabled={creating || !title || !content}>
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <activePreset.icon className="h-4 w-4 mr-2" />}
            Publish {activePreset.label}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : announcements.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No announcements yet</CardContent></Card>
        ) : (
          announcements.map((a) => {
            const typeBadge = TYPE_BADGE_MAP[a.type] || TYPE_BADGE_MAP.update;
            return (
              <Card key={a.id} className="overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <CardContent className="p-6">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-300" />
                        <h3 className="font-semibold">{a.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`border ${typeBadge.className}`}>{typeBadge.label}</Badge>
                        <Badge variant={a.isActive ? 'success' : 'secondary'}>{a.isActive ? 'Active' : 'Hidden'}</Badge>
                        <Badge variant="outline">{a.expiresAt ? `Expires ${formatJamaicaDateTime(a.expiresAt)}` : 'No expiry'}</Badge>
                        {a.couponCode && <Badge className="border border-pink-400/30 bg-pink-400/15 text-pink-300">Coupon: {a.couponCode}</Badge>}
                        {a.targetPlan && <Badge variant="outline">{a.targetPlan === 'TOP_TIER' ? 'PRO+' : a.targetPlan}</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="self-start rounded-full text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      onClick={() => deleteAnnouncement(a.id)}
                      disabled={deletingId === a.id}
                      aria-label="Delete update"
                    >
                      {deletingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{a.content}</p>
                  <p className="text-xs text-muted-foreground">Published {formatJamaicaDateTime(a.createdAt)}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
