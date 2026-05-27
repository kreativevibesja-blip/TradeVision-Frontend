import type { AnalysisResult, FindTradeInsight, ScannedSignal, TrackedTrade } from '@/lib/api';

export type OrionQuickActionId =
  | 'create-analysis'
  | 'open-radar'
  | 'review-journal'
  | 'market-overview'
  | 'subscription-help'
  | 'create-support-ticket'
  | 'platform-tour'
  | 'risk-guidance'
  | 'strategy-help'
  | 'account-assistance';

export type OrionIntentId =
  | 'GREETING'
  | 'TRADEVISION_EXPLAIN'
  | 'TRADE_RADAR_EXPLAIN'
  | 'COMMAND_CENTER_EXPLAIN'
  | 'PLAN_COMPARISON_EXPLAIN'
  | 'GOLDX_EXPLAIN'
  | 'JOURNAL_INTELLIGENCE_EXPLAIN'
  | 'BEGINNER_WORKFLOW_EXPLAIN'
  | 'ORION_EXPLAIN'
  | 'AI_ANALYSIS_EXPLAIN'
  | 'POST_ANALYSIS_GUIDANCE'
  | 'CREATE_AI_ANALYSIS'
  | 'OPEN_TRADE_RADAR'
  | 'REVIEW_JOURNAL'
  | 'MARKET_OVERVIEW'
  | 'SUBSCRIPTION_HELP'
  | 'CREATE_SUPPORT_TICKET'
  | 'SUPPORT_PROBLEM'
  | 'PLATFORM_TOUR'
  | 'RISK_MANAGEMENT_EXPLAIN'
  | 'RISK_MANAGEMENT_IMPROVE'
  | 'RISK_GUIDANCE'
  | 'STRATEGY_HELP'
  | 'TRADING_ADVICE'
  | 'ACCOUNT_ASSISTANCE'
  | 'TRADING_GLOSSARY_BOS'
  | 'TRADING_GLOSSARY_CHOCH'
  | 'TRADING_GLOSSARY_FVG'
  | 'TRADE_RADAR_INVALIDATION'
  | 'EXPLAIN_SETUP'
  | 'COMMAND_CENTER_HELP'
  | 'UNKNOWN';

export type OrionWorkflowTrigger =
  | { type: 'navigate'; href: string }
  | { type: 'open-analysis-upload' }
  | {
      type: 'open-support-ticket';
      draft?: {
        subject?: string;
        message?: string;
        category?: 'ACCOUNT' | 'BILLING' | 'ANALYSIS' | 'BUG' | 'FEATURE' | 'GENERAL';
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      };
    };

export type OrionChatChoice = {
  id: string;
  label: string;
  followUpMessage?: string;
  trigger?: OrionWorkflowTrigger;
};

export type OrionMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  createdAt: number;
  animate?: boolean;
  choices?: OrionChatChoice[];
};

export type OrionPlannedMessage = {
  text: string;
  choices?: OrionChatChoice[];
  trigger?: OrionWorkflowTrigger;
};

export type OrionConversationWorkflow =
  | { type: 'idle' }
  | { type: 'awaiting-support-issue' }
  | {
      type: 'confirm-support-ticket';
      issue: string;
      draft: {
        subject: string;
        message: string;
        category: 'ACCOUNT' | 'BILLING' | 'ANALYSIS' | 'BUG' | 'FEATURE' | 'GENERAL';
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      };
    };

export type OrionFocusContext =
  | {
      kind: 'analysis';
      analysis: AnalysisResult;
    }
  | {
      kind: 'live-signal';
      signal: Pick<ScannedSignal, 'key' | 'source' | 'symbolLabel' | 'timeframe' | 'direction' | 'confidence' | 'grade' | 'status' | 'reason'>;
    }
  | null;

export type OrionPageKnowledge = {
  id: string;
  label: string;
  summary: string;
  suggestions: string[];
  quickActions: OrionQuickActionId[];
};

export type OrionQuickAction = {
  id: OrionQuickActionId;
  label: string;
  description: string;
  icon: 'analysis' | 'radar' | 'journal' | 'market' | 'subscription' | 'support' | 'tour' | 'risk' | 'strategy' | 'account';
};

export type OrionActivitySnapshot = {
  trackedTrades: TrackedTrade[];
  journalInsights: FindTradeInsight[];
  recentAnalyses: AnalysisResult[];
  analysisTotal: number;
  recentPages: string[];
  lastAction: string | null;
  preferredMarket: string | null;
};

export type OrionPageContext = {
  pathname: string;
  knowledge: OrionPageKnowledge;
  quickActions: OrionQuickAction[];
  focusContext: OrionFocusContext;
};

export type OrionWorkflowResult = {
  messages: OrionPlannedMessage[];
  nextWorkflow: OrionConversationWorkflow;
  memoryAction?: string;
};