'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Crown, Loader2, Lock, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Props {
  analysisId: string;
  className?: string;
  label?: string;
}

export default function TrackSetupButton({ analysisId, className, label = 'Track on Radar' }: Props) {
  const { user, token } = useAuth();
  const isUnlocked = user?.subscription === 'TOP_TIER' || user?.subscription === 'VIP_AUTO_TRADER';
  const [state, setState] = useState<'idle' | 'loading' | 'tracked' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!isUnlocked) {
    return (
      <div className={`relative ${className ?? ''}`}>
        <Button
          size="sm"
          className="gap-1.5 border border-white/10 bg-white/5 text-gray-500 opacity-70"
          onClick={() => setShowUpgrade(true)}
        >
          <Lock className="h-3.5 w-3.5" />
          {label}
        </Button>
        {showUpgrade ? (
          <div className="absolute right-0 top-full z-20 mt-2 w-64 space-y-3 rounded-xl border border-white/10 bg-[#0a0a0f] p-4 shadow-xl">
            <p className="text-xs text-gray-400">
              Trade Radar live tracking requires a <span className="font-semibold text-violet-400">Pro+</span> plan.
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/billing">
                <Button size="sm" className="gap-1.5 bg-violet-600 text-xs text-white hover:bg-violet-500">
                  <Crown className="h-3 w-3" />
                  Upgrade
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={() => setShowUpgrade(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const handleTrack = async () => {
    if (state === 'tracked' || state === 'loading' || !token) return;
    setState('loading');
    setErrorMsg('');
    try {
      await api.radar.add(analysisId, token);
      setState('tracked');
    } catch (err: any) {
      const message = err?.message || 'Failed to track';
      setErrorMsg(message);
      setState('error');
      window.setTimeout(() => setState('idle'), 3000);
    }
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <Button
        size="sm"
        onClick={handleTrack}
        disabled={state === 'loading' || state === 'tracked'}
        className={`gap-1.5 text-xs transition-all ${
          state === 'tracked'
            ? 'border border-green-500/30 bg-green-600/20 text-green-400'
            : state === 'error'
              ? 'border border-red-500/30 bg-red-600/20 text-red-400'
              : 'border border-violet-500/30 bg-violet-600/20 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.15)] hover:bg-violet-600/30'
        }`}
      >
        {state === 'loading' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state === 'tracked' ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Radar className="h-3.5 w-3.5" />
        )}
        {state === 'tracked' ? 'On Radar' : state === 'error' ? 'Failed' : label}
      </Button>
      {state === 'error' && errorMsg ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-red-500/20 bg-red-500/10 p-2">
          <p className="text-[10px] text-red-400">{errorMsg}</p>
        </div>
      ) : null}
    </div>
  );
}
