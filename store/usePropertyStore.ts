import { create } from 'zustand';
import { Property, PropertyTemplate } from '@/types';
import { db } from '@/lib/db';

interface PropertyState {
  properties: Property[];
  templates: PropertyTemplate[];
  loading: boolean;
  error: string | null;

  // Actions
  initStore: () => Promise<void>;
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Property) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  // Template Actions
  setTemplates: (templates: PropertyTemplate[]) => void;
  addTemplate: (template: PropertyTemplate) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<PropertyTemplate>) => Promise<void>;
  getTemplatesByProperty: (propertyId: string) => PropertyTemplate[];
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  templates: [],
  loading: false,
  error: null,

  initStore: async () => {
    set({ loading: true });
    try {
      const [localProps, localTemplates] = await Promise.all([
        db.properties.toArray(),
        db.templates.toArray()
      ]);
      set({ 
        properties: localProps, 
        templates: localTemplates, 
        loading: false 
      });
    } catch (err) {
      console.error('Failed to init PropertyStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement local des biens' });
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
        entity: 'property', // On utilise le type property pour englober les templates côté mutation? 
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
        entity: 'property', 
        entityId: id,
        data: updates
      });
    } catch (err) {
      console.error('Failed to update template locally:', err);
    }
  },

  getTemplatesByProperty: (propertyId) => {
    return get().templates?.filter(t => t.propertyId === propertyId) || [];
  }
}));
