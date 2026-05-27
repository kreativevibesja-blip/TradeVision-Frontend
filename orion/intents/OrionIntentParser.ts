import type { OrionIntentId, OrionQuickActionId } from '@/orion/types';

const intentMatchers: Array<{ intent: OrionIntentId; tests: RegExp[] }> = [
  { intent: 'CREATE_AI_ANALYSIS', tests: [/analy[sz]e my chart/i, /upload.*chart/i, /create.*analysis/i, /start.*analysis/i] },
  { intent: 'OPEN_TRADE_RADAR', tests: [/trade radar/i, /radar/i, /monitored opportunit/i, /tracked setup/i] },
  { intent: 'REVIEW_JOURNAL', tests: [/journal/i, /weekly review/i, /review trades/i, /performance insight/i] },
  { intent: 'MARKET_OVERVIEW', tests: [/market overview/i, /market conditions/i, /what.*market/i, /session activity/i] },
  { intent: 'SUBSCRIPTION_HELP', tests: [/subscription/i, /plan/i, /upgrade/i, /trial/i, /cancel.*subscription/i, /billing/i] },
  { intent: 'CREATE_SUPPORT_TICKET', tests: [/support ticket/i, /open.*ticket/i, /contact support/i] },
  { intent: 'SUPPORT_PROBLEM', tests: [/analysis failed/i, /bug/i, /issue/i, /problem/i, /not working/i, /failed/i] },
  { intent: 'PLATFORM_TOUR', tests: [/platform tour/i, /show me around/i, /how does this work/i, /what does this page do/i] },
  { intent: 'RISK_GUIDANCE', tests: [/risk/i, /stop loss/i, /invalidation/i, /protect capital/i] },
  { intent: 'STRATEGY_HELP', tests: [/strategy/i, /smart money/i, /smc/i, /setup help/i] },
  { intent: 'ACCOUNT_ASSISTANCE', tests: [/account/i, /profile/i, /onboarding/i, /access/i] },
  { intent: 'TRADING_GLOSSARY_BOS', tests: [/bos/i, /break of structure/i] },
  { intent: 'TRADING_GLOSSARY_CHOCH', tests: [/choch/i, /change of character/i] },
  { intent: 'TRADING_GLOSSARY_FVG', tests: [/fvg/i, /fair value gap/i] },
  { intent: 'TRADE_RADAR_INVALIDATION', tests: [/invalidat/i, /why was my setup invalidated/i] },
  { intent: 'EXPLAIN_SETUP', tests: [/explain this setup/i, /explain this trade/i, /what does this setup mean/i] },
  { intent: 'COMMAND_CENTER_HELP', tests: [/command center/i, /execution plan/i] },
  { intent: 'GREETING', tests: [/hello/i, /hi/i, /hey/i, /good morning/i, /good evening/i] },
];

const quickActionIntentMap: Record<OrionQuickActionId, OrionIntentId> = {
  'create-analysis': 'CREATE_AI_ANALYSIS',
  'open-radar': 'OPEN_TRADE_RADAR',
  'review-journal': 'REVIEW_JOURNAL',
  'market-overview': 'MARKET_OVERVIEW',
  'subscription-help': 'SUBSCRIPTION_HELP',
  'create-support-ticket': 'CREATE_SUPPORT_TICKET',
  'platform-tour': 'PLATFORM_TOUR',
  'risk-guidance': 'RISK_GUIDANCE',
  'strategy-help': 'STRATEGY_HELP',
  'account-assistance': 'ACCOUNT_ASSISTANCE',
};

export function parseOrionIntent(input: string): OrionIntentId {
  const normalized = input.trim();
  if (!normalized) {
    return 'GREETING';
  }

  const match = intentMatchers.find((entry) => entry.tests.some((test) => test.test(normalized)));
  return match?.intent ?? 'UNKNOWN';
}

export function quickActionToIntent(actionId: OrionQuickActionId): OrionIntentId {
  return quickActionIntentMap[actionId];
}