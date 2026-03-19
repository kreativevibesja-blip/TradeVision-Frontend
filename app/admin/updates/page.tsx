'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type Announcement } from '@/lib/api';
import { Megaphone, Plus, Loader2, Trash2, Clock3, Sparkles } from 'lucide-react';

export default function AdminUpdatesPage() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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

  const createAnnouncement = async () => {
    if (!title || !content) return;
    try {
      setCreating(true);
      await api.admin.createAnnouncement(
        {
          title,
          content,
          ...(durationValue.trim() ? { durationValue: Number(durationValue), durationUnit } : {}),
        },
        token!
      );
      setTitle('');
      setContent('');
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
        <CardContent className="space-y-4">
          <Input placeholder="Title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="w-full h-24 p-3 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring resize-none"
            placeholder="Announcement content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
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
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Megaphone className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : announcements.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No announcements yet</CardContent></Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} className="overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <CardContent className="p-6">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-300" />
                      <h3 className="font-semibold">{a.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={a.isActive ? 'success' : 'secondary'}>{a.isActive ? 'Active' : 'Hidden'}</Badge>
                      <Badge variant="outline">{a.expiresAt ? `Expires ${new Date(a.expiresAt).toLocaleString()}` : 'No expiry'}</Badge>
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
                <p className="text-xs text-muted-foreground">Published {new Date(a.createdAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
