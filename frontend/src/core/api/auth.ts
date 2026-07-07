import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

export const AuthService = {
  getSession: async () => {
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  signInWithOtp: async (email: string, emailRedirectTo: string) => {
    return supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo,
      },
    });
  },

  signInWithPassword: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  setSession: async (access_token: string, refresh_token: string) => {
    return supabase.auth.setSession({ access_token, refresh_token });
  },

  exchangeCodeForSession: async (code: string) => {
    return supabase.auth.exchangeCodeForSession(code);
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },
};
