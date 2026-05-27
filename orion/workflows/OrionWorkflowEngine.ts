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

function buildTradeVisionExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'TradeVision AI is a trading operating system built to help traders move from chart analysis into structured execution instead of impulsive decision-making. It combines AI chart analysis, Trade Radar tracking, journal intelligence, execution workflows, and guided platform routing so users can understand structure, define invalidation, protect risk, and act with more discipline.',
    choices: [
      { id: 'tv-what-workspaces', label: 'What does each workspace do?', followUpMessage: 'The core flow is simple: Analysis reads structure, Command Center turns that into an execution plan, Trade Radar monitors active ideas, and Journal review improves decision quality over time. GoldX stays separate as a dedicated execution product.' },
      { id: 'tv-benefits', label: 'What are the benefits?', followUpMessage: 'The main benefits are clarity, structure, and consistency. TradeVision is designed to reduce random trade selection, improve invalidation discipline, and keep your workflow organized across analysis, tracking, and review.' },
      { id: 'tv-start', label: 'How should I start?', followUpMessage: 'Start with chart analysis. Upload a clean chart, let Orion read structure, and then promote only the strong setups into execution planning or Trade Radar.' },
    ],
  }];
}

function buildTradeRadarExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'Trade Radar is the workspace that monitors trade ideas after they are worth tracking. It is not there to create random setups. Its job is to watch whether the original thesis still holds, whether price is approaching the decision zone, and whether the setup still deserves attention instead of emotional forcing.',
    choices: [
      { id: 'radar-when-use', label: 'When should I use it?', followUpMessage: 'Use Trade Radar after a setup already has structure, invalidation, and a clear reason to exist. It is a monitoring tool, not a replacement for trade selection.' },
      { id: 'radar-benefit', label: 'What is the main benefit?', followUpMessage: 'The main benefit is focus. Trade Radar keeps strong ideas visible without making you chase every chart or rely on memory.' },
      { id: 'radar-open', label: 'Open Trade Radar', trigger: { type: 'navigate', href: '/dashboard/radar' } },
    ],
  }];
}

function buildCommandCenterExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'Command Center is where TradeVision turns analysis into execution logic. It helps you decide whether a setup is actually ready, where invalidation belongs, whether timing is clean, and whether the trade deserves capital. It is built to reduce emotional execution, not decorate the chart with more noise.',
    choices: [
      { id: 'cc-why', label: 'Why does it matter?', followUpMessage: 'Because many traders can identify a setup but still execute it poorly. Command Center exists to close that gap between seeing the idea and managing it correctly.' },
      { id: 'cc-vs-analysis', label: 'How is it different from analysis?', followUpMessage: 'Analysis reads the market. Command Center decides whether that read is mature enough for execution. One explains structure; the other pressures the trade plan.' },
      { id: 'cc-risk', label: 'Does it help with risk?', followUpMessage: 'Yes. A proper execution plan is where risk becomes concrete. If invalidation, size, and timing are weak, the trade should not be promoted.' },
    ],
  }];
}

function buildPlanComparisonExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'Pro is for traders who want stronger core AI chart analysis without stepping into the deepest workflow tier. PRO+ is for traders who want more complete execution support, premium scanning workflows, and a stronger operating system around analysis, tracking, and decision quality. The right choice depends on workflow depth, not hype.',
    choices: [
      { id: 'plan-who-pro', label: 'Who should choose Pro?', followUpMessage: 'Choose Pro if your main goal is better analysis quality and you do not yet need the deepest execution and scanner workflow stack.' },
      { id: 'plan-who-proplus', label: 'Who should choose PRO+?', followUpMessage: 'Choose PRO+ if you want the more complete operating environment: stronger execution support, premium workflow depth, and more advanced decision tools.' },
      { id: 'plan-open-pricing', label: 'Open pricing', trigger: { type: 'navigate', href: '/pricing' } },
    ],
  }];
}

function buildGoldXExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'GoldX is a dedicated Gold-focused execution environment inside the TradeVision ecosystem. It is not a generic add-on. It exists for traders who specifically want the GoldX workflow, operating intelligence, and execution control built around that product path.',
    choices: [
      { id: 'goldx-who', label: 'Who is GoldX for?', followUpMessage: 'GoldX is for traders who specifically want the Gold execution ecosystem rather than the broader core TradeVision workflow alone.' },
      { id: 'goldx-difference', label: 'How is it different?', followUpMessage: 'The difference is specialization. GoldX is not just more features. It is a separate workflow stack centered on GoldX operating logic and execution management.' },
      { id: 'goldx-open', label: 'Open GoldX', trigger: { type: 'navigate', href: '/dashboard/goldx' } },
    ],
  }];
}

function buildJournalIntelligenceExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'Journal intelligence is the layer that turns your trading history into feedback you can actually use. Instead of just storing trades, it surfaces patterns in execution quality, consistency, recurring mistakes, and behavior so you can improve process instead of repeating noise.',
    choices: [
      { id: 'journal-benefit', label: 'Why does it matter?', followUpMessage: 'Because most traders do not fail from a lack of information. They fail from repeated undisciplined behavior. Journal intelligence helps expose those patterns clearly.' },
      { id: 'journal-what-shows', label: 'What does it show?', followUpMessage: 'It can highlight recurring strengths, common breakdowns, session quality, discipline drift, and which setups actually deserve more trust over time.' },
      { id: 'journal-open', label: 'Review my journal', trigger: { type: 'navigate', href: '/dashboard' } },
    ],
  }];
}

function buildBeginnerWorkflowExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'If you are a beginner, the cleanest way to use TradeVision is step by step. First, learn what a valid setup looks like. Second, upload charts and let Orion explain structure and invalidation. Third, only track ideas that are worth monitoring. Fourth, review your decisions so your process improves instead of staying random.',
    choices: [
      { id: 'beginner-step-analysis', label: 'Start with analysis', trigger: { type: 'open-analysis-upload' } },
      { id: 'beginner-step-platform', label: 'Show me the platform flow', trigger: { type: 'navigate', href: '/platform' } },
      { id: 'beginner-step-risk', label: 'Teach me risk first', followUpMessage: 'That is a strong starting point. If you understand invalidation, size, and discipline early, you avoid building bad habits under pressure.' },
    ],
  }];
}

function buildRiskManagementExplanation(): OrionPlannedMessage[] {
  return [{
    text: 'Risk management is the process of controlling downside before you think about upside. In practice that means defining invalidation before entry, risking only a small and repeatable amount per trade, protecting capital during weak conditions, and refusing trades that do not justify the risk.',
    choices: [
      { id: 'risk-why-important', label: 'Why is it so important?', followUpMessage: 'Because a trader without risk control will eventually let one bad decision erase many good ones. Skill matters, but survival comes first.' },
      { id: 'risk-how-much', label: 'How much should I risk?', followUpMessage: 'Most traders stay small and consistent. The exact number depends on the account and the strategy, but the principle is the same: keep risk small enough that one trade never damages your decision quality.' },
      { id: 'risk-improve', label: 'How do I improve it?', followUpMessage: 'Improve it by defining invalidation first, sizing down when conditions are unclear, journaling mistakes, and treating patience as part of the edge rather than a delay.' },
    ],
  }];
}

function buildRiskManagementImprovement(user: WorkflowInput['user']): OrionPlannedMessage[] {
  const personalization = user.onboardingChallenge === 'risk_management'
    ? 'Your onboarding already flags risk management as a pressure point, so the fix is not more activity. The fix is stricter structure around entries, invalidation, and size.'
    : 'Good risk management is not complicated, but it does require consistency under pressure.';

  return [{
    text: `${personalization} Focus on five habits: decide risk before entry, place stops where the trade thesis actually fails, reduce size when market conditions are messy, avoid revenge trading after losses, and review every rule-break in your journal.` ,
    choices: [
      { id: 'risk-habit-sizing', label: 'Help me with position sizing', followUpMessage: 'Think from loss first, not profit first. Size the trade so a normal stopped-out result is acceptable both financially and emotionally.' },
      { id: 'risk-habit-losses', label: 'How do I handle losing streaks?', followUpMessage: 'Slow down immediately. When losses cluster, the job is to protect decision quality, reduce exposure, and wait for clean structure instead of trying to win it back quickly.' },
      { id: 'risk-habit-discipline', label: 'How do I stay disciplined?', followUpMessage: 'Discipline improves when rules are specific. If entry, invalidation, and risk are not defined in advance, discipline will usually fail in real time.' },
    ],
  }];
}

