'use client';

import { useState, useEffect, useRef } from 'react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

function getLocalDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFeedbackDismissKey(userId: string) {
  return `tradevision_feedback_dismissed:${userId}`;
}

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

    let cancelled = false;
    const sb = supabase;
    const check = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();

      if (sessionError) {
        console.error('Feedback session check error:', sessionError);
        return;
      }

      const authUser = session?.user ?? null;

      if (!authUser?.created_at) {
        return;
      }

      const feedbackUserId = authUser.id;

      if (typeof window !== 'undefined') {
        const dismissedToday = window.localStorage.getItem(getFeedbackDismissKey(feedbackUserId));
        if (dismissedToday === getLocalDateStamp()) {
          checkedUserId.current = feedbackUserId;
          return;
        }
      }

      const {
        data,
        error: feedbackError,
      } = await sb
        .from('feedback')
        .select('id')
        .eq('user_id', feedbackUserId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (feedbackError) {
        console.error('Feedback lookup error:', feedbackError);
        return;
      }

      const createdAt = new Date(authUser.created_at).getTime();
      if (!Number.isFinite(createdAt) || Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000) {
        return;
      }

      if (cancelled || (data && data.length > 0)) return;

      checkedUserId.current = feedbackUserId;

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

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getFeedbackDismissKey(user.id), getLocalDateStamp());
    }
    setShow(false);
  };

  return <FeedbackModal open={show} onClose={handleClose} userId={user.id} />;
}
