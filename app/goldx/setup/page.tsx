'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { GoldxUserStatus } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  HardDriveDownload,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  Mail,
  Monitor,
  RotateCw,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react';

const SETUP_STEPS = [
  'Download and install MetaTrader 5 if you do not already have it.',
  'Log in to your trading account.',
  'Open MT5 and click File -> Open Data Folder.',
  'Navigate to MQL5 -> Experts.',
  'Paste the GoldX EA file into this folder.',
  'Restart MT5.',
  'Go to Navigator -> Expert Advisors.',
  'Drag GoldX EA onto an XAUUSD chart.',
  'Enable Allow Algo Trading and Allow DLL imports.',
  'Enter your License Key and configure your execution settings inside MT5.',
  'Turn on AutoTrading from the MT5 top bar.',
];

const FAQ_ITEMS = [
  {
    question: 'Do I need coding knowledge?',
    answer: 'No. GoldX is built for MT5 desktop users and installs like a standard Expert Advisor.',
  },
  {
    question: 'How long does setup take?',
    answer: 'Most users finish setup in under 10 minutes if MT5 is already installed.',
  },
  {
    question: 'Can you install it for me?',
    answer: 'Yes. Assisted setup is optional and handled through a separate request workflow with no credential collection on the dashboard itself.',
  },
  {
    question: 'What if my EA file is not available yet?',
    answer: 'Use the assisted setup request and our team can complete provisioning or deliver the file manually.',
  },
];

function getProgressPercent(status: GoldxUserStatus | null): number {
  if (!status) return 0;
  const checks = [
    status.onboardingState.hasDownloadedEa,
    status.onboardingState.hasConnectedMt5,
    status.onboardingState.setupCompleted,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export default function GoldxSetupPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<GoldxUserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [form, setForm] = useState({ mt5Login: '', server: '', email: '', note: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const nextStatus = await api.goldx.getMyStatus(token);
      setStatus(nextStatus);
      setForm((current) => ({
        ...current,
        email: current.email || nextStatus.setupRequest?.email || '',
        server: current.server || nextStatus.setupRequest?.server || '',
      }));
    } catch (err) {
      console.error('Failed to load GoldX setup status:', err);
      setError('Unable to load setup status right now.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = useMemo(() => getProgressPercent(status), [status]);

  const handleDownload = async () => {
    if (!token || downloading) return;
    setDownloading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.goldx.downloadEa(token);
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      setSuccess('EA download prepared. Complete the installation steps below in MT5.');
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'EA download is not available right now.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestSetup = async () => {
    if (!token || requesting) return;
    if (!form.mt5Login.trim() || !form.server.trim() || !form.email.trim()) {
      setError('MT5 login, server name, and email are required.');
      return;
    }

    setRequesting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.goldx.createSetupRequest({
        mt5Login: form.mt5Login,
        server: form.server,
        email: form.email,
        note: form.note,
      }, token);
      setSuccess('Assisted setup requested. Our team will review it within 24 hours.');
      setForm((current) => ({ ...current, note: '' }));
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to submit setup request.');
    } finally {
      setRequesting(false);
    }
  };

  if (!token && !loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold">Sign in to view your GoldX setup guide.</p>
            <p className="mt-2 text-sm text-muted-foreground">Your onboarding progress and assisted setup tools are available after authentication.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="border-white/10 bg-white/5 text-slate-200">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> GoldX Onboarding
            </Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Set Up GoldX EA in Minutes</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Works on MT5 desktop, runs fully automated once installed, and keeps execution controls inside the terminal. Most users finish setup in under 10 minutes.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/goldx">
              <Button variant="outline">Back to GoldX</Button>
            </Link>
            <Button onClick={handleDownload} disabled={downloading || loading}>
              {downloading ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4" />}
              Download GoldX EA
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="mb-6 border-red-500/20 bg-red-500/10">
            <CardContent className="p-4 text-sm text-red-100">{error}</CardContent>
          </Card>
        ) : null}
        {success ? (
          <Card className="mb-6 border-emerald-500/20 bg-emerald-500/10">
            <CardContent className="p-4 text-sm text-emerald-50">{success}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_35%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" /> Intro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>GoldX installs directly into MetaTrader 5 on desktop and starts operating automatically once your chart, license key, and EA settings are configured in MT5.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    'MT5 Desktop required',
                    'Automated after installation',
                    'No coding needed',
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs font-medium text-white">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Step-by-step guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {SETUP_STEPS.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-200">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" /> Download / Request EA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Self setup is recommended. Download the EA, place it in the MT5 Experts folder, and finish the checklist above. Use MT5 to set lot sizing, session behavior, and execution preferences.</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleDownload} disabled={downloading || loading}>
                    {downloading ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download GoldX EA
                  </Button>
                  <Link href="#assisted-setup">
                    <Button variant="outline">
                      <LifeBuoy className="mr-2 h-4 w-4" /> Request Assisted Setup
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">If the direct download is not available yet, request assisted setup and we will provision it manually.</p>
              </CardContent>
            </Card>

            <Card id="assisted-setup">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" /> Need Help? We&apos;ll Set It Up For You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4 text-sm text-amber-50">
                  Optional premium service. Done securely. Setup within 24 hours. We never store or misuse your credentials. Access is only used for setup.
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mt5-login">MT5 Login</Label>
                    <Input id="mt5-login" value={form.mt5Login} onChange={(e) => setForm({ ...form, mt5Login: e.target.value })} placeholder="12345678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-name">Server Name</Label>
                    <Input id="server-name" value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} placeholder="Broker-Server-Live" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="setup-email">Email</Label>
                    <Input id="setup-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="setup-note">Optional Note</Label>
                    <textarea
                      id="setup-note"
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Share anything that will help us complete setup faster."
                      className="min-h-28 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/40"
                    />
                  </div>
                </div>
                <Button onClick={handleRequestSetup} disabled={requesting || loading}>
                  {requesting ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Request Assisted Setup
                </Button>
                {status?.setupRequest ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                    Current request status: <span className="font-semibold uppercase">{status.setupRequest.status.replace('_', ' ')}</span>
                    <span className="ml-2 text-muted-foreground">Updated {new Date(status.setupRequest.updatedAt).toLocaleString()}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" /> FAQ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">{item.question}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5" /> Setup progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activation progress</span>
                  <span className="font-semibold text-white">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-white/10" indicatorClassName="bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'EA downloaded', done: status?.onboardingState.hasDownloadedEa ?? false },
                    { label: 'MT5 connected', done: status?.onboardingState.hasConnectedMt5 ?? false },
                    { label: 'First trade executed', done: status?.onboardingState.setupCompleted ?? false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <span>{item.label}</span>
                      <Badge className={item.done ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-slate-200'}>
                        {item.done ? 'Done' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Setup checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">Self setup</p>
                  <p className="mt-2">Recommended for most users. Download the EA, install it inside MT5, verify your license, and let GoldX start trading.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">Assisted setup</p>
                  <p className="mt-2">Need help? We can do it for you. Submit the setup form and our team will respond within 24 hours.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">License reminder</p>
                  <p className="mt-2">Use the license key issued when your GoldX access was provisioned. If you were recently re-granted access, use the newest key shown on your GoldX dashboard.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" /> Quick nudges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Most users finish setup in under 10 minutes.</p>
                <p>Need help? We can do it for you.</p>
                <a href="https://www.metatrader5.com/en/download" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200">
                  Download MetaTrader 5 <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}