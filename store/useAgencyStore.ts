import { create } from 'zustand';
import { Agency, SyncStatus } from '@/types';
import { db } from '@/lib/db';

interface AgencyStore {
  agencies: Agency[];
  loading: boolean;
  error: string | null;

  // Actions
  initStore: () => Promise<void>;
  fetchAgencies: (organizationId: string) => Promise<void>;
  addAgency: (agencyData: Omit<Agency, 'updatedAt' | 'isSynced'>) => Promise<void>;
  updateAgency: (id: string, updates: Partial<Agency>) => Promise<void>;
  deleteAgency: (id: string) => Promise<void>;
  getAgenciesByOrg: (organizationId: string) => Agency[];
}

export const useAgencyStore = create<AgencyStore>((set, get) => ({
  agencies: [],
  loading: false,
  error: null,

  initStore: async () => {
    set({ loading: true });
    try {
      const localAgencies = await db.agencies.toArray();
      set({ agencies: localAgencies, loading: false });
    } catch (err) {
      console.error('Failed to init AgencyStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement local des agences' });
    }
  },

  fetchAgencies: async (organizationId: string) => {
    set({ loading: true });
    try {
      // In a real app, this would be a fetch to /api/agencies?organizationId=...
      // For now, we rely on local data or mock
      const localAgencies = await db.agencies.where('organizationId').equals(organizationId).toArray();
      set({ agencies: localAgencies, loading: false });
    } catch (error) {
      console.warn('Fetch agencies failed, using local data:', error);
      set({ loading: false });
    }
  },

  addAgency: async (agencyData) => {
    const newAgency: Agency = {
      ...agencyData,
      updatedAt: Date.now(),
      isSynced: false
    };

    set((state) => ({ agencies: [...state.agencies, newAgency] }));

    try {
      await db.agencies.add(newAgency);
      await db.enqueueMutation({
        type: 'CREATE',
        entity: 'agency' as any, // On ajoute le type agency aux mutations
        entityId: newAgency.id,
        data: newAgency
      });
    } catch (err) {
      console.error('Failed to add agency locally:', err);
    }
  },

  updateAgency: async (id, updates) => {
    set((state) => ({
      agencies: state.agencies.map(a => a.id === id ? { 
        ...a, 
        ...updates, 
        isSynced: false,
        updatedAt: Date.now() 
      } : a)
    }));

    try {
      await db.agencies.update(id, { 
        ...updates, 
        isSynced: false,
        updatedAt: Date.now() 
      });
      
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'agency' as any,
        entityId: id,
        data: updates
      });
    } catch (err) {
      console.error('Failed to update agency locally:', err);
    }
  },

  deleteAgency: async (id) => {
    set((state) => ({
      agencies: state.agencies.filter(a => a.id !== id)
    }));

    try {
      await db.agencies.delete(id);
      await db.enqueueMutation({
        type: 'DELETE',
        entity: 'agency' as any,
        entityId: id,
        data: { id }
      });
    } catch (err) {
      console.error('Failed to delete agency locally:', err);
    }
  },

  getAgenciesByOrg: (organizationId: string) => {
    return get().agencies.filter(a => a.organizationId === organizationId);
  }
}));
