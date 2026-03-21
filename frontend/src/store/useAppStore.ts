import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SecureLocalStorage } from '../core/services/storage';

interface AppState {
  isOnboardingComplete: boolean;
  baseUrl: string;
  setOnboardingComplete: (complete: boolean) => void;
  setBaseUrl: (url: string) => void;
}

const FALLBACK_URL = 'https://aca-miru.whitefield-4145d509.westeurope.azurecontainerapps.io/api/v1';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboardingComplete: false,
      baseUrl: FALLBACK_URL,
      setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
      setBaseUrl: (url) => set({ baseUrl: url }),
    }),
    {
      name: 'miru-app-storage',
      storage: createJSONStorage(() => SecureLocalStorage),
    }
  )
);
