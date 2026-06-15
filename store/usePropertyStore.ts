import { create } from 'zustand';
import { Property, PropertyTemplate } from '@/types';
import { db } from '@/lib/db';

interface PropertyState {
  properties: Property[];
  templates: PropertyTemplate[];
  loading: boolean;
  error: string | null;

  // Actions
  initStore: (user: { id: string; role: string; agencyId: string; organizationId: string }) => Promise<void>;
  setProperties: (properties: Property[]) => void;
  fetchProperties: (agencyId?: string) => Promise<void>;
  addProperty: (property: Property) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  fetchTemplates: (propertyId?: string) => Promise<void>;

  // Template Actions
  setTemplates: (templates: PropertyTemplate[]) => void;
  addTemplate: (template: PropertyTemplate) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<PropertyTemplate>) => Promise<void>;
  getTemplatesByProperty: (propertyId: string) => PropertyTemplate[];
  getPropertiesByAgency: (agencyId: string) => Property[];
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  templates: [],
  loading: false,
  error: null,

  initStore: async (user) => {
    set({ loading: true });
    try {
      const [allLocalProps, localTemplates] = await Promise.all([
        db.properties.toArray(),
        db.templates.toArray()
      ]);

      // Segmentation des données
      const filteredProps = allLocalProps.filter(property => {
        // Filtrer les templates pollués
        if ('propertyId' in property) return false;

        if (user.role === 'Administrateur') {
          return (property as any).organizationId === user.organizationId;
        }
        if (user.role === 'Propriétaire') {
          return property.ownerId === user.id;
        }
        return property.agencyId === user.agencyId;
      });

      const pollutedIds = allLocalProps
        .filter(p => 'propertyId' in p)
        .map(p => p.id);

      // Assainissement asynchrone de la base locale si pollution détectée
      if (pollutedIds.length > 0) {
        console.warn(`[PropertyStore] Nettoyage de ${pollutedIds.length} templates pollués dans la table properties.`);
        await db.properties.bulkDelete(pollutedIds);
      }

      set({ 
        properties: filteredProps, 
        templates: localTemplates, 
        loading: false 
      });
    } catch (err) {
      console.error('Failed to init PropertyStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement local des biens' });
    }
  },

  fetchProperties: async (agencyId?: string) => {
    set({ loading: true });
    try {
      const url = agencyId ? `/api/properties?agencyId=${agencyId}` : '/api/properties';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        await db.properties.bulkPut(data);
        
        const currentProperties = get().properties;
        const newProperties = [...currentProperties];

        data.forEach((newProp: Property) => {
          const index = newProperties.findIndex(p => p.id === newProp.id);
          if (index !== -1) {
            newProperties[index] = newProp;
          } else {
            newProperties.push(newProp);
          }
        });

        set({ properties: newProperties, loading: false });
      }
    } catch (err) {
      console.error('Fetch properties failed:', err);
      const localProps = agencyId ? await db.properties.where('agencyId').equals(agencyId).toArray() : await db.properties.toArray();
      set({ properties: localProps, loading: false });
    }
  },

  fetchTemplates: async (propertyId?: string) => {
    try {
      const url = propertyId ? `/api/templates?propertyId=${propertyId}` : '/api/templates';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          await db.templates.bulkPut(data);
        }

        const currentTemplates = get().templates;
        const newTemplates = [...currentTemplates];

        data.forEach((newTemplate: PropertyTemplate) => {
          const index = newTemplates.findIndex(t => t.id === newTemplate.id);
          if (index !== -1) {
            newTemplates[index] = newTemplate;
          } else {
            newTemplates.push(newTemplate);
          }
        });

        set({ templates: newTemplates });
      }
    } catch (err) {
      console.error('Fetch templates failed:', err);
    }
  },

  setProperties: (properties) => set({ properties }),
  
  addProperty: async (property) => {
    set((state) => ({ properties: [...state.properties, property] }));
    try {
      await db.properties.add(property);
      await db.enqueueMutation({
        type: 'CREATE',
        entity: 'property',
        entityId: property.id,
        data: property
      });
    } catch (err) {
      console.error('Failed to add property locally:', err);
    }
  },

  updateProperty: async (id, updates) => {
    set((state) => ({
      properties: state.properties.map(p => p.id === id ? { 
        ...p, 
        ...updates, 
        syncStatus: 'pending', 
        lastModified: new Date().toISOString() 
      } : p)
    }));

    try {
      await db.properties.update(id, { 
        ...updates, 
        syncStatus: 'pending', 
        lastModified: new Date().toISOString() 
      });
      
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'property',
        entityId: id,
        data: updates
      });
    } catch (err) {
      console.error('Failed to update property locally:', err);
    }
  },

  deleteProperty: async (id) => {
    set((state) => ({
      properties: state.properties.filter(p => p.id !== id)
    }));

    try {
      await db.properties.delete(id);
      await db.enqueueMutation({
        type: 'DELETE',
        entity: 'property',
        entityId: id,
        data: { id }
      });
    } catch (err) {
      console.error('Failed to delete property locally:', err);
    }
  },

  setTemplates: (templates) => set({ templates }),

  addTemplate: async (template) => {
    set((state) => ({ templates: [...state.templates, template] }));
    try {
      await db.templates.add(template);
      await db.enqueueMutation({
        type: 'CREATE',
        entity: 'template', 
        entityId: template.id,
        data: template
      });
    } catch (err) {
      console.error('Failed to add template locally:', err);
    }
  },

  updateTemplate: async (id, updates) => {
    set((state) => ({
      templates: state.templates.map(t => t.id === id ? { 
        ...t, 
        ...updates, 
        syncStatus: 'pending', 
        lastModified: new Date().toISOString() 
      } : t)
    }));

    try {
      await db.templates.update(id, { 
        ...updates, 
        syncStatus: 'pending', 
        lastModified: new Date().toISOString() 
      });
      
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'template', 
        entityId: id,
        data: updates
      });
    } catch (err) {
      console.error('Failed to update template locally:', err);
    }
  },

  getTemplatesByProperty: (propertyId) => {
    return get().templates?.filter(t => t.propertyId === propertyId) || [];
  },

  getPropertiesByAgency: (agencyId) => {
    return get().properties.filter(p => p.agencyId === agencyId);
  }
}));
