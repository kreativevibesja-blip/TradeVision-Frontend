'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { platformThemes, PLATFORM_THEME_SETTING_KEY, type PlatformTheme } from '@/lib/theme';
import { useThemeStore } from '@/stores/theme-store';
import { Settings, Save, Loader2, Palette } from 'lucide-react';

type ScannerStrategyToggleKey =
  | 'trendPullback'
  | 'countertrendReversal'
  | 'fvgContinuation'
  | 'emaReclaim'
  | 'equalLevelSweep'
  | 'poiReclaim'
  | 'rangeRejection'
  | 'zoneTap'
  | 'sessionFlip';

type FindTradeCategoryToggleKey = 'forex' | 'indices' | 'commodities' | 'crypto' | 'deriv' | 'volatility';

const DEFAULT_SCANNER_STRATEGIES: Record<ScannerStrategyToggleKey, boolean> = {
  trendPullback: false,
  countertrendReversal: false,
  fvgContinuation: false,
  emaReclaim: true,
  equalLevelSweep: false,
  poiReclaim: false,
  rangeRejection: false,
  zoneTap: false,
  sessionFlip: false,
};

const SCANNER_STRATEGY_LABELS: Array<{ key: ScannerStrategyToggleKey; title: string; detail: string }> = [
  { key: 'trendPullback', title: 'Trend Pullback', detail: 'Continuation pullbacks aligned with structure and trend flow.' },
  { key: 'countertrendReversal', title: 'Countertrend Reversal', detail: 'Reversal setups from supply or demand against the broader move.' },
  { key: 'fvgContinuation', title: 'FVG Continuation', detail: 'Fair value gap fill continuations that resume directional flow.' },
  { key: 'emaReclaim', title: 'GoldX SMC EMA', detail: 'GoldX SMC-style EMA reclaim continuation using the 9/14/50 stack.' },
  { key: 'equalLevelSweep', title: 'Equal-Level Sweep', detail: 'EQH or EQL liquidity sweep reversals.' },
  { key: 'poiReclaim', title: 'POI Reclaim', detail: 'Point-of-interest reclaim setups after reaction.' },
  { key: 'rangeRejection', title: 'Range Rejection', detail: 'Support and resistance range rotations.' },
  { key: 'zoneTap', title: 'Zone Tap', detail: 'Basic directional zone pullback taps.' },
  { key: 'sessionFlip', title: 'Session Flip', detail: 'London and New York continuation flip engine.' },
];

const FIND_TRADE_CATEGORY_SETTINGS: Array<{ key: FindTradeCategoryToggleKey; title: string; detail: string; settingKey: string }> = [
  { key: 'forex', title: 'Forex', detail: 'Major and cross FX pairs for manual on-demand scans.', settingKey: 'find_trade_category_forex_enabled' },
  { key: 'indices', title: 'Indices', detail: 'US and global equity indices for session-led momentum scans.', settingKey: 'find_trade_category_indices_enabled' },
  { key: 'commodities', title: 'Commodities', detail: 'Gold, silver, and energy contracts.', settingKey: 'find_trade_category_commodities_enabled' },
  { key: 'crypto', title: 'Crypto', detail: 'High-liquidity crypto pairs for discretionary scan windows.', settingKey: 'find_trade_category_crypto_enabled' },
  { key: 'deriv', title: 'Deriv Synthetics', detail: 'Jump, step, and boom/crash synthetic markets.', settingKey: 'find_trade_category_deriv_enabled' },
  { key: 'volatility', title: 'Volatility Indices', detail: 'Deriv volatility and 1-second volatility feeds.', settingKey: 'find_trade_category_volatility_enabled' },
];

const DEFAULT_FIND_TRADE_CATEGORIES: Record<FindTradeCategoryToggleKey, boolean> = {
  forex: true,
  indices: true,
  commodities: true,
  crypto: true,
  deriv: true,
  volatility: true,
};

