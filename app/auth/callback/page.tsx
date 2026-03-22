'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { missingSupabaseEnvMessage, supabase } from '@/lib/supabase';
import { getReferralCode, clearReferralCode } from '@/components/ReferralCapture';
import { api } from '@/lib/api';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      if (!supabase) {
        throw new Error(missingSupabaseEnvMessage);
      }

      const result = await supabase.auth.exchangeCodeForSession(window.location.href);

      // Apply stored referral code for new Google sign-ups
      const accessToken = result.data?.session?.access_token;
      if (accessToken) {
        const code = getReferralCode();
        if (code) {
          try {
            await api.referral.applyCode(code, accessToken);
          } catch { /* silent */ }
          clearReferralCode();
        }
      }

      router.push('/dashboard');
    };

    handleLogin().catch(() => {
      router.push('/');
    });
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-lg text-muted-foreground">Signing you in...</p>
    </div>
  );
}
