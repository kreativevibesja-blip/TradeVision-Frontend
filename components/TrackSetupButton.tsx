'use client';

import { useState } from 'react';
import { Radar, Lock, Crown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Props {
  analysisId: string;
  className?: string;
}

export default function TrackSetupButton({ analysisId, className }: Props) {
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
          className="gap-1.5 bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed opacity-70"
          onClick={() => setShowUpgrade(true)}
        >
          <Lock className="h-3.5 w-3.5" />
          Track Setup
        </Button>
        {showUpgrade && (
          <div className="absolute z-20 top-full mt-2 right-0 w-64 rounded-xl bg-[#0a0a0f] border border-white/10 shadow-xl p-4 space-y-3">
            <p className="text-xs text-gray-400">
              Trade Radar requires a <span className="text-violet-400 font-semibold">Pro+</span> plan.
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/billing">
                <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs">
                  <Crown className="h-3 w-3" />
                  Upgrade
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={() => setShowUpgrade(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
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
      const msg = err?.message || 'Failed to track';
      setErrorMsg(msg);
      setState('error');
      setTimeout(() => setState('idle'), 3000);
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
            ? 'bg-green-600/20 text-green-400 border border-green-500/30'
            : state === 'error'
            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
            : 'bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
        }`}
      >
        {state === 'loading' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state === 'tracked' ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Radar className="h-3.5 w-3.5" />
        )}
        {state === 'tracked' ? 'On Radar' : state === 'error' ? 'Failed' : 'Track Setup'}
      </Button>
      {state === 'error' && errorMsg && (
        <div className="absolute z-20 top-full mt-1 right-0 w-56 rounded-lg bg-red-500/10 border border-red-500/20 p-2">
          <p className="text-[10px] text-red-400">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
