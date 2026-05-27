import { ORION_PAGE_KNOWLEDGE, ORION_QUICK_ACTIONS } from '@/orion/knowledge/orionKnowledge';
import type { OrionFocusContext, OrionPageContext } from '@/orion/types';

function resolveKnowledgeId(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname === '/platform') return 'platform';
  if (pathname === '/pricing') return 'pricing';
  if (pathname === '/checkout') return 'checkout';
  if (pathname === '/trade-examples') return 'trade-examples';
  if (pathname === '/analyze/queue') return 'analysis-queue';
  if (pathname === '/analyze') return 'analyze';
  if (pathname === '/dashboard/tradingview' || pathname === '/dashboard/signals' || pathname === '/dashboard/scanner') return 'tradingview';
  if (pathname === '/dashboard/deriv') return 'deriv';
  if (pathname === '/dashboard/command-center') return 'command-center';
  if (pathname === '/dashboard/radar') return 'radar';
  if (pathname === '/dashboard/billing') return 'billing';
  if (pathname === '/dashboard/referrals') return 'referrals';
  if (pathname === '/dashboard/goldx-pulse') return 'goldx-pulse';
  if (pathname === '/dashboard/goldx') return 'goldx';
  return 'dashboard';
}

export function resolveOrionPageContext(pathname: string, focusContext: OrionFocusContext): OrionPageContext {
  const knowledgeId = resolveKnowledgeId(pathname);
  const knowledge = ORION_PAGE_KNOWLEDGE.find((item) => item.id === knowledgeId) ?? ORION_PAGE_KNOWLEDGE.find((item) => item.id === 'dashboard')!;

  return {
    pathname,
    knowledge,
    focusContext,
    quickActions: knowledge.quickActions.map((actionId) => ORION_QUICK_ACTIONS[actionId]),
  };
}