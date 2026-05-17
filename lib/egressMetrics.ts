'use client';

import { getCachedAccessToken } from '@/lib/supabase/client';

type EgressBucket = {
  authRefreshCount: number;
  sessionFetchCount: number;
  listenerCount: number;
  pollingCount: number;
  activeChannels: number;
};

type EgressGlobals = typeof globalThis & {
  __tradevisionEgressTabId?: string;
  __tradevisionEgressUserId?: string | null;
  __tradevisionEgressBucket?: EgressBucket;
  __tradevisionEgressActivePollers?: Set<string>;
  __tradevisionEgressActiveChannels?: Set<string>;
  __tradevisionEgressFlushTimer?: ReturnType<typeof setInterval>;
  __tradevisionEgressInitialized?: boolean;
};

const globalScope = globalThis as EgressGlobals;

const emptyBucket = (): EgressBucket => ({
  authRefreshCount: 0,
  sessionFetchCount: 0,
  listenerCount: 0,
  pollingCount: 0,
  activeChannels: 0,
});

const normalizeApiUrl = (value?: string) => {
  const rawValue = value?.trim();
  if (!rawValue) {
    return 'http://localhost:4000/api';
  }

  try {
    const parsedUrl = new URL(rawValue);
    const normalizedPath = parsedUrl.pathname === '/' ? '/api' : parsedUrl.pathname.replace(/\/$/, '');
    parsedUrl.pathname = normalizedPath.endsWith('/api') ? normalizedPath : `${normalizedPath}/api`;
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return rawValue.replace(/\/$/, '').endsWith('/api')
      ? rawValue.replace(/\/$/, '')
      : `${rawValue.replace(/\/$/, '')}/api`;
  }
};

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

const ensureBucket = () => {
  globalScope.__tradevisionEgressBucket ??= emptyBucket();
  globalScope.__tradevisionEgressActivePollers ??= new Set();
  globalScope.__tradevisionEgressActiveChannels ??= new Set();
  return globalScope.__tradevisionEgressBucket;
};

const getTabId = () => {
  if (globalScope.__tradevisionEgressTabId) {
    return globalScope.__tradevisionEgressTabId;
  }

  if (typeof window === 'undefined') {
    globalScope.__tradevisionEgressTabId = 'server';
    return globalScope.__tradevisionEgressTabId;
  }

  const storageKey = 'tradevision_egress_tab_id';
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) {
    globalScope.__tradevisionEgressTabId = existing;
    return existing;
  }

  const nextTabId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(storageKey, nextTabId);
  globalScope.__tradevisionEgressTabId = nextTabId;
  return nextTabId;
};

const ensureInitialized = () => {
  if (typeof window === 'undefined' || globalScope.__tradevisionEgressInitialized) {
    return;
  }

  globalScope.__tradevisionEgressInitialized = true;
  ensureBucket();

  const flushNow = () => {
    void flushEgressMetrics('lifecycle');
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushNow();
    }
  });
  window.addEventListener('beforeunload', flushNow);
  globalScope.__tradevisionEgressFlushTimer = setInterval(() => {
    void flushEgressMetrics('interval');
  }, 60_000);
};

const snapshotBucket = () => {
  const bucket = ensureBucket();
  bucket.pollingCount = globalScope.__tradevisionEgressActivePollers?.size ?? 0;
  bucket.activeChannels = globalScope.__tradevisionEgressActiveChannels?.size ?? 0;
  return { ...bucket };
};

export const setMetricsUser = (userId: string | null | undefined) => {
  ensureInitialized();
  globalScope.__tradevisionEgressUserId = userId ?? null;
};

export const recordAuthRefreshMetric = () => {
  ensureInitialized();
  ensureBucket().authRefreshCount += 1;
};

export const recordSessionFetchMetric = () => {
  ensureInitialized();
  ensureBucket().sessionFetchCount += 1;
};

export const setListenerCountMetric = (count: number) => {
  ensureInitialized();
  ensureBucket().listenerCount = Math.max(count, 0);
};

export const trackPollingMetric = (label: string) => {
  ensureInitialized();
  globalScope.__tradevisionEgressActivePollers?.add(label);
  ensureBucket().pollingCount = globalScope.__tradevisionEgressActivePollers?.size ?? 0;
  console.debug('[egress] polling start', label, 'active:', ensureBucket().pollingCount);

  return () => {
    globalScope.__tradevisionEgressActivePollers?.delete(label);
    ensureBucket().pollingCount = globalScope.__tradevisionEgressActivePollers?.size ?? 0;
    console.debug('[egress] polling stop', label, 'active:', ensureBucket().pollingCount);
  };
};

export const trackChannelMetric = (label: string) => {
  ensureInitialized();
  globalScope.__tradevisionEgressActiveChannels?.add(label);
  ensureBucket().activeChannels = globalScope.__tradevisionEgressActiveChannels?.size ?? 0;
  console.debug('[egress] channel start', label, 'active:', ensureBucket().activeChannels);

  return () => {
    globalScope.__tradevisionEgressActiveChannels?.delete(label);
    ensureBucket().activeChannels = globalScope.__tradevisionEgressActiveChannels?.size ?? 0;
    console.debug('[egress] channel stop', label, 'active:', ensureBucket().activeChannels);
  };
};

export const flushEgressMetrics = async (reason: 'interval' | 'lifecycle' | 'manual' = 'manual') => {
  if (typeof window === 'undefined') {
    return;
  }

  ensureInitialized();
  const payload = snapshotBucket();
  const hasActivity = Object.values(payload).some((value) => value > 0);

  console.info('[egress] summary', {
    reason,
    tabId: getTabId(),
    userId: globalScope.__tradevisionEgressUserId ?? null,
    route: window.location.pathname,
    ...payload,
  });

  if (!hasActivity) {
    return;
  }

  const accessToken = getCachedAccessToken();
  if (!accessToken) {
    globalScope.__tradevisionEgressBucket = emptyBucket();
    return;
  }

  try {
    await fetch(`${API_URL}/debug/client-egress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tabId: getTabId(),
        route: window.location.pathname,
        reason,
        metrics: payload,
      }),
      keepalive: true,
    });
  } catch {
    // Metrics are best-effort only.
  } finally {
    globalScope.__tradevisionEgressBucket = emptyBucket();
  }
};
