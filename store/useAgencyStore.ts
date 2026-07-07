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
  addAgency: (agencyData: Omit<Agency, 'serverVersion' | 'lastModified' | 'syncStatus'>) => Promise<void>;
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
        const filtered = Array.isArray(data) ? (organizationId ? data.filter((a: any) => a.organizationId === organizationId) : data) : [];
        
        const localAgencies = await db.agencies.toArray();
        const serverAgenciesMap = new Map<string, Agency>(filtered.map((a: Agency) => [a.id, a]));
        
        const mergedAgencies: Agency[] = [];
        const toUpload: Agency[] = [];

        // 1. Parcourir les agences locales
        for (const la of localAgencies) {
          const sa = serverAgenciesMap.get(la.id);
          if (!sa) {
            // Existe localement mais pas sur le serveur -> Upload requis
            toUpload.push(la);
            mergedAgencies.push({
              ...la,
              syncStatus: 'pending'
            });
          } else {
            // Existe des deux côtés -> Comparer les dates
            const localTime = new Date(la.lastModified).getTime();
            const serverTime = new Date(sa.lastModified).getTime();
            
            if (localTime > serverTime || la.syncStatus === 'pending' || la.syncStatus === 'error') {
              toUpload.push(la);
              mergedAgencies.push({
                ...la,
                syncStatus: 'pending'
              });
            } else {
              mergedAgencies.push({
                ...sa,
                syncStatus: 'synced'
              });
            }
          }
        }

        // 2. Ajouter les agences du serveur inexistantes localement
        const localIds = new Set(localAgencies.map(a => a.id));
        for (const sa of filtered) {
          if (!localIds.has(sa.id)) {
            mergedAgencies.push({
              ...sa,
              syncStatus: 'synced'
            });
          }
        }

        // 3. Enregistrer les mutations manquantes pour l'upload
        if (toUpload.length > 0) {
          console.log(`[Sync] ${toUpload.length} agences détectées pour réconciliation vers le serveur.`);
          for (const agency of toUpload) {
            const queueItems = await db.mutationQueue.where('entityId').equals(agency.id).toArray();
            if (queueItems.length === 0) {
              await db.enqueueMutation({
                type: 'CREATE',
                entity: 'agency',
                entityId: agency.id,
                data: agency
              });
            }
          }
        }

        await db.agencies.bulkPut(mergedAgencies);
        set({ agencies: mergedAgencies, loading: false });
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
      serverVersion: 1,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
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
        syncStatus: 'pending',
        lastModified: new Date().toISOString() 
      } : a)
    }));

    try {
      await db.agencies.update(id, { 
        ...updates, 
        syncStatus: 'pending',
        lastModified: new Date().toISOString() 
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
