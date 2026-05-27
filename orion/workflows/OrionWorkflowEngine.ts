import { ORION_GLOSSARY, ORION_RESPONSE_VARIANTS, ORION_SUBSCRIPTION_GUIDANCE } from '@/orion/knowledge/orionKnowledge';
import { parseOrionIntent } from '@/orion/intents/OrionIntentParser';
import type {
  OrionActivitySnapshot,
  OrionConversationWorkflow,
  OrionPageContext,
  OrionPlannedMessage,
  OrionWorkflowResult,
} from '@/orion/types';

type WorkflowInput = {
  input: string;
  pageContext: OrionPageContext;
  workflow: OrionConversationWorkflow;
  activity: OrionActivitySnapshot;
  user: {
    firstName: string | null;
    subscription: string | null;
    onboardingChallenge: string | null;
    onboardingGoal: string | null;
  };
};

function pickVariant(options: string[], seed: number) {
  return options[Math.abs(seed) % options.length];
}

function buildSupportDraft(issue: string) {
  const normalizedIssue = issue.trim();
  const lower = normalizedIssue.toLowerCase();
  const category = lower.includes('bill') || lower.includes('subscription')
    ? 'BILLING'
    : lower.includes('analysis') || lower.includes('chart')
      ? 'ANALYSIS'
      : lower.includes('bug') || lower.includes('error') || lower.includes('failed')
        ? 'BUG'
        : 'GENERAL';

  return {
    subject: normalizedIssue.length > 56 ? `${normalizedIssue.slice(0, 53)}...` : normalizedIssue,
    message: normalizedIssue,
    category: category as 'ACCOUNT' | 'BILLING' | 'ANALYSIS' | 'BUG' | 'FEATURE' | 'GENERAL',
    priority: category === 'BUG' ? 'HIGH' as const : 'MEDIUM' as const,
  };
}

function buildMarketOverview(pageContext: OrionPageContext, activity: OrionActivitySnapshot) {
  const trackedCount = activity.trackedTrades.filter((trade) => trade.state !== 'INVALID' && trade.state !== 'EXPIRED').length;
  const journalInsight = activity.journalInsights[0]?.headline;
  const focus = pageContext.focusContext;

  const messages: OrionPlannedMessage[] = [
    {
      text: `${pickVariant(ORION_RESPONSE_VARIANTS.market, trackedCount + activity.analysisTotal)} ${pageContext.knowledge.summary}`,
    },
  ];

  if (focus?.kind === 'analysis') {
    messages.push({
      text: `The active analysis on screen is ${focus.analysis.pair} ${focus.analysis.timeframe} with ${focus.analysis.confidence}% confidence and a ${focus.analysis.signalType} profile.`,
    });
  } else if (focus?.kind === 'live-signal') {
    messages.push({
      text: `The selected live setup is ${focus.signal.symbolLabel} ${focus.signal.direction.toUpperCase()} on ${focus.signal.timeframe} with ${focus.signal.confidence}% confidence and ${focus.signal.grade} quality.`,
    });
  } else if (trackedCount > 0) {
    messages.push({
      text: `Trade Radar is actively monitoring ${trackedCount} opportunity${trackedCount === 1 ? '' : 'ies'} right now.`,
    });
  }

  if (journalInsight) {
    messages.push({
      text: `Recent journal intelligence: ${journalInsight}`,
    });
  }

  return messages;
}

export function buildOrionWelcome(input: Omit<WorkflowInput, 'input' | 'workflow'>): OrionPlannedMessage[] {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = input.user.firstName ?? 'Trader';
  const trackedCount = input.activity.trackedTrades.filter((trade) => trade.state !== 'INVALID' && trade.state !== 'EXPIRED').length;
  const preferredMarket = input.activity.preferredMarket;

  const lines = [`${greeting}, ${name}.`];

  if (trackedCount > 0) {
    lines.push(`Your Trade Radar is monitoring ${trackedCount} opportunit${trackedCount === 1 ? 'y' : 'ies'} right now.`);
  } else if (preferredMarket) {
    lines.push(`Ready to review ${preferredMarket} conditions today?`);
  } else {
    lines.push('How can Orion assist you today?');
  }

  lines.push(input.pageContext.knowledge.summary);

  return [{ text: lines.join(' ') }];
}

