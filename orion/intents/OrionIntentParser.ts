import type { OrionIntentId, OrionQuickActionId } from '@/orion/types';

const intentMatchers: Array<{ intent: OrionIntentId; tests: RegExp[] }> = [
  { intent: 'TRADEVISION_EXPLAIN', tests: [/what is tradevision/i, /what is tradevision ai/i, /tell me about tradevision/i, /what does tradevision do/i] },
  { intent: 'TRADE_RADAR_EXPLAIN', tests: [/what is trade radar/i, /tell me about trade radar/i, /how does trade radar work/i] },
  { intent: 'COMMAND_CENTER_EXPLAIN', tests: [/what is command center/i, /tell me about command center/i, /how does command center work/i] },
  { intent: 'PLAN_COMPARISON_EXPLAIN', tests: [/pro\+ vs pro/i, /pro plus vs pro/i, /difference between pro and pro\+/i, /difference between pro and top tier/i, /which plan is better/i, /what makes pro\+ different/i] },
  { intent: 'GOLDX_EXPLAIN', tests: [/what is goldx/i, /tell me about goldx/i, /how does goldx work/i] },
  { intent: 'JOURNAL_INTELLIGENCE_EXPLAIN', tests: [/what is journal intelligence/i, /tell me about journal intelligence/i, /how does journal intelligence work/i, /what does the journal do/i] },
  { intent: 'BEGINNER_WORKFLOW_EXPLAIN', tests: [/how should a beginner use tradevision/i, /how do i start with tradevision/i, /beginner.*tradevision/i, /step by step.*tradevision/i] },
  { intent: 'ORION_EXPLAIN', tests: [/what is orion/i, /who is orion/i, /tell me about orion/i, /how does orion work/i] },
  { intent: 'AI_ANALYSIS_EXPLAIN', tests: [/how does ai chart analysis work/i, /how does ai analysis work/i, /how does analysis work here/i, /how does orion analyze charts/i] },
  { intent: 'POST_ANALYSIS_GUIDANCE', tests: [/what should i do after my first analysis/i, /what do i do after analysis/i, /after my first analysis/i, /what next after analysis/i] },
  { intent: 'CREATE_AI_ANALYSIS', tests: [/analy[sz]e my chart/i, /upload.*chart/i, /create.*analysis/i, /start.*analysis/i] },
  { intent: 'OPEN_TRADE_RADAR', tests: [/trade radar/i, /radar/i, /monitored opportunit/i, /tracked setup/i] },
  { intent: 'REVIEW_JOURNAL', tests: [/journal/i, /weekly review/i, /review trades/i, /performance insight/i] },
  { intent: 'MARKET_OVERVIEW', tests: [/market overview/i, /market conditions/i, /what.*market/i, /session activity/i] },
  { intent: 'SUBSCRIPTION_HELP', tests: [/subscription/i, /plan/i, /upgrade/i, /trial/i, /cancel.*subscription/i, /billing/i] },
  { intent: 'CREATE_SUPPORT_TICKET', tests: [/support ticket/i, /open.*ticket/i, /contact support/i] },
  { intent: 'SUPPORT_PROBLEM', tests: [/analysis failed/i, /bug/i, /issue/i, /problem/i, /not working/i, /failed/i] },
  { intent: 'PLATFORM_TOUR', tests: [/platform tour/i, /show me around/i, /how does this work/i, /what does this page do/i] },
  { intent: 'RISK_MANAGEMENT_EXPLAIN', tests: [/what is risk management/i, /explain risk management/i] },
  { intent: 'RISK_MANAGEMENT_IMPROVE', tests: [/good risk management/i, /how can i have good risk management/i, /how do i improve risk management/i, /better risk management/i] },
  { intent: 'RISK_GUIDANCE', tests: [/risk/i, /stop loss/i, /invalidation/i, /protect capital/i] },
  { intent: 'TRADING_ADVICE', tests: [/trading advice/i, /should i take this trade/i, /what trade should i take/i, /what should i trade/i, /give me a trade/i] },
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