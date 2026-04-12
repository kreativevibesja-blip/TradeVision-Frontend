'use client';

import { useState, useEffect, useRef } from 'react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function FeedbackTrigger() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      checkedUserId.current = null;
      setShow(false);
      return;
    }

    if (!supabase || checkedUserId.current === user.id) return;
    checkedUserId.current = user.id;

    let cancelled = false;
    const sb = supabase;
    const check = async () => {
      const {
        data: { user: authUser },
      } = await sb.auth.getUser();

      const createdAt = authUser?.created_at ? new Date(authUser.created_at).getTime() : NaN;
      if (!Number.isFinite(createdAt) || Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000) {
        return;
      }

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
      }, 5_000);
      return () => clearTimeout(timer);
    };

    let cleanup: (() => void) | undefined;
    check().then((c) => { cleanup = c; });
    return () => { cancelled = true; cleanup?.(); };
  }, [user]);

  if (!user) return null;
  return <FeedbackModal open={show} onClose={() => setShow(false)} userId={user.id} />;
}