export function resolveOrionReply({ input, pageContext, workflow, activity, user }: WorkflowInput): OrionWorkflowResult {
  const trimmed = input.trim();

  if (workflow.type === 'awaiting-support-issue') {
    const draft = buildSupportDraft(trimmed || 'Support assistance requested from Orion chat.');
    return {
      messages: [{
        text: `${pickVariant(ORION_RESPONSE_VARIANTS.support, draft.subject.length)} ${draft.subject}. Would you like me to create a support ticket with this information?`,
        choices: [
          { id: 'support-yes', label: 'Yes, create ticket', trigger: { type: 'open-support-ticket', draft } },
          { id: 'support-no', label: 'No, not now', followUpMessage: 'No problem. I will keep the issue in context if you want to reopen it later.' },
        ],
      }],
      nextWorkflow: { type: 'confirm-support-ticket', issue: draft.message, draft },
      memoryAction: 'support-ticket-draft',
    };
  }

  if (workflow.type === 'confirm-support-ticket') {
    if (/^y(es)?/i.test(trimmed)) {
      return {
        messages: [{ text: 'Opening the support desk now so you can review and submit the ticket.' , trigger: { type: 'open-support-ticket', draft: workflow.draft } }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'support-ticket-opened',
      };
    }

    if (/^n(o)?/i.test(trimmed)) {
      return {
        messages: [{ text: 'Understood. I will leave the ticket closed for now.' }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'support-ticket-cancelled',
      };
    }
  }

  const intent = parseOrionIntent(trimmed);
  const transition = pickVariant(ORION_RESPONSE_VARIANTS.transitions, activity.analysisTotal + trimmed.length);

  switch (intent) {
    case 'GREETING':
      return {
        messages: [{ text: `${transition} ${pageContext.knowledge.summary}` }],
        nextWorkflow: { type: 'idle' },
      };
    case 'CREATE_AI_ANALYSIS':
      return {
        messages: [
          { text: pickVariant(ORION_RESPONSE_VARIANTS.analysis, activity.analysisTotal) },
          { text: 'I am opening the upload workflow now.', trigger: { type: 'open-analysis-upload' } },
          { text: 'Once the chart is in, I will guide you through structure, liquidity, invalidation, and execution context.' },
        ],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'analysis-upload-opened',
      };
    case 'OPEN_TRADE_RADAR': {
      const trackedCount = activity.trackedTrades.filter((trade) => trade.state !== 'INVALID' && trade.state !== 'EXPIRED').length;
      return {
        messages: [
          { text: trackedCount > 0 ? `Trade Radar is currently monitoring ${trackedCount} active opportunit${trackedCount === 1 ? 'y' : 'ies'}.` : 'Trade Radar is ready, but there are no active monitored opportunities right now.' },
          { text: 'I am opening Trade Radar.', trigger: { type: 'navigate', href: '/dashboard/radar' } },
        ],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'opened-radar',
      };
    }
    case 'REVIEW_JOURNAL':
      return {
        messages: activity.journalInsights.length > 0
          ? activity.journalInsights.slice(0, 2).map((insight) => ({ text: `${insight.headline}. ${insight.detail}` }))
          : [{ text: 'Your journal insight feed does not have enough completed trade history yet. As that fills in, Orion will surface session quality, RR consistency, and review patterns here.' }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'reviewed-journal',
      };
    case 'MARKET_OVERVIEW':
      return {
        messages: buildMarketOverview(pageContext, activity),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'market-overview',
      };
    case 'SUBSCRIPTION_HELP': {
      const subscription = user.subscription ?? 'FREE';
      return {
        messages: [
          { text: ORION_SUBSCRIPTION_GUIDANCE[subscription as keyof typeof ORION_SUBSCRIPTION_GUIDANCE] ?? 'I can help you compare the available platform plans.' },
          { text: 'I am opening the pricing surface so you can compare plans with the workflow context in mind.', trigger: { type: 'navigate', href: '/pricing' } },
        ],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'subscription-help',
      };
    }
    case 'CREATE_SUPPORT_TICKET':
      return {
        messages: [{ text: 'What issue are you experiencing? Describe it in one message and I will prepare a support ticket draft.' }],
        nextWorkflow: { type: 'awaiting-support-issue' },
        memoryAction: 'support-ticket-started',
      };
    case 'SUPPORT_PROBLEM': {
      const draft = buildSupportDraft(trimmed);
      return {
        messages: [{
          text: `${pickVariant(ORION_RESPONSE_VARIANTS.support, trimmed.length)} ${draft.subject}. Would you like me to create a support ticket?`,
          choices: [
            { id: 'support-yes', label: 'Yes, create ticket', trigger: { type: 'open-support-ticket', draft } },
            { id: 'support-no', label: 'No, not now', followUpMessage: 'Understood. I will keep it conversational unless you want the tracked support flow.' },
          ],
        }],
        nextWorkflow: { type: 'confirm-support-ticket', issue: draft.message, draft },
        memoryAction: 'support-problem-detected',
      };
    }
    case 'PLATFORM_TOUR':
      return {
        messages: [
          { text: `${pageContext.knowledge.label} is currently active. ${pageContext.knowledge.summary}` },
          { text: 'If you want the full workflow walkthrough, I am opening the platform guide.', trigger: { type: 'navigate', href: '/platform' } },
        ],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'platform-tour',
      };
    case 'RISK_GUIDANCE': {
      const guidance = user.onboardingChallenge === 'risk_management'
        ? 'Your onboarding profile already points to risk management as a priority, so I would protect invalidation discipline before chasing activity.'
        : 'Treat invalidation as the gatekeeper. If the invalidation is weak or unclear, the setup is not ready for execution.';
      return {
        messages: [{ text: guidance }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'risk-guidance',
      };
    }
    case 'STRATEGY_HELP':
      return {
        messages: [{ text: 'Orion is built around structure, liquidity, imbalance, invalidation, and execution timing. Ask about BOS, CHOCH, FVG, or setup quality if you want a specific breakdown.' }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'strategy-help',
      };
    case 'ACCOUNT_ASSISTANCE':
      return {
        messages: [{ text: `Your current subscription is ${user.subscription ?? 'FREE'}. ${user.onboardingGoal ? `Your onboarding goal is ${user.onboardingGoal.replace(/_/g, ' ')}.` : 'Your onboarding profile is available for Orion personalization.'}` }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'account-assistance',
      };
    case 'TRADING_GLOSSARY_BOS':
      return { messages: [{ text: ORION_GLOSSARY.BOS }], nextWorkflow: { type: 'idle' }, memoryAction: 'glossary-bos' };
    case 'TRADING_GLOSSARY_CHOCH':
      return { messages: [{ text: ORION_GLOSSARY.CHOCH }], nextWorkflow: { type: 'idle' }, memoryAction: 'glossary-choch' };
    case 'TRADING_GLOSSARY_FVG':
      return { messages: [{ text: ORION_GLOSSARY.FVG }], nextWorkflow: { type: 'idle' }, memoryAction: 'glossary-fvg' };
    case 'TRADE_RADAR_INVALIDATION':
      return {
        messages: [{ text: 'A setup is invalidated when price action or structure stops matching the original thesis. On Trade Radar that usually means the market violated the planned invalidation level or the conditions no longer support the same entry logic.' }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'radar-invalidation',
      };
    case 'EXPLAIN_SETUP':
      if (pageContext.focusContext?.kind === 'analysis') {
        return {
          messages: [{ text: `This active analysis is ${pageContext.focusContext.analysis.pair} ${pageContext.focusContext.analysis.timeframe} with ${pageContext.focusContext.analysis.confidence}% confidence, ${pageContext.focusContext.analysis.trend} structure, and a ${pageContext.focusContext.analysis.signalType} setup. Orion would validate invalidation and execution timing before promoting it.` }],
          nextWorkflow: { type: 'idle' },
          memoryAction: 'explain-setup',
        };
      }
      if (pageContext.focusContext?.kind === 'live-signal') {
        return {
          messages: [{ text: `The selected live setup is ${pageContext.focusContext.signal.symbolLabel} ${pageContext.focusContext.signal.direction.toUpperCase()} on ${pageContext.focusContext.signal.timeframe} with ${pageContext.focusContext.signal.confidence}% confidence and ${pageContext.focusContext.signal.grade} quality. Orion would only promote it if structure, liquidity, and RR still agree.` }],
          nextWorkflow: { type: 'idle' },
          memoryAction: 'explain-live-setup',
        };
      }
      return {
        messages: [{ text: 'Select an active analysis or live setup first and I will explain the current structure, confidence, and execution implications.' }],
        nextWorkflow: { type: 'idle' },
      };
    case 'COMMAND_CENTER_HELP':
      return {
        messages: [{ text: 'Command Center is where Orion translates structure into execution logic: readiness, invalidation, timing, and live context. It should reduce emotional decisions, not add noise.' }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'command-center-help',
      };
    case 'UNKNOWN':
    default:
      return {
        messages: [{ text: `I can help with analysis, Trade Radar, journal insights, subscriptions, support, glossary terms, and platform workflows. ${pageContext.knowledge.suggestions[0]}` }],
        nextWorkflow: { type: 'idle' },
      };
  }
}