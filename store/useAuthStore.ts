import { create } from 'zustand';

interface AuthState {
  ssoLoading: 'google' | 'apple' | null;
  setSsoLoading: (provider: 'google' | 'apple' | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  ssoLoading: null,
  setSsoLoading: (provider) => set({ ssoLoading: provider }),
}));
