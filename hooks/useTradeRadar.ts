'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type TrackedTrade } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const POLL_INTERVAL_MS = 5000;

export function useTradeRadar() {
  const { token } = useAuth();
  const [trades, setTrades] = useState<TrackedTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchTrades = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.radar.list(token);
      if (mountedRef.current) {
        setTrades(res.trades);
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Failed to load radar');
      }
    }
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    if (!token) return;

    setLoading(true);
    fetchTrades().finally(() => {
      if (mountedRef.current) setLoading(false);
    });

    intervalRef.current = setInterval(fetchTrades, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, fetchTrades]);

  const addTrade = useCallback(async (tradeId: string) => {
    if (!token) return;
    const res = await api.radar.add(tradeId, token);
    setTrades((prev) => [res.tracked, ...prev]);
    return res.tracked;
  }, [token]);

  const removeTrade = useCallback(async (id: string) => {
    if (!token) return;
    await api.radar.remove(id, token);
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, [token]);

  const activeTrades = trades.filter((t) => t.state === 'TRACKING' || t.state === 'READY' || t.state === 'ACTIVE');
  const pastTrades = trades.filter((t) => t.state === 'INVALID' || t.state === 'EXPIRED');

  return { trades, activeTrades, pastTrades, loading, error, addTrade, removeTrade, refresh: fetchTrades };
}
