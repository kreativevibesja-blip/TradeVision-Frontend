'use client';

import { create } from 'zustand';
import { resolvePlatformTheme, type PlatformTheme } from '@/lib/theme';

type ThemeStore = {
  activeTheme: PlatformTheme;
  userThemePreference: PlatformTheme;
  resolvedTheme: PlatformTheme;
  hydrated: boolean;
  setActiveTheme: (theme: PlatformTheme) => void;
  setUserThemePreference: (theme: PlatformTheme) => void;
  setHydrated: (value: boolean) => void;
};

const computeResolvedTheme = (activeTheme: PlatformTheme, userThemePreference: PlatformTheme): PlatformTheme =>
  resolvePlatformTheme(activeTheme || userThemePreference, 'clean-blue');

export const useThemeStore = create<ThemeStore>((set) => ({
  activeTheme: 'clean-blue',
  userThemePreference: 'clean-blue',
  resolvedTheme: 'clean-blue',
  hydrated: false,
  setActiveTheme: (theme) =>
    set((state) => ({
      activeTheme: theme,
      resolvedTheme: computeResolvedTheme(theme, state.userThemePreference),
    })),
  setUserThemePreference: (theme) =>
    set((state) => ({
      userThemePreference: theme,
      resolvedTheme: computeResolvedTheme(state.activeTheme, theme),
    })),
  setHydrated: (value) => set({ hydrated: value }),
}));
