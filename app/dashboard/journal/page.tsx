'use client';

import { useRef, useState } from 'react';
import { Brain, ImagePlus, Loader2, Save } from 'lucide-react';
import { CleanButton, CleanCard, CleanStatCard, PageHeader } from '@/components/CleanBlue';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function JournalPage() {
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [outcome, setOutcome] = useState('Win');
  const [symbol, setSymbol] = useState('');
  const [session, setSession] = useState('');
  const [rr, setRr] = useState('');
  const [emotions, setEmotions] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const saveEntry = async () => {
    if (!supabase || !user || !symbol.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');

    let chartUrl: string | null = null;
    if (attachment) {
      try {
        const uploaded = await api.uploadAttachment(attachment, 'journal');
        chartUrl = uploaded.imageUrl;
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Attachment upload failed.');
        setSaving(false);
        return;
      }
    }

    const parsedRr = rr.trim() ? Number(rr.replace(/^[^0-9.-]+/, '').replace(':', '')) : null;
    const { error: saveError } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      symbol: symbol.trim(),
      session: session.trim() || null,
      outcome: outcome.toLowerCase(),
      rr: Number.isFinite(parsedRr) ? parsedRr : null,
      emotions: emotions.split(',').map((item) => item.trim()).filter(Boolean),
      chart_url: chartUrl,
      notes: notes.trim() || null,
    });

    if (saveError) {
      setError(saveError.message);
    } else {
      setSymbol('');
      setSession('');
      setRr('');
      setEmotions('');
      setNotes('');
      setAttachment(null);
      setOutcome('Win');
      setSuccess('Journal entry saved.');
    }

    setSaving(false);
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Journal" subtitle="Sign in to log trades, screenshots, outcomes, and Orion consistency insights." />
        <CleanCard><p className="text-sm text-[#6B7280]">Your session is required before journal entries can be saved.</p></CleanCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Journal" subtitle="Log trades, emotions, screenshots, outcomes, RR, and Orion consistency insights." />
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <CleanStatCard label="Consistency Score" value="78%" trend="+6% this week" icon={<Brain className="h-5 w-5" />} />
        <CleanStatCard label="Best Session" value="London" />
        <CleanStatCard label="Common Mistake" value="Early Entry" />
        <CleanStatCard label="Risk Quality" value="B+" trend="Improving" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <CleanCard>
          <h2 className="mb-4 font-extrabold text-[#111827]">New journal entry</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Market / Symbol" />
            <input value={session} onChange={(event) => setSession(event.target.value)} className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Session" />
            <input value={rr} onChange={(event) => setRr(event.target.value)} className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="RR, e.g. 2.5" />
            <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]">
              {['Win', 'Loss', 'Breakeven', 'Open'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input value={emotions} onChange={(event) => setEmotions(event.target.value)} className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB] sm:col-span-2" placeholder="Emotion tags: patient, anxious, confident..." />
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-36 rounded-xl border border-[#E5E7EB] p-4 text-sm outline-none focus:border-[#2563EB] sm:col-span-2" placeholder="Notes and lessons..." />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
          />
          {attachment ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1D4ED8]">
              <span className="min-w-0 truncate">{attachment.name}</span>
              <button type="button" onClick={() => setAttachment(null)} className="font-extrabold text-[#2563EB]">Remove</button>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <CleanButton variant="secondary" onClick={() => fileInputRef.current?.click()}><ImagePlus className="h-4 w-4" />Attach chart</CleanButton>
            <CleanButton onClick={saveEntry} className={!symbol.trim() || saving ? 'pointer-events-none opacity-60' : ''}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Entry
            </CleanButton>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-[#EF4444]">{error}</p> : null}
          {success ? <p className="mt-3 text-sm font-semibold text-[#16A34A]">{success}</p> : null}
        </CleanCard>
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">Orion Insights</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#4B5563]">
            <p>Best results are coming from London-session continuation trades.</p>
            <p>Overtrading warning: 3 trades were opened within 25 minutes last week.</p>
            <p>Risk quality improves when entries are taken after confirmation instead of first touch.</p>
          </div>
        </CleanCard>
      </div>
    </div>
  );
}
