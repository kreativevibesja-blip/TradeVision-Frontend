'use client';

type OrionMemoryState = {
  recentPages: string[];
  recentInteractions: string[];
  lastAction: string | null;
  interactionCount: number;
  preferredMarket: string | null;
};

const ORION_MEMORY_KEY = 'tradevision.orion.memory';

const defaultMemory: OrionMemoryState = {
  recentPages: [],
  recentInteractions: [],
  lastAction: null,
  interactionCount: 0,
  preferredMarket: null,
};

function readMemory(): OrionMemoryState {
  if (typeof window === 'undefined') {
    return defaultMemory;
  }

  try {
    const raw = window.localStorage.getItem(ORION_MEMORY_KEY);
    if (!raw) {
      return defaultMemory;
    }

    return { ...defaultMemory, ...(JSON.parse(raw) as Partial<OrionMemoryState>) };
  } catch {
    return defaultMemory;
  }
}

function writeMemory(next: OrionMemoryState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ORION_MEMORY_KEY, JSON.stringify(next));
}

export const OrionMemoryStore = {
  get: readMemory,
  rememberPage(pathname: string) {
    const current = readMemory();
    const nextPages = [pathname, ...current.recentPages.filter((item) => item !== pathname)].slice(0, 8);
    writeMemory({ ...current, recentPages: nextPages });
    return nextPages;
  },
  rememberInteraction(input: string) {
    const normalized = input.trim();
    if (!normalized) {
      return readMemory();
    }

    const current = readMemory();
    const nextInteractions = [normalized, ...current.recentInteractions.filter((item) => item !== normalized)].slice(0, 12);
    const next = {
      ...current,
      recentInteractions: nextInteractions,
      interactionCount: current.interactionCount + 1,
    };
    writeMemory(next);
    return next;
  },
  rememberAction(action: string | null) {
    const current = readMemory();
    const next = { ...current, lastAction: action };
    writeMemory(next);
    return next;
  },
  setPreferredMarket(preferredMarket: string | null) {
    const current = readMemory();
    const next = { ...current, preferredMarket };
    writeMemory(next);
    return next;
  },
};