'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      router.push('/dashboard');
    };

    handleLogin();
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-lg text-muted-foreground">Signing you in...</p>
    </div>
  );
}
