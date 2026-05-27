import type { OrionPageKnowledge, OrionQuickAction, OrionQuickActionId } from '@/orion/types';

export const ORION_QUICK_ACTIONS: Record<OrionQuickActionId, OrionQuickAction> = {
  'create-analysis': {
    id: 'create-analysis',
    label: 'Create AI Analysis',
    description: 'Upload a chart and begin Orion structure analysis.',
    icon: 'analysis',
  },
  'open-radar': {
    id: 'open-radar',
    label: 'Open Trade Radar',
    description: 'Review monitored setups and confirmation progress.',
    icon: 'radar',
  },
  'review-journal': {
    id: 'review-journal',
    label: 'Review Journal',
    description: 'Surface your recent journal intelligence and trade insights.',
    icon: 'journal',
  },
  'market-overview': {
    id: 'market-overview',
    label: 'Market Overview',
    description: 'Get a route-aware summary of current conditions and workflows.',
    icon: 'market',
  },
  'subscription-help': {
    id: 'subscription-help',
    label: 'Subscription Help',
    description: 'Compare plans, trials, and premium workflow access.',
    icon: 'subscription',
  },
  'create-support-ticket': {
    id: 'create-support-ticket',
    label: 'Create Support Ticket',
    description: 'Describe an issue and let Orion open a tracked ticket.',
    icon: 'support',
  },
  'platform-tour': {
    id: 'platform-tour',
    label: 'Platform Tour',
    description: 'Understand what each workspace is built to do.',
    icon: 'tour',
  },
  'risk-guidance': {
    id: 'risk-guidance',
    label: 'Risk Guidance',
    description: 'Get mentor-style risk and discipline guidance.',
    icon: 'risk',
  },
  'strategy-help': {
    id: 'strategy-help',
    label: 'Strategy Help',
    description: 'Explain BOS, CHOCH, FVG, and Orion workflow logic.',
    icon: 'strategy',
  },
  'account-assistance': {
    id: 'account-assistance',
    label: 'Account Assistance',
    description: 'Review access, onboarding profile, and platform usage.',
    icon: 'account',
  },
};

