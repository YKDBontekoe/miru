import { create } from 'zustand';
import { supabase } from '../core/services/supabase';
import { Session, User } from '@supabase/supabase-js';
import { apiClient } from '../core/api/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithPasskey: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

// DOCS(miru-agent): needs documentation
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isLoading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signInWithMagicLink: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  },

  signInWithPassword: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signInWithPasskey: async (email: string) => {
    // Step 1: get a challenge from the backend
    const optionsRes = await apiClient.post('auth/passkey/login/options', { email });
    const challengeId: string = optionsRes.data.challenge_id;
    const options: Record<string, unknown> = optionsRes.data.options ?? optionsRes.data;

    // Step 2: invoke the platform passkey API (requires react-native-passkeys)
    // Uses require() so TypeScript doesn't error when the package isn't installed.
    let credentialJson: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Passkey } = require('react-native-passkeys') as {
        Passkey: { get: (o: unknown) => Promise<unknown> };
      };
      const credential = await Passkey.get(options);
      credentialJson = JSON.stringify(credential);
    } catch {
      throw new Error(
        'Passkeys are not supported on this device or build. Please use magic link or password instead.'
      );
    }

    // Step 3: verify with backend and set the Supabase session from returned tokens
    const verifyRes = await apiClient.post('auth/passkey/login/verify', {
      challenge_id: challengeId,
      credential: JSON.parse(credentialJson),
    });
    const { access_token, refresh_token } = verifyRes.data;
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null });
  },
}));
