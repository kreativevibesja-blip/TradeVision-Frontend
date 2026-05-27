'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ORION_CONTEXT_EVENT } from '@/lib/orion-context';
import { OrionMemoryStore } from '@/orion/memory/OrionMemoryStore';
import { resolveOrionPageContext } from '@/orion/services/OrionKnowledgeRouter';
import type { OrionActivitySnapshot, OrionFocusContext, OrionPageContext } from '@/orion/types';

type OrionPageAwarenessValue = {
  pageContext: OrionPageContext;
  activity: OrionActivitySnapshot;
  greeting: string;
  firstName: string | null;
};

const OrionPageAwarenessContext = createContext<OrionPageAwarenessValue | undefined>(undefined);

const defaultActivity: OrionActivitySnapshot = {
  trackedTrades: [],
  journalInsights: [],
  recentAnalyses: [],
  analysisTotal: 0,
  recentPages: [],
  lastAction: null,
  preferredMarket: null,
};

function getFirstName(name?: string | null, email?: string | null) {
  const raw = name?.trim() || email?.split('@')[0] || null;
  return raw ? raw.split(/\s+/)[0] : null;
}

function buildGreeting(firstName: string | null, pageContext: OrionPageContext, activity: OrionActivitySnapshot) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = firstName ?? 'Trader';
  const trackedCount = activity.trackedTrades.filter((trade) => trade.state !== 'INVALID' && trade.state !== 'EXPIRED').length;

  if (trackedCount > 0) {
    return `${greeting}, ${name}. Your Trade Radar is monitoring ${trackedCount} opportunit${trackedCount === 1 ? 'y' : 'ies'}.`;
  }

  if (pageContext.focusContext?.kind === 'analysis') {
    return `${greeting}, ${name}. Ready to review ${pageContext.focusContext.analysis.pair} ${pageContext.focusContext.analysis.timeframe}?`;
  }

  if (activity.preferredMarket) {
    return `${greeting}, ${name}. Ready to analyze ${activity.preferredMarket} today?`;
  }

  return `${greeting}, ${name}. ${pageContext.knowledge.summary}`;
}

export function OrionPageAwarenessProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useSearchParams();
  const { user, token } = useAuth();
  const [focusContext, setFocusContext] = useState<OrionFocusContext>(null);
  const [activity, setActivity] = useState<OrionActivitySnapshot>(() => {
    const memory = OrionMemoryStore.get();
    return {
      ...defaultActivity,
      recentPages: memory.recentPages,
      lastAction: memory.lastAction,
      preferredMarket: memory.preferredMarket,
    };
  });

  useEffect(() => {
    const recentPages = OrionMemoryStore.rememberPage(pathname);
    setActivity((current) => ({ ...current, recentPages }));
  }, [pathname]);

  useEffect(() => {
    const preferredMarket = user?.onboarding?.responses?.markets?.[0] ?? null;
    OrionMemoryStore.setPreferredMarket(preferredMarket);
    setActivity((current) => ({ ...current, preferredMarket }));
  }, [user?.onboarding?.responses?.markets]);

  useEffect(() => {
    const handleFocusContext = (event: Event) => {
      const customEvent = event as CustomEvent<OrionFocusContext>;
      const detail = customEvent.detail as any;

      if (!detail) {
        setFocusContext(null);
        return;
      }

      if (detail.kind === 'analysis') {
        setFocusContext({
          kind: 'analysis',
          analysis: {
            id: detail.id,
            pair: detail.market,
            timeframe: detail.timeframe,
            confidence: detail.confidence,
            trend: detail.trend,
            signalType: detail.signalType,
            entryPlan: { bias: detail.entryBias, entryType: 'none', entryZone: null, confirmation: 'none', reason: '' },
          } as any,
        });
        return;
      }

      if (detail.kind === 'live-signal') {
        setFocusContext({
          kind: 'live-signal',
          signal: {
            key: detail.id,
            source: detail.source,
            symbolLabel: detail.market,
            timeframe: detail.timeframe,
            direction: detail.direction,
            confidence: detail.confidence,
            grade: detail.grade,
            status: detail.status,
            reason: detail.title,
          },
        });
      }
    };

    window.addEventListener(ORION_CONTEXT_EVENT, handleFocusContext as EventListener);
    return () => window.removeEventListener(ORION_CONTEXT_EVENT, handleFocusContext as EventListener);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadActivity = async () => {
      try {
        const [radar, journal, analyses] = await Promise.all([
          api.radar.list(token).catch(() => ({ trades: [] })),
          api.journal.getInsights(token).catch(() => ({ insights: [] })),
          api.getAnalyses(token, 1).catch(() => ({ analyses: [], total: 0 } as { analyses: []; total: number })),
        ]);

        if (!active) {
          return;
        }

        setActivity((current) => ({
          ...current,
          trackedTrades: radar.trades,
          journalInsights: journal.insights,
          recentAnalyses: analyses.analyses ?? [],
          analysisTotal: analyses.total ?? 0,
        }));
      } catch {
        if (!active) {
          return;
        }

        setActivity((current) => current);
      }
    };

    void loadActivity();

    return () => {
      active = false;
    };
  }, [token]);

  const pageContext = useMemo(() => resolveOrionPageContext(pathname, focusContext), [pathname, focusContext]);
  const firstName = getFirstName(user?.name, user?.email);
  const greeting = useMemo(() => buildGreeting(firstName, pageContext, activity), [activity, firstName, pageContext]);

  const value = useMemo(
    () => ({ pageContext, activity, greeting, firstName }),
    [activity, firstName, greeting, pageContext],
  );

  return <OrionPageAwarenessContext.Provider value={value}>{children}</OrionPageAwarenessContext.Provider>;
}

export function useOrionPageAwareness() {
  const context = useContext(OrionPageAwarenessContext);
  if (!context) {
    throw new Error('useOrionPageAwareness must be used within OrionPageAwarenessProvider');
  }

  return context;
}