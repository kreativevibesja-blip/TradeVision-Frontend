'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Settings, Save, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [freeLimit, setFreeLimit] = useState('3');
  const [proLimit, setProLimit] = useState('999999');

  useEffect(() => {
    if (token) loadSettings();
  }, [token]);

  const loadSettings = async () => {
    try {
      const data = await api.admin.getSettings(token!);
      setSettings(data.settings);
      const prompt = data.settings.find((s: any) => s.key === 'ai_prompt');
      const free = data.settings.find((s: any) => s.key === 'free_daily_limit');
      const pro = data.settings.find((s: any) => s.key === 'pro_daily_limit');
      if (prompt) setAiPrompt(prompt.value);
      if (free) setFreeLimit(String(free.value));
      if (pro) setProLimit(String(pro.value));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      setSaving(true);
      await api.admin.updateSetting({ key, value }, token!);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              AI Prompt Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Custom AI Analysis Prompt (optional override)</label>
              <textarea
                className="w-full mt-1 h-32 p-3 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring resize-none"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Leave empty to use default prompt..."
              />
            </div>
            <Button size="sm" onClick={() => saveSetting('ai_prompt', aiPrompt)} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Prompt
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Free Plan Daily Limit</label>
                <Input value={freeLimit} onChange={(e) => setFreeLimit(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Pro Plan Daily Limit</label>
                <Input value={proLimit} onChange={(e) => setProLimit(e.target.value)} type="number" />
              </div>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                await saveSetting('free_daily_limit', parseInt(freeLimit));
                await saveSetting('pro_daily_limit', parseInt(proLimit));
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Limits
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
