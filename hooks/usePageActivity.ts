'use client';

import { useSyncExternalStore } from 'react';

export interface PageActivityState {
  isVisible: boolean;
  isFocused: boolean;
  isIdle: boolean;
  isActive: boolean;
  lastInteractionAt: number;
}

const IDLE_TIMEOUT_MS = 60_000;
const IDLE_TICK_MS = 15_000;

type PageActivityGlobals = typeof globalThis & {
  __tradevisionPageActivityState?: PageActivityState;
  __tradevisionPageActivityListeners?: Set<() => void>;
  __tradevisionPageActivityInitialized?: boolean;
  __tradevisionPageActivityInterval?: ReturnType<typeof setInterval>;
};

const defaultState: PageActivityState = {
  isVisible: true,
  isFocused: true,
  isIdle: false,
  isActive: true,
  lastInteractionAt: Date.now(),
};

const globalScope = globalThis as PageActivityGlobals;
const isBrowser = typeof window !== 'undefined';

const emit = () => {
  globalScope.__tradevisionPageActivityListeners?.forEach((listener) => listener());
};

const computeState = (lastInteractionAt: number): PageActivityState => {
  const isVisible = isBrowser ? document.visibilityState !== 'hidden' : true;
  const isFocused = isBrowser ? document.hasFocus() : true;
  const isIdle = Date.now() - lastInteractionAt >= IDLE_TIMEOUT_MS;

  return {
    isVisible,
    isFocused,
    isIdle,
    isActive: isVisible && isFocused && !isIdle,
    lastInteractionAt,
  };
};

const updateState = (lastInteractionAt = globalScope.__tradevisionPageActivityState?.lastInteractionAt ?? Date.now()) => {
  globalScope.__tradevisionPageActivityState = computeState(lastInteractionAt);
  emit();
};

const markInteraction = () => {
  updateState(Date.now());
};

const initialize = () => {
  if (!isBrowser || globalScope.__tradevisionPageActivityInitialized) {
    return;
  }

  globalScope.__tradevisionPageActivityInitialized = true;
  globalScope.__tradevisionPageActivityListeners ??= new Set();
  globalScope.__tradevisionPageActivityState = computeState(Date.now());

  document.addEventListener('visibilitychange', () => updateState());
  window.addEventListener('focus', () => updateState());
  window.addEventListener('blur', () => updateState());

  for (const eventName of ['pointerdown', 'keydown', 'touchstart', 'mousemove']) {
    window.addEventListener(eventName, markInteraction, { passive: true });
  }

  globalScope.__tradevisionPageActivityInterval = setInterval(() => updateState(), IDLE_TICK_MS);
};

const subscribe = (listener: () => void) => {
  initialize();
  globalScope.__tradevisionPageActivityListeners ??= new Set();
  globalScope.__tradevisionPageActivityListeners.add(listener);

  return () => {
    globalScope.__tradevisionPageActivityListeners?.delete(listener);
  };
};

const getSnapshot = () => {
  initialize();
  return globalScope.__tradevisionPageActivityState ?? defaultState;
};

export function usePageActivity() {
  return useSyncExternalStore(subscribe, getSnapshot, () => defaultState);
}
