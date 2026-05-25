import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPreferences } from '@/types';

interface PreferencesState {
  preferences: UserPreferences;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'fr' | 'en' | 'es' | 'zh' | 'ar') => void;
  toggleAutoEmail: (autoEmail: boolean) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  autoEmailSignatories: true,
  theme: 'dark',
  language: 'fr',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),
      setLanguage: (language) =>
        set((state) => ({
          preferences: { ...state.preferences, language },
        })),
      toggleAutoEmail: (autoEmailSignatories) =>
        set((state) => ({
          preferences: { ...state.preferences, autoEmailSignatories },
        })),
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: 'vestacheck-preferences', // Key in localStorage
    }
  )
);
