'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

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
  const [loading, setLoading] = useState(true);

  const clearLegacyTokens = () => {
    localStorage.removeItem('tradevision_token');
    localStorage.removeItem('chartmind_token');
  };

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    clearLegacyTokens();
  };

  const syncProfile = async (accessToken: string, shouldSignOutOnFailure = true) => {
    setToken(accessToken);
    clearLegacyTokens();

    try {
      const data = await api.getProfile(accessToken);
      setUser(data.user);
      return data.user;
    } catch (error) {
      clearAuthState();

      if (shouldSignOutOnFailure) {
        await supabase.auth.signOut();
      }

      throw error;
    }
  };

  useEffect(() => {
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
        } = await supabase.auth.getSession();

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
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const accessToken = session?.access_token ?? null;

      if (!accessToken) {
        clearAuthStateIfActive();
        setLoading(false);
        return;
      }

      setLoading(true);
      void syncProfile(accessToken)
        .catch(() => {
          clearAuthStateIfActive();
        })
        .finally(() => {
          if (active) {
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

    await syncProfile(data.session.access_token, false);
  };

  const register = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: name ? { data: { name } } : undefined,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session?.access_token) {
      throw new Error('Account created. Confirm your email, then sign in.');
    }

    await syncProfile(data.session.access_token, false);
  };

  const signInWithGoogle = async () => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;

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
