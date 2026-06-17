'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OrionChatWindow } from '@/orion/components/OrionChatWindow';
import { OrionFloatingButton } from '@/orion/components/OrionFloatingButton';
import { OrionMemoryStore } from '@/orion/memory/OrionMemoryStore';
import { emitOrionWorkflow, storePendingOrionWorkflow } from '@/orion/services/orionWorkflowEvents';
import { OrionPageAwarenessProvider, useOrionPageAwareness } from '@/orion/state/OrionPageAwarenessProvider';
import { buildOrionWelcome, resolveOrionReply } from '@/orion/workflows/OrionWorkflowEngine';
import { api, type AnalysisResult } from '@/lib/api';
import { classifyChartUploadError, getChartUploadErrorMessage, prepareChartUploadFile } from '@/lib/chart-upload';
import type {
  OrionChatChoice,
  OrionConversationWorkflow,
  OrionMessage,
  OrionPlannedMessage,
  OrionQuickActionId,
  OrionWorkflowTrigger,
} from '@/orion/types';

const PUBLIC_MENTOR_PATHS = new Set(['/', '/platform', '/pricing', '/checkout', '/trade-examples']);

const QUICK_ACTION_PROMPTS: Record<OrionQuickActionId, string> = {
  'create-analysis': 'Analyze my chart',
  'open-radar': 'Open Trade Radar',
  'review-journal': 'Review my journal',
  'market-overview': 'Give me a market overview',
  'subscription-help': 'I need subscription help',
  'create-support-ticket': 'Create a support ticket',
  'platform-tour': 'Give me a platform tour',
  'risk-guidance': 'Give me risk guidance',
  'strategy-help': 'I need strategy help',
  'account-assistance': 'I need account assistance',
};

function createMessage(role: 'assistant' | 'user', text: string, animate = false, choices?: OrionChatChoice[]): OrionMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: Date.now(),
    animate,
    choices,
  };
}