export const ORION_PAGE_KNOWLEDGE: OrionPageKnowledge[] = [
  {
    id: 'home',
    label: 'Home',
    summary: 'Introduce the platform and route the user toward analysis, plans, or product understanding.',
    suggestions: [
      'Start with chart analysis if you want to see how Orion reads structure on your own chart.',
      'Use the platform guide if you want the fastest explanation of how each workspace fits together.',
      'Compare plans only after you understand which workflow depth you actually need.',
    ],
    quickActions: ['create-analysis', 'platform-tour', 'subscription-help', 'strategy-help'],
  },
  {
    id: 'platform',
    label: 'Platform Guide',
    summary: 'Explain how TradeVision workflows fit together as a trading operating system.',
    suggestions: [
      'Analysis leads to execution planning, not directly to blind entry.',
      'Trade Radar and journal intelligence matter most after a setup already has structure and invalidation.',
      'GoldX stays separate because it is a dedicated execution product, not a generic upsell.',
    ],
    quickActions: ['platform-tour', 'create-analysis', 'subscription-help', 'strategy-help'],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    summary: 'Help the user compare plans by workflow depth, not by vague feature count.',
    suggestions: [
      'Choose Pro if you mainly want stronger core AI analysis.',
      'Choose PRO+ if you need deeper execution support and premium scanning workflows.',
      'GoldX is its own execution stack for users who specifically want the Gold ecosystem.',
    ],
    quickActions: ['subscription-help', 'platform-tour', 'account-assistance', 'create-analysis'],
  },
  {
    id: 'checkout',
    label: 'Checkout',
    summary: 'Keep the purchase tied to clear workflow value and next steps.',
    suggestions: [
      'If you are hesitating, revisit the plan comparison instead of forcing the purchase.',
      'The right checkout decision should feel like workflow alignment, not pressure.',
      'Use Orion to clarify access questions before finalizing payment.',
    ],
    quickActions: ['subscription-help', 'platform-tour', 'account-assistance', 'create-support-ticket'],
  },
  {
    id: 'trade-examples',
    label: 'Trade Examples',
    summary: 'Teach structure, invalidation, and review quality through examples.',
    suggestions: [
      'A useful example explains why the setup was valid, not just the outcome.',
      'Journal review is where examples become part of your own process.',
      'Move from examples into real analysis to apply the framework on your own charts.',
    ],
    quickActions: ['review-journal', 'create-analysis', 'strategy-help', 'platform-tour'],
  },
  {
    id: 'analyze',
    label: 'Chart Analysis',
    summary: 'Upload a chart, get a structured read, and only move strong setups forward.',
    suggestions: [
      'Use clean chart context so Orion can read structure and invalidation accurately.',
      'The invalidation level matters more than the desire to be in a trade.',
      'When structure and liquidity disagree, wait for confirmation instead of forcing a setup.',
    ],
    quickActions: ['create-analysis', 'strategy-help', 'risk-guidance', 'open-radar'],
  },
  {
    id: 'analysis-queue',
    label: 'Analysis Queue',
    summary: 'Watch queued jobs finish, then promote completed work into execution review.',
    suggestions: [
      'Do not act on a queued analysis before the final structure and invalidation are available.',
      'Use completed queue results as the handoff into Command Center or Trade Radar.',
      'If a queued chart no longer matches market conditions, rerun analysis instead of forcing the old plan.',
    ],
    quickActions: ['create-analysis', 'open-radar', 'market-overview', 'create-support-ticket'],
  },
  {
    id: 'dashboard',
    label: 'Intelligence Dashboard',
    summary: 'Summarize activity, recent analyses, and the next best workflow.',
    suggestions: [
      'Recent analyses should be filtered before they are promoted into execution planning.',
      'Journal intelligence exists to improve consistency, not to create more trades.',
      'Use the dashboard to route into the right workspace instead of working from memory.',
    ],
    quickActions: ['market-overview', 'open-radar', 'review-journal', 'create-analysis'],
  },
  {
    id: 'tradingview',
    label: 'TradingView Live Analysis',
    summary: 'Monitor live structure, then promote only validated setups into tracking or planning.',
    suggestions: [
      'A live setup should still pass structure, liquidity, and RR checks at the moment you review it.',
      'Use Radar to monitor a live idea over time, not to replace trade judgment.',
      'When confidence decays near entry, let the setup go instead of forcing activity.',
    ],
    quickActions: ['open-radar', 'market-overview', 'strategy-help', 'risk-guidance'],
  },
  {
    id: 'deriv',
    label: 'Deriv Flow',
    summary: 'Work fast markets with stronger discipline around structure, timing, and invalidation.',
    suggestions: [
      'Fast instruments punish poor invalidation more aggressively than slower markets do.',
      'If session quality is weak, do not let speed trick you into calling noise a setup.',
      'Use the Deriv workspace to filter aggressively before promoting anything into tracking.',
    ],
    quickActions: ['market-overview', 'open-radar', 'risk-guidance', 'create-support-ticket'],
  },
  {
    id: 'command-center',
    label: 'Command Center',
    summary: 'Translate analysis into a disciplined execution plan.',
    suggestions: [
      'A strong invalidation level matters more than a fast entry.',
      'Execution planning should reduce emotional decision-making, not add more inputs.',
      'Protect capital first when volatility destabilizes the setup.',
    ],
    quickActions: ['risk-guidance', 'open-radar', 'market-overview', 'strategy-help'],
  },
  {
    id: 'radar',
    label: 'Trade Radar',
    summary: 'Track active setups and monitor whether the original thesis still holds.',
    suggestions: [
      'A monitored setup still needs judgment when price reaches the decision zone.',
      'Invalidation means the market stopped matching the original thesis, not that you should defend the trade idea.',
      'Trade Radar is best when every tracked setup has a clear reason for being there.',
    ],
    quickActions: ['open-radar', 'review-journal', 'risk-guidance', 'market-overview'],
  },
  {
    id: 'billing',
    label: 'Billing',
    summary: 'Manage access without breaking your workflow continuity.',
    suggestions: [
      'Your plan should match your workflow depth, not feature curiosity.',
      'Review the actual workspaces you use before changing plans.',
      'Use Orion to clarify what each subscription tier changes operationally.',
    ],
    quickActions: ['subscription-help', 'account-assistance', 'create-support-ticket', 'platform-tour'],
  },
  {
    id: 'referrals',
    label: 'Referrals',
    summary: 'Track referral performance while keeping platform usage and trading outcomes primary.',
    suggestions: [
      'Referral performance should not distract from your own process quality.',
      'A clear and disciplined workflow is the best referral engine.',
      'Use Orion to keep attention on execution quality first.',
    ],
    quickActions: ['account-assistance', 'subscription-help', 'market-overview', 'create-support-ticket'],
  },
  {
    id: 'goldx',
    label: 'GoldX',
    summary: 'Manage the GoldX workspace around confirmed market state and execution control.',
    suggestions: [
      'GoldX is strongest when the market still supports the model assumptions.',
      'Automation should increase discipline, not reduce it.',
      'Use Orion to clarify mode changes and workflow logic before changing settings.',
    ],
    quickActions: ['market-overview', 'risk-guidance', 'create-support-ticket', 'account-assistance'],
  },
  {
    id: 'goldx-pulse',
    label: 'GoldX Pulse',
    summary: 'Review GoldX operating intelligence before widening risk.',
    suggestions: [
      'Pulse should tell you when conditions are worth acting on, not encourage constant activity.',
      'Regime changes matter more than raw momentum spikes.',
      'Use Orion to understand what the current state implies before acting.',
    ],
    quickActions: ['market-overview', 'risk-guidance', 'account-assistance', 'create-support-ticket'],
  },
];

export const ORION_GLOSSARY = {
  BOS: 'Break of Structure. Orion uses BOS to confirm that the market has pushed through a prior structural level and may be transitioning into continuation or trend confirmation.',
  CHOCH: 'Change of Character. Orion uses CHOCH to flag a shift in market behavior that can signal an early reversal or a new directional phase.',
  FVG: 'Fair Value Gap. Orion uses FVGs to identify imbalance zones where price may revisit before continuation or rejection.',
  LIQUIDITY: 'Liquidity describes where stops, resting orders, and forced participation are likely concentrated. Orion reads sweeps and grabs around those levels as part of setup quality.',
};

export const ORION_SUBSCRIPTION_GUIDANCE = {
  FREE: 'Free is best for validating the chart-analysis workflow before committing capital or upgrading.',
  PRO: 'Pro is designed for traders who want stronger core AI analysis without moving into the deepest premium workflow tier.',
  TOP_TIER: 'PRO+ is built for traders who want stronger execution support, premium scanner workflows, and faster access to the operating system.',
  GOLDX: 'GoldX is a dedicated Gold execution stack and should be chosen when you specifically want the GoldX ecosystem.',
};

export const ORION_RESPONSE_VARIANTS = {
  transitions: ['Here is the cleanest path from here.', 'This is the strongest next step.', 'Let’s keep this structured.'],
  analysis: ['Upload your chart and Orion will begin structure analysis.', 'Bring in a clean chart and I will route you into the analysis flow.'],
  market: ['Current conditions deserve a structure-first read.', 'The market should be filtered before it is acted on.'],
  support: ['I can turn this into a tracked support ticket.', 'I can open a support ticket with the details you provide.'],
};