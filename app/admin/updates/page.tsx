'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Megaphone, Plus, Loader2 } from 'lucide-react';

export default function AdminUpdatesPage() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

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
      await api.admin.createAnnouncement({ title, content }, token!);
      setTitle('');
      setContent('');
      loadAnnouncements();
    } catch {
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">Platform Updates</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            New Announcement
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
            <Card key={a.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  <Badge variant={a.isActive ? 'success' : 'secondary'}>{a.isActive ? 'Active' : 'Hidden'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{a.content}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