function formatAnalysisPrice(value: number | null | undefined, pair: string) {
  if (value == null || Number.isNaN(value)) {
    return 'N/A';
  }

  const upperPair = pair.toUpperCase();
  const decimals = upperPair.includes('JPY') ? 3 : value >= 1000 ? 2 : 5;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function getEntryPrice(analysis: AnalysisResult) {
  if (analysis.entry != null) {
    return analysis.entry;
  }

  const primaryZone = analysis.entryZone ?? analysis.entryPlan?.entryZone ?? null;
  if (primaryZone?.min != null && primaryZone?.max != null) {
    return (primaryZone.min + primaryZone.max) / 2;
  }

  return analysis.currentPrice ?? null;
}

function buildSignalOnlyMessages(analysis: AnalysisResult): OrionPlannedMessage[] {
  const entry = getEntryPrice(analysis);
  const tp = analysis.takeProfit1 ?? analysis.takeProfit2 ?? analysis.takeProfit3 ?? null;

  return [{
    text: [
      `${analysis.pair} ${analysis.timeframe} signal read complete.`,
      `Bias: ${(analysis.entryPlan?.bias ?? analysis.bias ?? analysis.trend ?? 'none').toString().toUpperCase()}.`,
      `Entry: ${formatAnalysisPrice(entry, analysis.pair)}.`,
      `SL: ${formatAnalysisPrice(analysis.stopLoss ?? analysis.invalidationLevel ?? null, analysis.pair)}.`,
      `TP: ${formatAnalysisPrice(tp, analysis.pair)}.`,
      `Confidence: ${analysis.quality?.confidence ?? analysis.confidence}%`,
    ].join(' '),
    choices: [
      { id: 'chat-analysis-full-followup', label: 'Explain the full setup', followUpMessage: `${analysis.message} ${analysis.reasoning}` },
      { id: 'chat-analysis-new', label: 'Analyze another chart', followUpMessage: 'Attach another chart when you are ready and I will walk through it with you.' },
    ],
  }];
}

function buildFullAnalysisMessages(analysis: AnalysisResult): OrionPlannedMessage[] {
  const entry = getEntryPrice(analysis);
  const levels = [
    `Entry ${formatAnalysisPrice(entry, analysis.pair)}`,
    `SL ${formatAnalysisPrice(analysis.stopLoss ?? analysis.invalidationLevel ?? null, analysis.pair)}`,
    `TP1 ${formatAnalysisPrice(analysis.takeProfit1 ?? null, analysis.pair)}`,
  ].join(' • ');

  return [
    {
      text: `${analysis.pair} ${analysis.timeframe} is reading as ${analysis.trend.toUpperCase()} with ${analysis.confidence}% confidence and a ${analysis.signalType.toUpperCase()} setup profile. ${analysis.message}`,
    },
    {
      text: `${analysis.reasoning} Structure is ${analysis.structure?.state ?? 'developing'}, BOS is ${analysis.structure?.bos ?? 'none'}, and confirmation is ${analysis.confirmationNeeded ? `still needed via ${analysis.confirmation.toUpperCase()}` : 'already strong enough for active review'}.`,
    },
    {
      text: `Key levels: ${levels}.`,
      choices: [
        { id: 'chat-analysis-radar', label: 'Open Trade Radar', trigger: { type: 'navigate', href: '/dashboard/radar' } },
        { id: 'chat-analysis-command', label: 'Open Command Center', trigger: { type: 'navigate', href: '/dashboard/command-center' } },
      ],
    },
  ];
}

function wrapTextToLines(text: string, maxLineLength: number) {
  const words = text.split(' ').filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && nextLine.length > maxLineLength) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }

    currentLine = nextLine;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function formatPlannedMessage(message: OrionPlannedMessage): OrionPlannedMessage {
  const normalizedText = message.text.replace(/\s+/g, ' ').trim();
  if (normalizedText.length <= 140) {
    return { ...message, text: normalizedText };
  }

  const sentences = normalizedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [normalizedText];
  if (sentences.length <= 1) {
    return {
      ...message,
      text: wrapTextToLines(normalizedText, 38).join('\n'),
    };
  }

  const lines: string[] = [];
  let currentBlock = '';

  for (const sentence of sentences) {
    const nextBlock = currentBlock ? `${currentBlock} ${sentence}` : sentence;
    if (currentBlock && nextBlock.length > 110) {
      lines.push(...wrapTextToLines(currentBlock, 38));
      currentBlock = sentence;
      continue;
    }

    currentBlock = nextBlock;
  }

  if (currentBlock) {
    lines.push(...wrapTextToLines(currentBlock, 38));
  }

  return {
    ...message,
    text: lines.join('\n'),
  };
}

