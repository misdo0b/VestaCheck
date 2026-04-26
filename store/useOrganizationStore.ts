import { create } from 'zustand';
import { Organization } from '@/types';
import { db } from '@/lib/db';

interface OrganizationStore {
  organizations: Organization[];
  loading: boolean;
  error: string | null;

  initStore: () => Promise<void>;
  fetchOrganizations: () => Promise<void>;
  addOrganization: (org: Organization) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  organizations: [],
  loading: false,
  error: null,

  initStore: async () => {
    set({ loading: true });
    try {
      const localOrgs = await db.organizations.toArray();
      set({ organizations: localOrgs, loading: false });
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

  addOrganization: async (org) => {
    set((state) => ({ organizations: [...state.organizations, org] }));
    try {
      await db.organizations.add(org);
      await db.enqueueMutation({
        type: 'CREATE',
        entity: 'organization',
        entityId: org.id,
        data: org
      });
    } catch (err) {
      console.error('Failed to add org:', err);
    }
  },

  updateOrganization: async (id, updates) => {
    set((state) => ({
      organizations: state.organizations.map(o => o.id === id ? { ...o, ...updates } : o)
    }));
    try {
      await db.organizations.update(id, updates);
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
