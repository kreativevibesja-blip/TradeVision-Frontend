'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { api } from '@/lib/api';
import { hasSupabaseEnv, missingSupabaseEnvMessage, supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  subscription: string;
  dailyUsage?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasSupabaseEnv);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearLegacyTokens = () => {
    localStorage.removeItem('tradevision_token');
    localStorage.removeItem('chartmind_token');
  };

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    clearLegacyTokens();
  };

  const syncProfile = async (
    accessToken: string,
    options: {
      shouldSignOutOnFailure?: boolean;
      preserveUserOnFailure?: boolean;
    } = {}
  ) => {
    const {
      shouldSignOutOnFailure = true,
      preserveUserOnFailure = false,
    } = options;

    setToken(accessToken);
    clearLegacyTokens();

    try {
      const data = await api.getProfile(accessToken);
      setUser(data.user);
      return data.user;
    } catch (error) {
      if (!preserveUserOnFailure) {
        clearAuthState();
      }

      if (shouldSignOutOnFailure && supabase) {
        await supabase.auth.signOut();
      }

      throw error;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const supabaseClient = supabase;

    let active = true;

    const clearAuthStateIfActive = () => {
      if (!active) return;
      clearAuthState();
    };

    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession();

        if (error) {
          throw error;
        }

        if (session?.access_token) {
          await syncProfile(session.access_token);
        } else {
          clearAuthStateIfActive();
        }
      } catch {
        clearAuthStateIfActive();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const accessToken = session?.access_token ?? null;

      if (!accessToken) {
        clearAuthStateIfActive();
        setLoading(false);
        return;
      }

      const isBackgroundRefresh = event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && Boolean(userRef.current));

      if (!isBackgroundRefresh) {
        setLoading(true);
      }

      void syncProfile(accessToken, {
        shouldSignOutOnFailure: !isBackgroundRefresh,
        preserveUserOnFailure: isBackgroundRefresh,
      })
        .catch(() => {
          if (!isBackgroundRefresh) {
            clearAuthStateIfActive();
          }
        })
        .finally(() => {
          if (active && !isBackgroundRefresh) {
            setLoading(false);
          }
        });
    });

    void loadSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(missingSupabaseEnvMessage);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session?.access_token) {
      throw new Error('Sign in failed. Please try again.');
    }

    await syncProfile(data.session.access_token, { shouldSignOutOnFailure: false });
  };

  const register = async (email: string, password: string, name?: string) => {
    if (!supabase) {
      throw new Error(missingSupabaseEnvMessage);
    }

    const normalizedEmail = email.trim();
    const normalizedName = (name?.trim() || normalizedEmail.split('@')[0] || 'Trader').trim();
    const [firstName, ...restName] = normalizedName.split(/\s+/).filter(Boolean);
    const lastName = restName.join(' ');

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: normalizedName,
          full_name: normalizedName,
          display_name: normalizedName,
          first_name: firstName || normalizedName,
          ...(lastName ? { last_name: lastName } : {}),
        },
      },
    });

    if (error) {
      if (/database error saving new user/i.test(error.message)) {
        throw new Error('Sign-up failed in Supabase Auth while creating your account record. The app now sends the expected profile fields, but if this continues you need to fix the Supabase auth trigger or profile table schema in the project dashboard.');
      }

      throw new Error(error.message);
    }

    if (data.session?.access_token) {
      await syncProfile(data.session.access_token, { shouldSignOutOnFailure: false });
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      if (/email not confirmed/i.test(signInError.message)) {
        throw new Error('Account created, but your Supabase project still requires email confirmation. Disable Confirm email in Supabase Auth settings if you want users to go straight in after sign-up.');
      }

      throw new Error(signInError.message);
    }

    if (!signInData.session?.access_token) {
      throw new Error('Account created, but Supabase did not return a session. Disable Confirm email in Supabase Auth settings if you want instant sign-in after registration.');
    }

    await syncProfile(signInData.session.access_token, { shouldSignOutOnFailure: false });
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error(missingSupabaseEnvMessage);
    }

    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.url) {
      throw new Error('Google sign-in could not be started.');
    }
  };

  const logout = async () => {
    if (!supabase) {
      clearAuthState();
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    localStorage.removeItem('tradevision_token');
    localStorage.removeItem('chartmind_token');
  };

  const refreshUser = async () => {
    if (token) {
      const data = await api.getProfile(token);
      setUser(data.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, signInWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