export default function AdminSettingsPage() {
  const { token } = useAuth();
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
  const [scannerUseEmaFilter, setScannerUseEmaFilter] = useState(true);
  const [scannerFastEma, setScannerFastEma] = useState('9');
  const [scannerMidEma, setScannerMidEma] = useState('14');
  const [scannerSlowEma, setScannerSlowEma] = useState('50');
  const [scannerPullbackTolerance, setScannerPullbackTolerance] = useState('0.12');
  const [scannerStrategies, setScannerStrategies] = useState<Record<ScannerStrategyToggleKey, boolean>>(DEFAULT_SCANNER_STRATEGIES);
  const [findTradeCategories, setFindTradeCategories] = useState<Record<FindTradeCategoryToggleKey, boolean>>(DEFAULT_FIND_TRADE_CATEGORIES);
  const [announcementPopupsEnabled, setAnnouncementPopupsEnabled] = useState(true);
  const [announcementPopupRepeatHours, setAnnouncementPopupRepeatHours] = useState('24');
  const [platformTheme, setPlatformTheme] = useState<PlatformTheme>('goldx-premium');
  const setActiveTheme = useThemeStore((state) => state.setActiveTheme);

  useEffect(() => {
    if (token) loadSettings();
  }, [token]);

  const loadSettings = async () => {
    try {
      const data = await api.admin.getSettings(token!);
      const prompt = data.settings.find((s: any) => s.key === 'ai_prompt');
      const free = data.settings.find((s: any) => s.key === 'free_daily_limit');
      const pro = data.settings.find((s: any) => s.key === 'pro_daily_limit');
      const freeMarkup = data.settings.find((s: any) => s.key === 'chart_markup_free_enabled');
      const proMarkup = data.settings.find((s: any) => s.key === 'chart_markup_pro_enabled');
      const freeGemini = data.settings.find((s: any) => s.key === 'ai_model_gemini_free_enabled');
      const freeOpenAi = data.settings.find((s: any) => s.key === 'ai_model_openai_free_enabled');
      const proGemini = data.settings.find((s: any) => s.key === 'ai_model_gemini_pro_enabled');
      const proOpenAi = data.settings.find((s: any) => s.key === 'ai_model_openai_pro_enabled');
      const scannerUseEma = data.settings.find((s: any) => s.key === 'scanner_execution_use_ema_filter');
      const scannerFast = data.settings.find((s: any) => s.key === 'scanner_execution_fast_ema_period');
      const scannerMid = data.settings.find((s: any) => s.key === 'scanner_execution_mid_ema_period');
      const scannerSlow = data.settings.find((s: any) => s.key === 'scanner_execution_slow_ema_period');
      const scannerTolerance = data.settings.find((s: any) => s.key === 'scanner_execution_pullback_tolerance_pct');
      const scannerEnabledStrategies = data.settings.find((s: any) => s.key === 'scanner_enabled_strategies');
      const nextFindTradeCategories = { ...DEFAULT_FIND_TRADE_CATEGORIES };
      const announcementPopups = data.settings.find((s: any) => s.key === 'announcement_popups_enabled');
      const announcementPopupRepeat = data.settings.find((s: any) => s.key === 'announcement_popup_repeat_hours');
      const activeTheme = data.settings.find((s: any) => s.key === PLATFORM_THEME_SETTING_KEY);
      if (prompt) setAiPrompt(prompt.value);
      if (free) setFreeLimit(String(free.value));
      if (pro) setProLimit(String(pro.value));
      if (freeMarkup) setFreeMarkupEnabled(Boolean(freeMarkup.value));
      if (proMarkup) setProMarkupEnabled(Boolean(proMarkup.value));
      if (freeGemini) setFreeGeminiEnabled(Boolean(freeGemini.value));
      if (freeOpenAi) setFreeOpenAiEnabled(Boolean(freeOpenAi.value));
      if (proGemini) setProGeminiEnabled(Boolean(proGemini.value));
      if (proOpenAi) setProOpenAiEnabled(Boolean(proOpenAi.value));
      const nextScannerUseEma = scannerUseEma ? Boolean(scannerUseEma.value) : true;
      const nextScannerFastEma = scannerFast?.value != null ? String(scannerFast.value) : '9';
      const nextScannerMidEma = scannerMid?.value != null ? String(scannerMid.value) : '14';
      const nextScannerSlowEma = scannerSlow?.value != null ? String(scannerSlow.value) : '50';
      const nextScannerTolerance = scannerTolerance?.value != null ? String(scannerTolerance.value) : '0.12';
      const nextScannerStrategies = scannerEnabledStrategies?.value && typeof scannerEnabledStrategies.value === 'object'
        ? { ...DEFAULT_SCANNER_STRATEGIES, ...scannerEnabledStrategies.value }
        : DEFAULT_SCANNER_STRATEGIES;
      setScannerUseEmaFilter(nextScannerUseEma);
      setScannerFastEma(nextScannerFastEma);
      setScannerMidEma(nextScannerMidEma);
      setScannerSlowEma(nextScannerSlowEma);
      setScannerPullbackTolerance(nextScannerTolerance);
      setScannerStrategies(nextScannerStrategies);
      FIND_TRADE_CATEGORY_SETTINGS.forEach((item) => {
        const setting = data.settings.find((s: any) => s.key === item.settingKey);
        if (setting) {
          nextFindTradeCategories[item.key] = Boolean(setting.value);
        }
      });
      setFindTradeCategories(nextFindTradeCategories);
      if (announcementPopups) setAnnouncementPopupsEnabled(Boolean(announcementPopups.value));
      if (announcementPopupRepeat?.value != null) setAnnouncementPopupRepeatHours(String(announcementPopupRepeat.value));
      if (activeTheme?.value === 'legacy' || activeTheme?.value === 'goldx-premium') setPlatformTheme(activeTheme.value);
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="premium-panel premium-noise overflow-hidden p-6 sm:p-8">
        <div className="ambient-orb -left-10 top-0 h-36 w-36 opacity-60" />
        <div className="ambient-orb bottom-0 right-0 h-44 w-44 opacity-40" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="premium-kicker mb-4">Platform Controls</div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-[-0.05em] text-white sm:text-4xl">System Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">Update premium appearance, AI behavior, support channels, scanner execution rules, and platform-wide operating defaults without restarting the app.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="mobile-card rounded-[22px] p-4">
              <div className="metric-label">Theme</div>
              <div className="mt-2 text-sm font-semibold text-[var(--gold-light)]">{platformTheme}</div>
            </div>
            <div className="mobile-card rounded-[22px] p-4">
              <div className="metric-label">Popup cadence</div>
              <div className="mt-2 text-sm font-semibold text-white">{announcementPopupRepeatHours} hrs</div>
            </div>
            <div className="mobile-card rounded-[22px] p-4">
              <div className="metric-label">EMA filter</div>
              <div className="mt-2 text-sm font-semibold text-cyan-100">{scannerUseEmaFilter ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {platformThemes.map((theme) => {
                const selected = platformTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setPlatformTheme(theme.id)}
                    className={`rounded-[24px] border p-5 text-left transition-all ${selected ? 'border-[rgba(255,223,112,0.34)] bg-[rgba(255,223,112,0.08)] shadow-neon' : 'border-white/10 bg-white/[0.03] hover:border-[rgba(255,223,112,0.18)] hover:bg-white/[0.05]'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{theme.label}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{theme.description}</p>
                      </div>
                      <div className={`h-4 w-4 rounded-full border ${selected ? 'border-[var(--gold-light)] bg-[var(--gold-light)] shadow-neon' : 'border-white/20'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="premium-panel-muted p-4 text-sm text-muted-foreground">
              Admin theme changes are broadcast through live state sync. Active users will update to the selected theme as the shared platform setting changes.
            </div>
            <Button
              size="sm"
              onClick={async () => {
                await saveSetting(PLATFORM_THEME_SETTING_KEY, platformTheme);
                setActiveTheme(platformTheme);
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Platform Theme
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg">Announcement Popups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="premium-panel-muted space-y-3 p-4">
                <div>
                  <label className="text-sm text-muted-foreground">Global popup switch</label>
                  <p className="mt-1 text-xs text-muted-foreground">Turn all active platform popups on or off for users without deleting the update itself.</p>
                </div>
                <Button
                  type="button"
                  variant={announcementPopupsEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAnnouncementPopupsEnabled((current) => !current)}
                >
                  {announcementPopupsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="premium-panel-muted space-y-3 p-4">
                <div>
                  <label className="text-sm text-muted-foreground">Repeat every hours</label>
                  <p className="mt-1 text-xs text-muted-foreground">Controls how long after dismissal the same popup can appear again for the same user.</p>
                </div>
                <Input
                  className="premium-input"
                  value={announcementPopupRepeatHours}
                  onChange={(e) => setAnnouncementPopupRepeatHours(e.target.value)}
                  type="number"
                  min="1"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                const repeatHours = Math.max(1, Number.parseInt(announcementPopupRepeatHours, 10) || 24);
                await saveSetting('announcement_popups_enabled', announcementPopupsEnabled);
                await saveSetting('announcement_popup_repeat_hours', repeatHours);
                setAnnouncementPopupRepeatHours(String(repeatHours));
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Popup Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
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
                className="premium-input mt-1 min-h-32 w-full resize-none"
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

        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg">Scanner Execution Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="premium-panel-muted space-y-4 p-4">
              <div>
                <label className="text-sm text-muted-foreground">EMA execution filter</label>
                <p className="mt-1 text-xs text-muted-foreground">Scanner executions must match the same EMA 9/14/50 pullback and reclaim filter used for GoldX SMC behavior.</p>
              </div>
              <Button type="button" variant={scannerUseEmaFilter ? 'default' : 'outline'} size="sm" onClick={() => setScannerUseEmaFilter((current) => !current)}>
                EMA Filter {scannerUseEmaFilter ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm text-muted-foreground">Fast EMA</label>
                <Input className="premium-input" value={scannerFastEma} onChange={(e) => setScannerFastEma(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Mid EMA</label>
                <Input className="premium-input" value={scannerMidEma} onChange={(e) => setScannerMidEma(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Slow EMA</label>
                <Input className="premium-input" value={scannerSlowEma} onChange={(e) => setScannerSlowEma(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Pullback tolerance %</label>
                <Input className="premium-input" value={scannerPullbackTolerance} onChange={(e) => setScannerPullbackTolerance(e.target.value)} type="number" step="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SCANNER_STRATEGY_LABELS.map((item) => (
                <div key={item.key} className="premium-panel-muted space-y-3 p-4">
                  <div>
                    <label className="text-sm text-muted-foreground">{item.title}</label>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <Button
                    type="button"
                    variant={scannerStrategies[item.key] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScannerStrategies((current) => ({ ...current, [item.key]: !current[item.key] }))}
                  >
                    {scannerStrategies[item.key] ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              onClick={async () => {
                await saveSetting('scanner_execution_use_ema_filter', scannerUseEmaFilter);
                await saveSetting('scanner_execution_fast_ema_period', parseInt(scannerFastEma, 10));
                await saveSetting('scanner_execution_mid_ema_period', parseInt(scannerMidEma, 10));
                await saveSetting('scanner_execution_slow_ema_period', parseInt(scannerSlowEma, 10));
                await saveSetting('scanner_execution_pullback_tolerance_pct', parseFloat(scannerPullbackTolerance));
                await saveSetting('scanner_enabled_strategies', scannerStrategies);
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Scanner Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg">On-Demand Market Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="premium-panel-muted p-4 text-sm text-muted-foreground">
              These toggles decide which market groups are eligible for the on-demand market scan configuration.
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {FIND_TRADE_CATEGORY_SETTINGS.map((item) => (
                <div key={item.key} className="premium-panel-muted space-y-3 p-4">
                  <div>
                    <label className="text-sm text-muted-foreground">{item.title}</label>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <Button
                    type="button"
                    variant={findTradeCategories[item.key] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFindTradeCategories((current) => ({ ...current, [item.key]: !current[item.key] }))}
                  >
                    {findTradeCategories[item.key] ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              onClick={async () => {
                for (const item of FIND_TRADE_CATEGORY_SETTINGS) {
                  await saveSetting(item.settingKey, findTradeCategories[item.key]);
                }
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Market Scope
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg">Daily Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Free Plan Daily Limit</label>
                <Input className="premium-input" value={freeLimit} onChange={(e) => setFreeLimit(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Pro Plan Daily Limit</label>
                <Input className="premium-input" value={proLimit} onChange={(e) => setProLimit(e.target.value)} type="number" />
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

        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg">AI Providers By Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="premium-panel-muted p-4">
              <p className="text-sm text-muted-foreground">When both providers are enabled, Gemini is used first and GPT-5.1 is used as fallback if Gemini fails.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="premium-panel-muted space-y-4 p-4">
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

              <div className="premium-panel-muted space-y-4 p-4">
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

        <Card className="premium-panel premium-noise border-[rgba(255,223,112,0.12)] bg-transparent">
          <CardHeader>
            <CardTitle className="text-lg">Chart Markup By Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="premium-panel-muted space-y-3 p-4">
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

              <div className="premium-panel-muted space-y-3 p-4">
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
