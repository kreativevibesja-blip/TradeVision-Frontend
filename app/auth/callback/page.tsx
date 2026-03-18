'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { missingSupabaseEnvMessage, supabase } from '@/lib/supabase';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      if (!supabase) {
        throw new Error(missingSupabaseEnvMessage);
      }

      await supabase.auth.exchangeCodeForSession(window.location.href);
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
