import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SecureLocalStorage } from '../core/services/storage';

interface AppState {
  isOnboardingComplete: boolean;
  baseUrl: string;
  language: string | null;
  setOnboardingComplete: (complete: boolean) => void;
  setBaseUrl: (url: string) => void;
  setLanguage: (lang: string) => void;
}

const FALLBACK_URL = 'https://aca-miru.whitefield-4145d509.westeurope.azurecontainerapps.io/api/v1';
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || FALLBACK_URL;

// DOCS(miru-agent): needs documentation
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboardingComplete: false,
      baseUrl: DEFAULT_URL,
      language: null,
      setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
      setBaseUrl: (url) => set({ baseUrl: url }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'miru-app-storage',
      storage: createJSONStorage(() => SecureLocalStorage),
    }
  )
);
