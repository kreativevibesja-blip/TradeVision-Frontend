import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let serverClient: ReturnType<typeof createClient<any>> | null | undefined;

export const getServerSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return serverClient;
};
