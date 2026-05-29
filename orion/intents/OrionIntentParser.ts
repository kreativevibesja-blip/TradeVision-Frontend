import type { OrionIntentId, OrionQuickActionId } from '@/orion/types';

const intentMatchers: Array<{ intent: OrionIntentId; tests: RegExp[] }> = [
  { intent: 'ASSISTANCE_REQUEST', tests: [/can you assist me/i, /can you help me/i, /help me please/i, /i need help/i, /what can you help with/i, /how can you help me/i] },
  { intent: 'CONFUSION_HELP', tests: [/i('?| a)?m confused/i, /this is confusing/i, /i don'?t understand/i, /i am lost/i, /i need guidance/i] },
  { intent: 'NEW_USER_HELP', tests: [/i('?| a)?m new here/i, /i am a beginner/i, /i'm a beginner/i, /i just joined/i, /how do i start here/i] },
  { intent: 'SETUP_EXPLANATION_HELP', tests: [/i need a setup explained/i, /help me understand this setup/i, /can you explain this setup/i, /explain this chart setup/i] },
  { intent: 'FAILED_ANALYSIS_HELP', tests: [/my analysis failed/i, /analysis is failing/i, /chart upload failed/i, /my chart analysis is not working/i, /analysis didn'?t work/i] },
  { intent: 'NEXT_STEP_HELP', tests: [/i('?| a)?m not sure what to do next/i, /what should i do next/i, /what is the next step/i, /where do i go from here/i] },
  { intent: 'MISSED_TRADE_HELP', tests: [/i missed the trade/i, /i missed my entry/i, /the trade already moved/i, /price left without me/i] },
  { intent: 'RUSHING_TRADE_HELP', tests: [/i want to rush this trade/i, /i want to enter now/i, /should i rush this/i, /i feel like chasing/i, /i do not want to miss this move/i] },
  { intent: 'DISCIPLINE_HELP', tests: [/i keep losing discipline/i, /i am losing discipline/i, /i keep breaking my rules/i, /i keep overtrading/i, /how do i stay disciplined/i] },
  { intent: 'FEATURE_ACCESS_HELP', tests: [/i can('?|no)t access this feature/i, /i can('?|no)t use this feature/i, /why can('?|no)t i access this/i, /why is this unavailable/i] },
  { intent: 'FEATURE_LOCKED_HELP', tests: [/why is this locked/i, /this is locked/i, /why is this feature locked/i, /why can('?|no)t i open this feature/i] },
  { intent: 'PLAN_REQUIREMENT_HELP', tests: [/which plan do i need for this/i, /what plan do i need/i, /what subscription do i need/i, /which tier do i need/i] },
  { intent: 'UPGRADE_NOW_HELP', tests: [/i want to upgrade now/i, /upgrade me/i, /how do i upgrade/i, /take me to upgrade/i] },
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