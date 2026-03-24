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
  const [freeMarkupEnabled, setFreeMarkupEnabled] = useState(true);
  const [proMarkupEnabled, setProMarkupEnabled] = useState(true);
  const [freeGeminiEnabled, setFreeGeminiEnabled] = useState(true);
  const [freeOpenAiEnabled, setFreeOpenAiEnabled] = useState(false);
  const [proGeminiEnabled, setProGeminiEnabled] = useState(true);
  const [proOpenAiEnabled, setProOpenAiEnabled] = useState(false);

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
      const freeMarkup = data.settings.find((s: any) => s.key === 'chart_markup_free_enabled');
      const proMarkup = data.settings.find((s: any) => s.key === 'chart_markup_pro_enabled');
      const freeGemini = data.settings.find((s: any) => s.key === 'ai_model_gemini_free_enabled');
      const freeOpenAi = data.settings.find((s: any) => s.key === 'ai_model_openai_free_enabled');
      const proGemini = data.settings.find((s: any) => s.key === 'ai_model_gemini_pro_enabled');
      const proOpenAi = data.settings.find((s: any) => s.key === 'ai_model_openai_pro_enabled');
      if (prompt) setAiPrompt(prompt.value);
      if (free) setFreeLimit(String(free.value));
      if (pro) setProLimit(String(pro.value));
      if (freeMarkup) setFreeMarkupEnabled(Boolean(freeMarkup.value));
      if (proMarkup) setProMarkupEnabled(Boolean(proMarkup.value));
      if (freeGemini) setFreeGeminiEnabled(Boolean(freeGemini.value));
      if (freeOpenAi) setFreeOpenAiEnabled(Boolean(freeOpenAi.value));
      if (proGemini) setProGeminiEnabled(Boolean(proGemini.value));
      if (proOpenAi) setProOpenAiEnabled(Boolean(proOpenAi.value));
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Providers By Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">When both providers are enabled, Gemini is used first and GPT-5.1 is used as fallback if Gemini fails.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-background/50 p-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Free Plan AI Providers</label>
                  <p className="text-xs text-muted-foreground mt-1">Choose which providers can serve Free analysis requests.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={freeGeminiEnabled ? 'default' : 'outline'} size="sm" onClick={() => setFreeGeminiEnabled((current) => !current)}>
                    Gemini {freeGeminiEnabled ? 'On' : 'Off'}
                  </Button>
                  <Button type="button" variant={freeOpenAiEnabled ? 'default' : 'outline'} size="sm" onClick={() => setFreeOpenAiEnabled((current) => !current)}>
                    GPT-5.1 {freeOpenAiEnabled ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-background/50 p-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Pro Plan AI Providers</label>
                  <p className="text-xs text-muted-foreground mt-1">Choose which providers can serve Pro analysis requests.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={proGeminiEnabled ? 'default' : 'outline'} size="sm" onClick={() => setProGeminiEnabled((current) => !current)}>
                    Gemini {proGeminiEnabled ? 'On' : 'Off'}
                  </Button>
                  <Button type="button" variant={proOpenAiEnabled ? 'default' : 'outline'} size="sm" onClick={() => setProOpenAiEnabled((current) => !current)}>
                    GPT-5.1 {proOpenAiEnabled ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={async () => {
                await saveSetting('ai_model_gemini_free_enabled', freeGeminiEnabled);
                await saveSetting('ai_model_openai_free_enabled', freeOpenAiEnabled);
                await saveSetting('ai_model_gemini_pro_enabled', proGeminiEnabled);
                await saveSetting('ai_model_openai_pro_enabled', proOpenAiEnabled);
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save AI Provider Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chart Markup By Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-background/50 p-4 space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Free Plan Markup</label>
                  <p className="text-xs text-muted-foreground mt-1">Controls whether Free users receive marked charts with AI zones.</p>
                </div>
                <Button
                  type="button"
                  variant={freeMarkupEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFreeMarkupEnabled((current) => !current)}
                >
                  {freeMarkupEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="rounded-lg border border-white/10 bg-background/50 p-4 space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Pro Plan Markup</label>
                  <p className="text-xs text-muted-foreground mt-1">Controls whether Pro users receive marked charts with AI zones.</p>
                </div>
                <Button
                  type="button"
                  variant={proMarkupEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProMarkupEnabled((current) => !current)}
                >
                  {proMarkupEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>

            <Button
              size="sm"
              onClick={async () => {
                await saveSetting('chart_markup_free_enabled', freeMarkupEnabled);
                await saveSetting('chart_markup_pro_enabled', proMarkupEnabled);
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Markup Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
