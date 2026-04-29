import { create } from 'zustand';

interface RegisterState {
  step: number;
  organization: {
    raisonSociale: string;
    siret: string;
    adressePostale: string;
  };
  agency: {
    name: string;
    address: string;
    phone: string;
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    password: '';
  };
  
  // Actions
  setStep: (step: number) => void;
  updateOrganization: (data: Partial<RegisterState['organization']>) => void;
  updateAgency: (data: Partial<RegisterState['agency']>) => void;
  updateAdmin: (data: Partial<RegisterState['admin']>) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  organization: {
    raisonSociale: '',
    siret: '',
    adressePostale: '',
  },
  agency: {
    name: '',
    address: '',
    phone: '',
  },
  admin: {
    firstName: '',
    lastName: '',
    email: '',
    password: '' as const,
  },
};

export const useRegisterStore = create<RegisterState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  
  updateOrganization: (data) => set((state) => ({
    organization: { ...state.organization, ...data }
  })),

  updateAgency: (data) => set((state) => ({
    agency: { ...state.agency, ...data }
  })),

  updateAdmin: (data) => set((state) => ({
    admin: { ...state.admin, ...data }
  })),

  reset: () => set(initialState),
}));
