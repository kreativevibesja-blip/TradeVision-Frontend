'use client';

import type { OrionWorkflowTrigger } from '@/orion/types';

export const ORION_WORKFLOW_EVENT = 'orion-workflow:trigger';
const ORION_PENDING_WORKFLOW_KEY = 'tradevision.orion.pending-workflow';

export function emitOrionWorkflow(trigger: OrionWorkflowTrigger) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<OrionWorkflowTrigger>(ORION_WORKFLOW_EVENT, { detail: trigger }));
}

export function storePendingOrionWorkflow(trigger: OrionWorkflowTrigger) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ORION_PENDING_WORKFLOW_KEY, JSON.stringify(trigger));
}

export function consumePendingOrionWorkflow(): OrionWorkflowTrigger | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(ORION_PENDING_WORKFLOW_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(ORION_PENDING_WORKFLOW_KEY);

  try {
    return JSON.parse(raw) as OrionWorkflowTrigger;
  } catch {
    return null;
  }
}