function OrionMentorAssistantShell({ surface = 'floating' }: { surface?: 'floating' | 'embedded' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useAuth();
  const { pageContext, activity, greeting, firstName } = useOrionPageAwareness();
  const [open, setOpen] = useState(surface === 'embedded');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<OrionMessage[]>([]);
  const [workflow, setWorkflow] = useState<OrionConversationWorkflow>({ type: 'idle' });
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFileLabel, setAttachedFileLabel] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);
  const queueIdRef = useRef(0);

  const executeTrigger = (trigger: OrionWorkflowTrigger) => {
    if (trigger.type === 'navigate') {
      router.push(trigger.href);
      return;
    }

    if (trigger.type === 'open-analysis-upload') {
      if (pathname !== '/analyze') {
        storePendingOrionWorkflow(trigger);
        router.push('/analyze');
        return;
      }

      emitOrionWorkflow(trigger);
      return;
    }

    if (trigger.type === 'open-support-ticket') {
      emitOrionWorkflow(trigger);
    }
  };

  const queueAssistantMessages = async (plannedMessages: OrionPlannedMessage[]) => {
    const queueId = ++queueIdRef.current;
    const formattedMessages = plannedMessages.map(formatPlannedMessage);

    for (const plannedMessage of formattedMessages) {
      setIsTyping(true);
      const typingDelay = Math.min(950, Math.max(260, plannedMessage.text.length * 9));
      await new Promise((resolve) => window.setTimeout(resolve, typingDelay));

      if (queueId !== queueIdRef.current) {
        return;
      }

      setIsTyping(false);
      setMessages((current) => [...current.slice(-19), createMessage('assistant', plannedMessage.text, true, plannedMessage.choices)]);

      if (plannedMessage.trigger) {
        executeTrigger(plannedMessage.trigger);
      }
    }

    setIsTyping(false);
  };

  const resetChatAnalysisWorkflow = () => {
    setAttachedFileLabel(null);
    setWorkflow({ type: 'idle' });
  };

  const runChatAnalysis = async (
    chartFile: File,
    pair: string,
    timeframe: string,
    currentPrice: string,
    mode: 'full' | 'signal-only',
  ) => {
    if (!token) {
      await queueAssistantMessages([{ text: 'You need to be signed in before I can analyze a chart from chat.' }]);
      resetChatAnalysisWorkflow();
      return;
    }

    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('chart', chartFile);
      formData.append('pair', pair);
      formData.append('timeframe', timeframe);
      formData.append('currentPrice', currentPrice);

      const result = await api.analyzeChartUpload(formData, token);

      if (result.queued && result.jobId) {
        await queueAssistantMessages([{
          text: 'Your chart has been submitted and is processing. I am opening the analysis queue so you can follow the result.',
          trigger: { type: 'navigate', href: `/analyze/queue?jobId=${encodeURIComponent(result.jobId)}&analysisId=${encodeURIComponent(result.analysisId ?? '')}` },
        }]);
        resetChatAnalysisWorkflow();
        return;
      }

      if (!result.analysis) {
        throw new Error(result.message || 'I could not complete the chart analysis from chat.');
      }

      const messagesToSend = mode === 'signal-only'
        ? buildSignalOnlyMessages(result.analysis)
        : buildFullAnalysisMessages(result.analysis);

      OrionMemoryStore.rememberAction(mode === 'signal-only' ? 'chat-signal-analysis' : 'chat-full-analysis');
      await queueAssistantMessages(messagesToSend);
      resetChatAnalysisWorkflow();
    } catch (error: any) {
      await queueAssistantMessages([{ text: error?.message || 'I was unable to analyze that chart from chat.' }]);
      resetChatAnalysisWorkflow();
    } finally {
      setIsTyping(false);
    }
  };

  const handleAttachFile = async (file: File) => {
    if (surface === 'floating') setOpen(true);

    try {
      const prepared = await prepareChartUploadFile(file);
      setAttachedFileLabel(prepared.file.name);
      setMessages((current) => [...current.slice(-19), createMessage('user', `Attached chart: ${prepared.file.name}`)]);
      setWorkflow({ type: 'awaiting-chat-analysis-market', chartFile: prepared.file, chartFileName: prepared.file.name });
      await queueAssistantMessages([{ text: `Chart attached successfully. What pair, index, or market is this for?` }]);
    } catch (error) {
      const type = classifyChartUploadError(error);
      await queueAssistantMessages([{ text: getChartUploadErrorMessage(type) }]);
    }
  };

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const welcomeMessages = buildOrionWelcome({
      pageContext,
      activity,
      user: {
        firstName,
        subscription: user?.subscription ?? null,
        onboardingChallenge: user?.onboarding?.responses?.biggestChallenge ?? null,
        onboardingGoal: user?.onboarding?.responses?.primaryGoal ?? null,
      },
    });

    setMessages(welcomeMessages.map((message) => createMessage('assistant', message.text, true, message.choices)));
    initializedRef.current = true;
    lastPathRef.current = pageContext.pathname;
  }, [activity, firstName, pageContext, user?.onboarding?.responses?.biggestChallenge, user?.onboarding?.responses?.primaryGoal, user?.subscription]);

  useEffect(() => {
    if (!initializedRef.current || lastPathRef.current === pageContext.pathname) {
      return;
    }

    lastPathRef.current = pageContext.pathname;
    setMessages((current) => [
      ...current.slice(-19),
      createMessage('assistant', `I detected that you are on ${pageContext.knowledge.label}. ${pageContext.knowledge.summary}`, true),
    ]);
  }, [pageContext]);

  const submitPrompt = async (rawInput: string, displayText?: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return;
    }

    if (surface === 'floating') setOpen(true);
    setInput('');
    setMessages((current) => [...current.slice(-19), createMessage('user', displayText ?? trimmed)]);
    OrionMemoryStore.rememberInteraction(trimmed);

    if (workflow.type === 'awaiting-chat-analysis-market') {
      setWorkflow({
        type: 'awaiting-chat-analysis-timeframe',
        chartFile: workflow.chartFile,
        chartFileName: workflow.chartFileName,
        pair: trimmed.toUpperCase(),
      });
      await queueAssistantMessages([{ text: `Understood. What timeframe should I use for ${trimmed.toUpperCase()}?` }]);
      return;
    }

    if (workflow.type === 'awaiting-chat-analysis-timeframe') {
      setWorkflow({
        type: 'awaiting-chat-analysis-price',
        chartFile: workflow.chartFile,
        chartFileName: workflow.chartFileName,
        pair: workflow.pair,
        timeframe: trimmed.toUpperCase(),
      });
      await queueAssistantMessages([{ text: `What is the current price for ${workflow.pair} on ${trimmed.toUpperCase()}?` }]);
      return;
    }

    if (workflow.type === 'awaiting-chat-analysis-price') {
      const normalizedPrice = trimmed.replace(/,/g, '');
      if (!/^\d*\.?\d+$/.test(normalizedPrice)) {
        await queueAssistantMessages([{ text: 'Please send the current price as a number, for example 1.0850 or 2350.25.' }]);
        return;
      }

      setWorkflow({
        type: 'awaiting-chat-analysis-mode',
        chartFile: workflow.chartFile,
        chartFileName: workflow.chartFileName,
        pair: workflow.pair,
        timeframe: workflow.timeframe,
        currentPrice: normalizedPrice,
      });
      await queueAssistantMessages([{
        text: 'Do you want a full analysis or a trade signal only?',
        choices: [
          { id: 'chat-analysis-full', label: 'Full analysis' },
          { id: 'chat-analysis-signal', label: 'Trade signal only' },
        ],
      }]);
      return;
    }

    if (workflow.type === 'awaiting-chat-analysis-mode') {
      const normalizedMode = trimmed.toLowerCase();
      if (normalizedMode.includes('full')) {
        await runChatAnalysis(workflow.chartFile, workflow.pair, workflow.timeframe, workflow.currentPrice, 'full');
        return;
      }

      if (normalizedMode.includes('signal')) {
        await runChatAnalysis(workflow.chartFile, workflow.pair, workflow.timeframe, workflow.currentPrice, 'signal-only');
        return;
      }

      await queueAssistantMessages([{ text: 'Reply with “full analysis” or “trade signal only” so I know which result format you want.' }]);
      return;
    }

    const result = resolveOrionReply({
      input: trimmed,
      pageContext,
      workflow,
      activity,
      user: {
        firstName,
        subscription: user?.subscription ?? null,
        onboardingChallenge: user?.onboarding?.responses?.biggestChallenge ?? null,
        onboardingGoal: user?.onboarding?.responses?.primaryGoal ?? null,
      },
    });

    setWorkflow(result.nextWorkflow);
    OrionMemoryStore.rememberAction(result.memoryAction ?? null);
    await queueAssistantMessages(result.messages);
  };

  const handleChoice = async (choice: OrionChatChoice) => {
    if (
      workflow.type === 'confirm-analysis-intent'
      || workflow.type === 'choose-analysis-surface'
      || workflow.type === 'choose-live-chart-market'
    ) {
      await submitPrompt(choice.label, choice.label);
      return;
    }

    setMessages((current) => [...current.slice(-19), createMessage('user', choice.label)]);

    if (workflow.type === 'awaiting-chat-analysis-mode') {
      if (choice.id === 'chat-analysis-full') {
        await runChatAnalysis(workflow.chartFile, workflow.pair, workflow.timeframe, workflow.currentPrice, 'full');
        return;
      }

      if (choice.id === 'chat-analysis-signal') {
        await runChatAnalysis(workflow.chartFile, workflow.pair, workflow.timeframe, workflow.currentPrice, 'signal-only');
        return;
      }
    }

    setWorkflow({ type: 'idle' });

    if (choice.trigger) {
      executeTrigger(choice.trigger);
      const followUp = choice.followUpMessage ?? (choice.trigger.type === 'open-support-ticket'
        ? 'The support desk is open now with your Orion draft ready to review.'
        : choice.trigger.type === 'open-analysis-upload'
          ? 'The chart upload workflow is open now.'
          : 'Moving there now.');
      await queueAssistantMessages([{ text: followUp }]);
      return;
    }

    if (choice.followUpMessage) {
      await queueAssistantMessages([{ text: choice.followUpMessage }]);
    }
  };

  return (
    <>
      <div className={surface === 'floating'
        ? 'pointer-events-none fixed inset-x-0 bottom-16 z-[80] flex justify-center px-3 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:block sm:w-[23rem] sm:px-0'
        : 'h-full min-h-0 w-full overflow-hidden'
      }>
        <OrionChatWindow
          open={surface === 'embedded' ? true : open}
          variant={surface}
          greeting={greeting}
          pageLabel={pageContext.knowledge.label}
          pageSummary={pageContext.knowledge.summary}
          messages={messages}
          quickActions={pageContext.quickActions}
          input={input}
          isTyping={isTyping}
          attachedFileLabel={attachedFileLabel}
          attachDisabled={isTyping}
          onClose={() => setOpen(false)}
          onInputChange={setInput}
          onSubmit={() => {
            void submitPrompt(input);
          }}
          onAttachFile={(file) => {
            void handleAttachFile(file);
          }}
          onQuickAction={(actionId) => {
            void submitPrompt(
              QUICK_ACTION_PROMPTS[actionId],
              pageContext.quickActions.find((action) => action.id === actionId)?.label ?? QUICK_ACTION_PROMPTS[actionId],
            );
          }}
          onChoice={(choice) => {
            void handleChoice(choice);
          }}
        />
      </div>
      {surface === 'floating' ? (
        <div className="pointer-events-none fixed bottom-3 right-3 z-[80] sm:bottom-6 sm:right-6">
          <OrionFloatingButton open={open} onClick={() => setOpen((current) => !current)} />
        </div>
      ) : null}
    </>
  );
}

export function OrionMentorChatExperience({ surface = 'embedded' }: { surface?: 'floating' | 'embedded' }) {
  return (
    <OrionPageAwarenessProvider>
      <OrionMentorAssistantShell surface={surface} />
    </OrionPageAwarenessProvider>
  );
}

export function OrionMentorAssistant() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isWorkspaceSurface = pathname.startsWith('/dashboard') || pathname.startsWith('/analyze');
  const isPublicSurface = PUBLIC_MENTOR_PATHS.has(pathname);
  const isDedicatedOrionPage = pathname === '/dashboard/orion';
  const shouldRender = isPublicSurface || (Boolean(user) && isWorkspaceSurface);

  if (!shouldRender || isDedicatedOrionPage) {
    return null;
  }

  return <OrionMentorChatExperience surface="floating" />;
}

export default OrionMentorAssistant;
