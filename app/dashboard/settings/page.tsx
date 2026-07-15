'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Loader2, Save, X } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { useAuth } from '@/hooks/useAuth';
import { VerifiedBadge, isVerifiedTrader } from '@/components/VerifiedBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/lib/supabase/client';

type ProfileRow = {
  id?: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  markets_traded: string[];
  hide_performance_stats: boolean;
};

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const AI_ENTRY_STYLE_KEY = 'tradevision:ai-entry-style';
type AiEntryStyle = 'conservative' | 'balanced' | 'institutional';

export default function SettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [markets, setMarkets] = useState('');
  const [hideStats, setHideStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [entryStyle, setEntryStyle] = useState<AiEntryStyle>('conservative');
  const isProPlus = user?.subscription === 'TOP_TIER' || user?.subscription === 'VIP_AUTO_TRADER';

  useEffect(() => {
    if (!user) return;

    setDisplayName(user.name || user.email.split('@')[0] || '');
    setEmail(user.email || '');
    const storedStyle = window.localStorage.getItem(AI_ENTRY_STYLE_KEY);
    if (storedStyle === 'conservative' || storedStyle === 'balanced' || storedStyle === 'institutional') {
      setEntryStyle(storedStyle);
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    const supabaseClient = supabase;
    let active = true;
    const loadProfile = async () => {
      const { data } = await supabaseClient
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, bio, markets_traded, hide_performance_stats')
        .eq('user_id', user.id)
        .maybeSingle();

        if (!active) return;
        const profile = data as ProfileRow | null;
        if (profile) {
          setDisplayName(profile.display_name || user.name || user.email.split('@')[0] || '');
          setAvatarUrl(profile.avatar_url);
          setBio(profile.bio || '');
          setMarkets((profile.markets_traded || []).join(', '));
          setHideStats(Boolean(profile.hide_performance_stats));
        }
      if (active) setLoading(false);
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const chooseEntryStyle = (style: AiEntryStyle) => {
    if (style === 'institutional' && !isProPlus) return;
    setEntryStyle(style);
    window.localStorage.setItem(AI_ENTRY_STYLE_KEY, style);
  };

  const handleAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }
    if (file.size > 1_500_000) {
      setMessage('Profile photo must be under 1.5 MB.');
      return;
    }
    setAvatarUrl(await fileToDataUrl(file));
    setMessage('');
  };

  const saveProfile = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    setMessage('');

    const cleanName = displayName.trim() || user.email.split('@')[0] || 'Trader';
    const marketList = markets
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: cleanName,
      avatar_url: avatarUrl,
      bio: bio.trim() || null,
      markets_traded: marketList,
      hide_performance_stats: hideStats,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    setSaving(false);
    setMessage(error ? error.message : 'Profile saved.');
  };

  const visibleName = displayName.trim() || user?.name || user?.email?.split('@')[0] || 'Trader';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Edit Profile" subtitle="Manage your public trader profile, avatar, bio, markets, privacy, and notification preferences." />
      <CleanCard>
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-[#F7F9FC] p-4 sm:flex-row sm:items-center">
          <UserAvatar name={visibleName} avatarUrl={avatarUrl} className="h-20 w-20 text-2xl font-extrabold" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-xl font-extrabold text-[#111827]">{visibleName}</p>
              <VerifiedBadge subscription={user?.subscription} />
            </div>
            {isVerifiedTrader(user?.subscription) ? <p className="text-xs font-bold text-[#2563EB]">Verified trader</p> : null}
            <p className="mt-1 text-sm text-[#6B7280]">{email}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => void handleAvatar(event.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <CleanButton variant="secondary" onClick={() => fileInputRef.current?.click()}><Camera className="h-4 w-4" />Photo</CleanButton>
            {avatarUrl ? <CleanButton variant="ghost" onClick={() => setAvatarUrl(null)}><X className="h-4 w-4" />Remove</CleanButton> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="h-11 w-full rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Display name" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Email</span>
            <input value={email} disabled className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F7F9FC] px-4 text-sm text-[#6B7280] outline-none" placeholder="Email" />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Markets traded</span>
            <input value={markets} onChange={(event) => setMarkets(event.target.value)} className="h-11 w-full rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Forex, Gold, Crypto..." />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Bio</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} className="min-h-32 w-full resize-none rounded-xl border border-[#E5E7EB] p-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Write what traders should know about you..." />
          </label>
        </div>
        <div className="mt-5 space-y-3">
          <label className="flex items-center gap-3 text-sm font-semibold text-[#4B5563]">
            <input checked={hideStats} onChange={(event) => setHideStats(event.target.checked)} type="checkbox" className="h-4 w-4 accent-[#2563EB]" />
            Hide performance stats from public profile
          </label>
          {['Email me event reminders', 'Notify me when radar setups approach entry'].map((label) => (
            <label key={label} className="flex items-center gap-3 text-sm font-semibold text-[#4B5563]">
              <input type="checkbox" className="h-4 w-4 accent-[#2563EB]" />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <CleanButton onClick={saveProfile} className={saving || loading ? 'pointer-events-none opacity-60' : ''}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </CleanButton>
          {message ? <p className="text-sm font-semibold text-[#2563EB]">{message}</p> : null}
        </div>
      </CleanCard>

      <CleanCard className="mt-6">
        <div className="mb-5">
          <p className="text-lg font-extrabold text-[#111827]">AI Entry Style</p>
          <p className="mt-1 text-sm text-[#6B7280]">Choose how much confirmation Orion should seek before presenting an entry. This changes the analysis objective, not its independent market reasoning.</p>
        </div>
        <div className="space-y-3">
          {([
            ['conservative', 'Conservative', 'Maximum confirmation. Built for protecting capital first.'],
            ['balanced', 'Balanced', 'Earlier high-quality opportunities with measured confirmation.'],
          ] as const).map(([value, label, description]) => (
            <button key={value} type="button" onClick={() => chooseEntryStyle(value)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${entryStyle === value ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E5E7EB] hover:border-[#93C5FD]'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${entryStyle === value ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#9CA3AF]'}`}>{entryStyle === value ? <span className="h-2 w-2 rounded-full bg-white" /> : null}</span>
              <span><span className="block font-extrabold text-[#111827]">{label}</span><span className="mt-0.5 block text-sm text-[#6B7280]">{description}</span></span>
            </button>
          ))}
          {isProPlus ? (
            <button type="button" onClick={() => chooseEntryStyle('institutional')} className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition ${entryStyle === 'institutional' ? 'border-[#2563EB] bg-[#EFF6FF] shadow-[0_0_28px_rgba(37,99,235,0.20)]' : 'border-[#BFDBFE] hover:border-[#60A5FA]'}`}>
              <span className="absolute inset-0 animate-pulse bg-blue-400/5" />
              <span className={`relative flex h-5 w-5 items-center justify-center rounded-full border ${entryStyle === 'institutional' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#9CA3AF]'}`}>{entryStyle === 'institutional' ? <span className="h-2 w-2 rounded-full bg-white" /> : null}</span>
              <span className="relative"><span className="font-extrabold text-[#111827]">⚡ Institutional <span className="ml-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] text-[#92400E]">PRO+</span></span><span className="mt-0.5 block text-sm text-[#6B7280]">Earlier opportunities informed by advanced market behaviour, with transparent risk.</span></span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-4">
              <div><p className="font-extrabold text-[#4B5563]">🔒 Institutional <span className="ml-1 text-xs font-bold text-[#2563EB]">Pro+ Exclusive</span></p><p className="mt-1 text-sm text-[#6B7280]">Upgrade to Pro+ to unlock Institutional AI Entries.</p></div>
              <Link href="/pricing" className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]">Upgrade</Link>
            </div>
          )}
        </div>
      </CleanCard>
    </div>
  );
}
