import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    password: string;
  };
  setStep: (step: number) => void;
  updateOrganization: (data: Partial<RegisterState['organization']>) => void;
  updateAgency: (data: Partial<RegisterState['agency']>) => void;
  updateAdmin: (data: Partial<RegisterState['admin']>) => void;
  reset: () => void;
}

export const useRegisterStore = create<RegisterState>()(
  persist(
    (set) => ({
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
        password: '',
      },
      setStep: (step) => set({ step }),
      updateOrganization: (data) =>
        set((state) => ({ organization: { ...state.organization, ...data } })),
      updateAgency: (data) =>
        set((state) => ({ agency: { ...state.agency, ...data } })),
      updateAdmin: (data) =>
        set((state) => ({ admin: { ...state.admin, ...data } })),
      reset: () =>
        set({
          step: 1,
          organization: { raisonSociale: '', siret: '', adressePostale: '' },
          agency: { name: '', address: '', phone: '' },
          admin: { firstName: '', lastName: '', email: '', password: '' },
        }),
    }),
    {
      name: 'vestacheck-register-storage',
    }
  )
);
