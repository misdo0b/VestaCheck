import { create } from 'zustand';
import { Tenant } from '@/types';
import { db } from '@/lib/db';

interface TenantState {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  currentUser?: { id: string; role: string; agencyId: string; organizationId: string };

  // Actions
  initStore: (user: { id: string; role: string; agencyId: string; organizationId: string }) => Promise<void>;
  fetchTenants: () => Promise<void>;
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Omit<Tenant, 'serverVersion' | 'lastModified' | 'syncStatus'>) => Promise<string>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  
  // Helpers
  getTenantById: (id: string | undefined) => Tenant | undefined;
  getTenantsByProperty: (propertyId: string) => Tenant[];
}

export const useTenantStore = create<TenantState>((set, get) => ({
  tenants: [],
  loading: false,
  error: null,
  currentUser: undefined,

  initStore: async (user) => {
    set({ loading: true, currentUser: user });
    try {
      const allLocalTenants = await db.tenants.toArray();
      
      // Segmentation des données
      const filteredTenants = allLocalTenants.filter(tenant => {
        if (user.role === 'Administrateur' || user.role === 'Propriétaire') {
          return tenant.organizationId === user.organizationId;
        }
        return tenant.agencyId === user.agencyId;
      });

      set({ tenants: filteredTenants, loading: false });
    } catch (err) {
      console.error('Failed to init TenantStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement local des locataires' });
    }
  },

  fetchTenants: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const data = await response.json();
        const serverTenants = data.tenants || [];
        
        const localTenants = await db.tenants.toArray();
        const user = get().currentUser;

        // Cloisonnement : filtrer les locataires locaux par rapport au périmètre de l'utilisateur
        const filteredLocal = user ? localTenants.filter(lt => {
          if (user.role === 'Administrateur' || user.role === 'Propriétaire') {
            return lt.organizationId === user.organizationId;
          }
          return lt.agencyId === user.agencyId;
        }) : localTenants;

        const serverTenantsMap = new Map<string, Tenant>(serverTenants.map((t: Tenant) => [t.id, t]));
        
        const mergedTenants: Tenant[] = [];
        const toUpload: Tenant[] = [];

        // 1. Parcourir les locataires locaux filtrés
        for (const lt of filteredLocal) {
          const st = serverTenantsMap.get(lt.id);
          if (!st) {
            // Existe localement mais pas sur le serveur -> Upload requis
            toUpload.push(lt);
            mergedTenants.push({
              ...lt,
              syncStatus: 'pending'
            });
          } else {
            // Existe des deux côtés -> Comparer les dates
            const localTime = new Date(lt.lastModified).getTime();
            const serverTime = new Date(st.lastModified).getTime();
            
            if (localTime > serverTime || lt.syncStatus === 'pending' || lt.syncStatus === 'error') {
              toUpload.push(lt);
              mergedTenants.push({
                ...lt,
                syncStatus: 'pending'
              });
            } else {
              mergedTenants.push({
                ...st,
                syncStatus: 'synced'
              });
            }
          }
        }

        // 2. Ajouter les locataires du serveur inexistants localement
        const localIds = new Set(localTenants.map(t => t.id));
        for (const st of serverTenants) {
          if (!localIds.has(st.id)) {
            mergedTenants.push({
              ...st,
              syncStatus: 'synced'
            });
          }
        }

        // 3. Enregistrer les mutations manquantes pour l'upload
        if (toUpload.length > 0) {
          console.log(`[Sync] ${toUpload.length} locataires détectés pour réconciliation vers le serveur.`);
          for (const tenant of toUpload) {
            const queueItems = await db.mutationQueue.where('entityId').equals(tenant.id).toArray();
            if (queueItems.length === 0) {
              await db.enqueueMutation({
                type: 'CREATE',
                entity: 'tenant',
                entityId: tenant.id,
                data: tenant
              });
            }
          }
        }

        await db.tenants.bulkPut(mergedTenants);
        set({ tenants: mergedTenants, loading: false });
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      set({ loading: false, error: 'Erreur lors du chargement des locataires' });
    }
  },

  setTenants: (tenants) => set({ tenants }),

  addTenant: async (tenantData) => {
    const newTenant: Tenant = {
      ...tenantData,
      serverVersion: 0,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };

    set((state) => ({ tenants: [...state.tenants, newTenant] }));

    try {
      await db.tenants.add(newTenant);
      await db.enqueueMutation({
        type: 'CREATE',
        entity: 'tenant',
        entityId: newTenant.id,
        data: newTenant
      });
    } catch (err) {
      console.error('Failed to add tenant locally:', err);
    }
    
    return newTenant.id;
  },

  updateTenant: async (id, updates) => {
    const lastModified = new Date().toISOString();
    
    set((state) => ({
      tenants: state.tenants.map(t => t.id === id ? { 
        ...t, 
        ...updates, 
        syncStatus: 'pending', 
        lastModified 
      } : t)
    }));

    try {
      await db.tenants.update(id, { 
        ...updates, 
        syncStatus: 'pending', 
        lastModified 
      });
      
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'tenant',
        entityId: id,
        data: updates
      });
    } catch (err) {
      console.error('Failed to update tenant locally:', err);
    }
  },

  deleteTenant: async (id) => {
    set((state) => ({
      tenants: state.tenants.filter(t => t.id !== id)
    }));

    try {
      await db.tenants.delete(id);
      await db.enqueueMutation({
        type: 'DELETE',
        entity: 'tenant',
        entityId: id,
        data: { id }
      });
    } catch (err) {
      console.error('Failed to delete tenant locally:', err);
    }
  },

  getTenantById: (id) => {
    if (!id) return undefined;
    return get().tenants.find(t => t.id === id);
  },

  getTenantsByProperty: (propertyId) => {
    return get().tenants.filter(t => (t.propertyIds || []).includes(propertyId));
  }
}));
