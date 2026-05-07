'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { resolvePlatformTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useThemeStore } from '@/stores/theme-store';
import { useAuth } from '@/hooks/useAuth';

type SystemThemeRow = {
  value?: unknown;
};

type UserThemeRow = {
  theme_preference?: unknown;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setActiveTheme = useThemeStore((state) => state.setActiveTheme);
  const setUserThemePreference = useThemeStore((state) => state.setUserThemePreference);
  const setHydrated = useThemeStore((state) => state.setHydrated);

  useEffect(() => {
    setUserThemePreference(resolvePlatformTheme(user?.themePreference, 'legacy'));
  }, [setUserThemePreference, user?.themePreference]);

  useEffect(() => {
    let active = true;

    api.theme
      .getActive()
      .then((result) => {
        if (!active) {
          return;
        }

        setActiveTheme(resolvePlatformTheme(result.activeTheme));
      })
      .catch(() => {
        if (active) {
          setActiveTheme('goldx-premium');
        }
      })
      .finally(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, [setActiveTheme, setHydrated]);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      return;
    }

    const systemChannel = client
      .channel('platform-theme-system')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SystemSettings',
          filter: 'key=eq.platform_theme_active',
        },
        (payload) => {
          const nextRow = payload.new as SystemThemeRow | null;
          setActiveTheme(resolvePlatformTheme(nextRow?.value));
        }
      )
      .subscribe();

    const userChannel = user?.id
      ? client
          .channel(`platform-theme-user-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'User',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              const nextRow = payload.new as UserThemeRow | null;
              setUserThemePreference(resolvePlatformTheme(nextRow?.theme_preference, 'legacy'));
            }
          )
          .subscribe()
      : null;

    return () => {
      void client.removeChannel(systemChannel);
      if (userChannel) {
        void client.removeChannel(userChannel);
      }
    };
  }, [setActiveTheme, setUserThemePreference, user?.id]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.body.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return <>{children}</>;
}