import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const missingSupabaseEnvMessage = 'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';

type TradeVisionSupabaseGlobals = typeof globalThis & {
  __tradevisionSupabaseClient?: ReturnType<typeof createClient<any>> | null;
  __tradevisionCachedSession?: Session | null;
  __tradevisionTokenRefreshCount?: number;
};

const globalScope = globalThis as TradeVisionSupabaseGlobals;

const createBrowserSupabaseClient = () => createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabase = supabaseUrl && supabaseAnonKey
  ? (globalScope.__tradevisionSupabaseClient ??= createBrowserSupabaseClient())
  : null;

const setGlobalCachedSession = (session: Session | null) => {
  globalScope.__tradevisionCachedSession = session;
};

if (globalScope.__tradevisionCachedSession === undefined) {
  setGlobalCachedSession(null);
}

if (globalScope.__tradevisionTokenRefreshCount === undefined) {
  globalScope.__tradevisionTokenRefreshCount = 0;
}

export const setCachedSession = (session: Session | null) => {
  setGlobalCachedSession(session);
};

export const getCachedSession = () => globalScope.__tradevisionCachedSession ?? null;

export const getCachedAccessToken = () => getCachedSession()?.access_token ?? null;

export const recordTokenRefresh = (session: Session | null) => {
  setGlobalCachedSession(session);
  globalScope.__tradevisionTokenRefreshCount = (globalScope.__tradevisionTokenRefreshCount ?? 0) + 1;

  const expiresAt = session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown';
  console.info(`[auth] token refresh #${globalScope.__tradevisionTokenRefreshCount} (expires ${expiresAt})`);
};

export const hasSupabaseEnv = Boolean(supabase);
