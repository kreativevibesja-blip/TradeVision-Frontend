'use client';

import { useState, useEffect, useRef } from 'react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

function getDismissUntilTimestamp() {
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime();
}

function getFeedbackDismissKey(userId: string) {
  return `tradevision_feedback_dismiss_until:${userId}`;
}

function isDismissedForToday(userId: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  const rawValue = window.localStorage.getItem(getFeedbackDismissKey(userId));
  const dismissUntil = rawValue ? Number(rawValue) : 0;
  return Number.isFinite(dismissUntil) && dismissUntil > Date.now();
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

    if (isDismissedForToday(user.id)) {
      checkedUserId.current = user.id;
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

      if (isDismissedForToday(feedbackUserId)) {
        checkedUserId.current = feedbackUserId;
        return;
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
      window.localStorage.setItem(getFeedbackDismissKey(user.id), String(getDismissUntilTimestamp()));
    }
    checkedUserId.current = user.id;
    setShow(false);
  };

  return <FeedbackModal open={show} onClose={handleClose} userId={user.id} />;
}
