import { create } from 'zustand';
import { Organization } from '@/types';
import { db } from '@/lib/db';

interface OrganizationStore {
  organizations: Organization[];
  loading: boolean;
  error: string | null;

  initStore: (user: { organizationId: string }) => Promise<void>;
  fetchOrganizations: () => Promise<void>;
  addOrganization: (org: Omit<Organization, 'serverVersion' | 'lastModified' | 'syncStatus'> & { id: string }) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  organizations: [],
  loading: false,
  error: null,

  initStore: async (user) => {
    set({ loading: true });
    try {
      const allLocalOrgs = await db.organizations.toArray();
      
      // Segmentation par organisation
      const filteredOrgs = allLocalOrgs.filter(org => {
        return org.id === user.organizationId;
      });

      set({ organizations: filteredOrgs, loading: false });
    } catch (err) {
      console.error('Failed to init OrganizationStore:', err);
      set({ loading: false, error: 'Erreur chargement organisations' });
    }
  },

  fetchOrganizations: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        await db.organizations.bulkPut(data);
        set({ organizations: data, loading: false });
      }
    } catch (err) {
      console.error('Fetch orgs failed:', err);
      set({ loading: false });
    }
  },

  addOrganization: async (orgData) => {
    const newOrg: Organization = {
      ...orgData,
      serverVersion: 1,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };
    set((state) => ({ organizations: [...state.organizations, newOrg] }));
    try {
      await db.organizations.add(newOrg);
      await db.enqueueMutation({
        type: 'CREATE',
        entity: 'organization',
        entityId: newOrg.id,
        data: newOrg
      });
    } catch (err) {
      console.error('Failed to add org:', err);
    }
  },

  updateOrganization: async (id, updates) => {
    const lastModified = new Date().toISOString();
    set((state) => ({
      organizations: state.organizations.map(o => o.id === id ? { 
        ...o, 
        ...updates,
        lastModified,
        syncStatus: 'pending'
      } : o)
    }));
    try {
      await db.organizations.update(id, {
        ...updates,
        lastModified,
        syncStatus: 'pending'
      });
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'organization',
        entityId: id,
        data: updates
      });
    } catch (err) {
      console.error('Failed to update org:', err);
    }
  }
}));
