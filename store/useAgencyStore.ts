import { create } from 'zustand';
import { Agency, SyncStatus } from '@/types';
import { db } from '@/lib/db';

interface AgencyStore {
  agencies: Agency[];
  loading: boolean;
  error: string | null;

  // Actions
  initStore: (user: { role: string; organizationId: string }) => Promise<void>;
  fetchAgencies: (organizationId?: string) => Promise<void>;
  addAgency: (agencyData: Omit<Agency, 'updatedAt' | 'isSynced'>) => Promise<void>;
  updateAgency: (id: string, updates: Partial<Agency>) => Promise<void>;
  deleteAgency: (id: string) => Promise<void>;
  getAgenciesByOrg: (organizationId: string) => Agency[];
}

export const useAgencyStore = create<AgencyStore>((set, get) => ({
  agencies: [],
  loading: false,
  error: null,

  initStore: async (user) => {
    set({ loading: true });
    try {
      const allLocalAgencies = await db.agencies.toArray();
      
      // Segmentation par organisation pour les admins
      const filteredAgencies = allLocalAgencies.filter(agency => {
        return agency.organizationId === user.organizationId;
      });

      set({ agencies: filteredAgencies, loading: false });
    } catch (err) {
      console.error('Failed to init AgencyStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement local des agences' });
    }
  },

  fetchAgencies: async (organizationId?: string) => {
    set({ loading: true });
    try {
      const url = organizationId ? `/api/agencies?organizationId=${organizationId}` : '/api/agencies';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filtrage serveur simulé ou réel
        const filtered = Array.isArray(data) ? (organizationId ? data.filter((a: any) => a.organizationId === organizationId) : data) : [];
        await db.agencies.bulkPut(filtered);
        set({ agencies: filtered, loading: false });
      }
    } catch (error) {
      console.warn('Fetch agencies failed, using local data:', error);
      const localAgencies = organizationId ? await db.agencies.where('organizationId').equals(organizationId).toArray() : await db.agencies.toArray();
      set({ agencies: localAgencies, loading: false });
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
        entity: 'agency',
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
        entity: 'agency',
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
        entity: 'agency',
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
