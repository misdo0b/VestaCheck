import { create } from 'zustand';
import { Tenant } from '@/types';
import { db } from '@/lib/db';

interface TenantState {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;

  // Actions
  initStore: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Omit<Tenant, 'serverVersion' | 'lastModified' | 'syncStatus'>) => Promise<string>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  
  // Helpers
  getTenantById: (id: string) => Tenant | undefined;
  getTenantsByProperty: (propertyId: string) => Tenant[];
}

export const useTenantStore = create<TenantState>((set, get) => ({
  tenants: [],
  loading: false,
  error: null,

  initStore: async () => {
    set({ loading: true });
    try {
      const localTenants = await db.tenants.toArray();
      set({ tenants: localTenants, loading: false });
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
        
        // Mise à jour de la base globale avec les données serveur
        // syncStatus est 'synced' car cela vient directement du serveur
        const syncedTenants = serverTenants.map((t: any) => ({
          ...t,
          syncStatus: 'synced'
        }));

        await db.tenants.bulkPut(syncedTenants);
        set({ tenants: syncedTenants, loading: false });
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
    return get().tenants.find(t => t.id === id);
  },

  getTenantsByProperty: (propertyId) => {
    return get().tenants.filter(t => t.propertyIds.includes(propertyId));
  }
}));
