'use client';

import { useState, useEffect, useRef } from 'react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function FeedbackTrigger() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!user || !supabase || checked.current) return;
    checked.current = true;

    let cancelled = false;
    const sb = supabase;
    const check = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await sb
        .from('feedback')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo)
        .limit(1);

      if (cancelled || (data && data.length > 0)) return;

      const timer = setTimeout(() => {
        if (!cancelled) setShow(true);
      }, 60_000);
      return () => clearTimeout(timer);
    };

    let cleanup: (() => void) | undefined;
    check().then((c) => { cleanup = c; });
    return () => { cancelled = true; cleanup?.(); };
  }, [user]);

  if (!user) return null;
  return <FeedbackModal open={show} onClose={() => setShow(false)} userId={user.id} />;
}
