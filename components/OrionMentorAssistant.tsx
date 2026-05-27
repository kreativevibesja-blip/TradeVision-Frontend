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

function OrionMentorAssistantShell() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { pageContext, activity, greeting, firstName } = useOrionPageAwareness();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<OrionMessage[]>([]);
  const [workflow, setWorkflow] = useState<OrionConversationWorkflow>({ type: 'idle' });
  const [isTyping, setIsTyping] = useState(false);
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

    for (const plannedMessage of plannedMessages) {
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

    setOpen(true);
    setInput('');
    setMessages((current) => [...current.slice(-19), createMessage('user', displayText ?? trimmed)]);
    OrionMemoryStore.rememberInteraction(trimmed);

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
    setMessages((current) => [...current.slice(-19), createMessage('user', choice.label)]);
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
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-4 sm:bottom-6 sm:right-6">
      <OrionChatWindow
        open={open}
        greeting={greeting}
        pageLabel={pageContext.knowledge.label}
        pageSummary={pageContext.knowledge.summary}
        messages={messages}
        quickActions={pageContext.quickActions}
        input={input}
        isTyping={isTyping}
        onClose={() => setOpen(false)}
        onInputChange={setInput}
        onSubmit={() => {
          void submitPrompt(input);
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
      <OrionFloatingButton open={open} onClick={() => setOpen((current) => !current)} />
    </div>
  );
}

export function OrionMentorAssistant() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isWorkspaceSurface = pathname.startsWith('/dashboard') || pathname.startsWith('/analyze');
  const isPublicSurface = PUBLIC_MENTOR_PATHS.has(pathname);
  const shouldRender = isPublicSurface || (Boolean(user) && isWorkspaceSurface);

  if (!shouldRender) {
    return null;
  }

  return (
    <OrionPageAwarenessProvider>
      <OrionMentorAssistantShell />
    </OrionPageAwarenessProvider>
  );
}

export default OrionMentorAssistant;