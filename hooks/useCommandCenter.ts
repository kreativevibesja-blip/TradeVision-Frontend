'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type CommandCenterSnapshot } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const POLL_INTERVAL_MS = 4000;

export function useCommandCenter(tradeId: string | null, currentPrice?: number) {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = useState<CommandCenterSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchSnapshot = useCallback(async () => {
    if (!tradeId || !token) return;
    try {
      const res = await api.commandCenter.getSnapshot(tradeId, token, currentPrice);
      if (mountedRef.current) {
        setSnapshot(res.commandCenter);
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Failed to load Command Center');
      }
    }
  }, [tradeId, token, currentPrice]);

  useEffect(() => {
    mountedRef.current = true;
    if (!tradeId) return;

    setLoading(true);
    fetchSnapshot().finally(() => {
      if (mountedRef.current) setLoading(false);
    });

    intervalRef.current = setInterval(fetchSnapshot, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tradeId, fetchSnapshot]);

  const refresh = useCallback(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  return { snapshot, loading, error, refresh };
}