function buildTradingAdviceResponse(pageContext: OrionPageContext): OrionPlannedMessage[] {
  return [{
    text: `I will be direct with you: I cannot tell you to take a specific trade blindly, and I will not feed emotional decision-making. What I can do is help you make a stronger decision with structure, invalidation, timing, and risk. If conditions are unclear, the bold move is patience, not action. ${pageContext.knowledge.summary}`,
    choices: [
      { id: 'advice-analyze', label: 'Analyze my chart first', trigger: { type: 'open-analysis-upload' } },
      { id: 'advice-risk', label: 'Give me risk guidance', followUpMessage: 'Start by protecting capital. If the setup does not have clear invalidation and acceptable downside, it is not ready for execution.' },
      { id: 'advice-setup', label: 'Help me judge a setup', followUpMessage: 'Bring me the setup context or chart. I will help you judge structure, liquidity, invalidation, and whether the trade is actually worth taking.' },
    ],
  }];
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
    case 'TRADEVISION_EXPLAIN':
      return {
        messages: buildTradeVisionExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'platform-tour',
      };
    case 'TRADE_RADAR_EXPLAIN':
      return {
        messages: buildTradeRadarExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'opened-radar',
      };
    case 'COMMAND_CENTER_EXPLAIN':
      return {
        messages: buildCommandCenterExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'command-center-help',
      };
    case 'PLAN_COMPARISON_EXPLAIN':
      return {
        messages: buildPlanComparisonExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'subscription-help',
      };
    case 'GOLDX_EXPLAIN':
      return {
        messages: buildGoldXExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'account-assistance',
      };
    case 'JOURNAL_INTELLIGENCE_EXPLAIN':
      return {
        messages: buildJournalIntelligenceExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'reviewed-journal',
      };
    case 'BEGINNER_WORKFLOW_EXPLAIN':
      return {
        messages: buildBeginnerWorkflowExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'platform-tour',
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
    case 'RISK_MANAGEMENT_EXPLAIN':
      return {
        messages: buildRiskManagementExplanation(),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'risk-guidance',
      };
    case 'RISK_MANAGEMENT_IMPROVE':
      return {
        messages: buildRiskManagementImprovement(user),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'risk-guidance',
      };
    case 'RISK_GUIDANCE': {
      const guidance = user.onboardingChallenge === 'risk_management'
        ? 'Your onboarding profile already points to risk management as a priority, so I would protect invalidation discipline before chasing activity.'
        : 'Treat invalidation as the gatekeeper. If the invalidation is weak or unclear, the setup is not ready for execution.';
      return {
        messages: [{
          text: guidance,
          choices: [
            { id: 'risk-define', label: 'What is risk management?', followUpMessage: 'Risk management means controlling downside before chasing upside. You define invalidation, size appropriately, and refuse trades that do not justify the exposure.' },
            { id: 'risk-improve-more', label: 'How do I get better at it?', followUpMessage: 'Get better by planning risk before entry, keeping size consistent, reducing activity in poor conditions, and reviewing every discipline failure honestly.' },
          ],
        }],
        nextWorkflow: { type: 'idle' },
        memoryAction: 'risk-guidance',
      };
    }
    case 'TRADING_ADVICE':
      return {
        messages: buildTradingAdviceResponse(pageContext),
        nextWorkflow: { type: 'idle' },
        memoryAction: 'strategy-help',
      };
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