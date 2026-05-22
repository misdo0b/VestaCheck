import { create } from 'zustand';

interface AuthState {
  ssoLoading: 'google' | null;
  setSsoLoading: (provider: 'google' | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  ssoLoading: null,
  setSsoLoading: (provider) => set({ ssoLoading: provider }),
}));

