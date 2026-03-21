import { createClient } from '@supabase/supabase-js';
import { SecureLocalStorage } from './storage';
import { AppState } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
  process.env.EXPO_PUBLIC_SUPABASE_URL !== 'undefined' &&
  process.env.EXPO_PUBLIC_SUPABASE_URL !== ''
    ? process.env.EXPO_PUBLIC_SUPABASE_URL.trim()
    : 'https://your-project.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== 'undefined' &&
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== ''
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.trim()
    : 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureLocalStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export const SupabaseService = {
  get currentUser() {
    return supabase.auth.getUser();
  },

  get currentSession() {
    return supabase.auth.getSession();
  },

  async signInWithMagicLink(email: string, redirectTo?: string) {
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async setSessionFromTokens(accessToken: string, refreshToken: string) {
    return supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  },
};
