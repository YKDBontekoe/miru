import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SecureLocalStorage } from '../core/services/storage';

interface AppState {
  isOnboardingComplete: boolean;
  baseUrl: string;
  language: string | null;
  appearanceMode: 'system' | 'light' | 'dark';
  notifications: {
    longRunningTasks: boolean;
    dailySummary: boolean;
    mentions: boolean;
  };
  setOnboardingComplete: (complete: boolean) => void;
  setBaseUrl: (url: string) => void;
  setLanguage: (lang: string) => void;
  setAppearanceMode: (mode: 'system' | 'light' | 'dark') => void;
  setNotificationSetting: (
    key: 'longRunningTasks' | 'dailySummary' | 'mentions',
    value: boolean
  ) => void;
}

const FALLBACK_URL = 'https://aca-miru.whitefield-4145d509.westeurope.azurecontainerapps.io/api/v1';
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || FALLBACK_URL;

/**
 * Zustand store for managing global application preferences and configuration.
 *
 * State is persisted to secure local storage.
 *
 * State includes:
 * - `isOnboardingComplete`: Whether the user has completed the initial app tour.
 * - `baseUrl`: The target backend API URL.
 * - `language`: The user's preferred language code.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboardingComplete: false,
      baseUrl: DEFAULT_URL,
      language: null,
      appearanceMode: 'system',
      notifications: {
        longRunningTasks: true,
        dailySummary: false,
        mentions: true,
      },
      setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
      setBaseUrl: (url) => set({ baseUrl: url }),
      setLanguage: (lang) => set({ language: lang }),
      setAppearanceMode: (mode) => set({ appearanceMode: mode }),
      setNotificationSetting: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
    }),
    {
      name: 'miru-app-storage',
      storage: createJSONStorage(() => SecureLocalStorage),
    }
  )
);
