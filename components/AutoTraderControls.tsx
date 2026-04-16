'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Crown, Loader2, Save, Shield, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  type AllowedTradingAsset,
  type AllowedTradingSession,
  type AutoTradeSettings,
  type StrategyMode,
  type TradingPersonality,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DEFAULT_SETTINGS: AutoTradeSettings = {
  autoMode: 'off',
  strategyMode: 'standard',
  riskPerTrade: 1,
  maxDailyLoss: 5,
  maxTradesPerDay: 3,
  allowedSessions: ['london', 'newyork'],
  allowedAssets: ['gold', 'forex'],
  personality: 'balanced',
  minConfidence: 6,
  autoPauseEnabled: true,
  maxLossesInRow: 2,
  goldOnly: false,
  isActive: false,
  connected: false,
  mt5AccountId: null,
  mt5Status: null,
};

const PERSONALITY_COPY: Record<TradingPersonality, { title: string; description: string; className: string }> = {
  conservative: {
    title: 'Conservative',
    description: 'Fewer trades, highest quality setups',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  },
  balanced: {
    title: 'Balanced',
    description: 'Moderate frequency and risk',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  },
  aggressive: {
    title: 'Aggressive',
    description: 'More trades, higher risk/reward',
    className: 'border-red-500/30 bg-red-500/10 text-red-200',
  },
};

const ASSET_OPTIONS: Array<{ value: AllowedTradingAsset; label: string; helper: string }> = [
  { value: 'gold', label: 'Gold', helper: 'XAUUSD' },
  { value: 'indices', label: 'Indices', helper: 'US30, NAS100' },
  { value: 'forex', label: 'Forex pairs', helper: 'Major and minor FX pairs' },
];

export default function AutoTraderControls() {
  const { user, token, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AutoTradeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isVip = user?.subscription === 'VIP_AUTO_TRADER';
  const controlsLocked = !isVip || authLoading;

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!token || !isVip) {
      setLoading(false);
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.autoTrading.getSettings(token);
        if (!cancelled && response.settings) {
          setSettings(response.settings);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || 'Failed to load smart trade controls.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [token, isVip]);

  const updateArray = <T extends AllowedTradingSession | AllowedTradingAsset>(
    key: 'allowedSessions' | 'allowedAssets',
    value: T,
  ) => {
    setSettings((current) => {
      const values = current[key] as T[];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return {
        ...current,
        [key]: nextValues,
      };
    });
  };

  const saveSettings = async () => {
    if (!token || controlsLocked) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.autoTrading.updateSettings({
        strategyMode: settings.strategyMode,
        personality: settings.personality,
        minConfidence: settings.minConfidence,
        allowedSessions: settings.allowedSessions,
        allowedAssets: settings.allowedAssets,
        autoPauseEnabled: settings.autoPauseEnabled,
        maxLossesInRow: settings.maxLossesInRow,
      }, token);
      setSettings(response.settings);
      setToast('Settings updated');
    } catch (saveError: any) {
      setError(saveError?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100 shadow-lg backdrop-blur">
          {toast}
        </div>
      )}

      {!isVip && (
        <Card className="border-amber-500/25 bg-amber-500/10">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Crown className="mt-0.5 h-5 w-5 text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-amber-100">Upgrade to access advanced trading controls</p>
                <p className="text-xs text-amber-100/80">Advanced strategy filters, personality tuning, and auto-pause protection are available on the VIP Auto Trader plan.</p>
              </div>
            </div>
            <Link href="/checkout?plan=VIP_AUTO_TRADER">
              <Button variant="gradient">Upgrade to VIP Auto Trader</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/25 bg-red-500/10">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-red-100">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      <div className={controlsLocked ? 'pointer-events-none opacity-55' : ''}>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="space-y-8 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Smart Trade Control System</h2>
                <p className="text-sm text-muted-foreground">Tune execution behavior without touching the execution engine directly.</p>
              </div>
            </div>

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Strategy Mode</p>
                <p className="text-xs text-muted-foreground">Pick the execution profile the auto trader should follow.</p>
              </div>
              <select
                value={settings.strategyMode}
                onChange={(event) => setSettings((current) => ({ ...current, strategyMode: event.target.value as StrategyMode }))}
                disabled={controlsLocked}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
              >
                <option value="standard">Standard Trading</option>
                <option value="gold_scalper">Gold Scalper</option>
              </select>
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Trading Personality</p>
                <p className="text-xs text-muted-foreground">Set the system bias between patience and trade frequency.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {(Object.keys(PERSONALITY_COPY) as TradingPersonality[]).map((personality) => {
                  const active = settings.personality === personality;
                  return (
                    <button
                      key={personality}
                      type="button"
                      disabled={controlsLocked}
                      onClick={() => setSettings((current) => ({ ...current, personality }))}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? PERSONALITY_COPY[personality].className
                          : 'border-white/10 bg-white/[0.02] text-foreground hover:border-white/20'
                      }`}
                    >
                      <p className="text-sm font-semibold">{PERSONALITY_COPY[personality].title}</p>
                      <p className="mt-1 text-xs opacity-80">{PERSONALITY_COPY[personality].description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Confidence Lock</p>
                  <p className="text-xs text-muted-foreground">Only take trades above this confidence level.</p>
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {settings.minConfidence}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={settings.minConfidence}
                disabled={controlsLocked}
                onChange={(event) => setSettings((current) => ({ ...current, minConfidence: Number(event.target.value) }))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
              />
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Session Control</p>
                <p className="text-xs text-muted-foreground">Limit execution to the market windows you actually trade.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {([
                  { value: 'london', label: 'London' },
                  { value: 'newyork', label: 'New York' },
                ] as Array<{ value: AllowedTradingSession; label: string }>).map((session) => {
                  const active = settings.allowedSessions.includes(session.value);
                  return (
                    <button
                      key={session.value}
                      type="button"
                      disabled={controlsLocked}
                      onClick={() => updateArray('allowedSessions', session.value)}
                      className={`rounded-xl border px-4 py-2 text-sm transition-all ${
                        active
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground'
                      }`}
                    >
                      {session.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Asset Selection</p>
                <p className="text-xs text-muted-foreground">Choose which market buckets the auto trader is allowed to execute.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {ASSET_OPTIONS.map((asset) => {
                  const checked = settings.allowedAssets.includes(asset.value);
                  return (
                    <label
                      key={asset.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                        checked ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={controlsLocked}
                        onChange={() => updateArray('allowedAssets', asset.value)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{asset.label}</p>
                        <p className="text-xs text-muted-foreground">{asset.helper}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Auto Pause Protection</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Pause trading after consecutive losses.</p>
                </div>
                <button
                  type="button"
                  disabled={controlsLocked}
                  onClick={() => setSettings((current) => ({ ...current, autoPauseEnabled: !current.autoPauseEnabled }))}
                  className={`relative h-7 w-14 rounded-full border transition-all ${
                    settings.autoPauseEnabled ? 'border-primary/40 bg-primary/25' : 'border-white/10 bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                      settings.autoPauseEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {settings.autoPauseEnabled && (
                <div className="max-w-xs space-y-2">
                  <label className="text-xs text-muted-foreground">Max losses before pause</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.maxLossesInRow}
                    disabled={controlsLocked}
                    onChange={(event) => setSettings((current) => ({ ...current, maxLossesInRow: Number(event.target.value) || 1 }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none transition focus:border-primary/40"
                  />
                </div>
              )}
            </section>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">These controls are saved to your trading profile and applied before every auto-trader execution.</p>
              <Button onClick={saveSettings} disabled={controlsLocked || saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}