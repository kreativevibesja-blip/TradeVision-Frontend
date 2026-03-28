'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const STORAGE_KEY = 'chartmind_visitor_session_id';
const HEARTBEAT_INTERVAL_MS = 60_000;

const getVisitorSessionId = () => {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
};

export function VisitorHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sessionId = getVisitorSessionId();

    const sendHeartbeat = () => {
      void api.heartbeatVisitor({
        sessionId,
        currentPath: pathname,
      }).catch(() => {
        // Visitor tracking should never interrupt the app experience.
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pathname]);

  return null;
}