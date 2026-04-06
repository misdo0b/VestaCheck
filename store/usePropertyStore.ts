import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Property, PropertyTemplate, Room } from '@/types';
import { mockProperties } from '@/data/mock-data';

interface PropertyState {
  properties: Property[];
  templates: PropertyTemplate[];
  loading: boolean;

  // Property Actions
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // Template Actions
  setTemplates: (templates: PropertyTemplate[]) => void;
  addTemplate: (template: PropertyTemplate) => void;
  updateTemplate: (id: string, updates: Partial<PropertyTemplate>) => void;
  getTemplatesByProperty: (propertyId: string) => PropertyTemplate[];
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: mockProperties,
      templates: [], // Initialement vide, à charger si besoin
      loading: false,

      setProperties: (properties) => set({ properties }),
      
      addProperty: (property) => set((state) => ({
        properties: [...state.properties, property]
      })),

      updateProperty: (id, updates) => set((state) => ({
        properties: state.properties.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deleteProperty: (id) => set((state) => ({
        properties: state.properties.filter(p => p.id !== id)
      })),

      setTemplates: (templates) => set({ templates }),

      addTemplate: (template) => set((state) => ({
        templates: [...state.templates, template]
      })),

      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      getTemplatesByProperty: (propertyId) => {
        return get().templates.filter(t => t.propertyId === propertyId);
      }
    }),
    {
      name: 'vestacheck-properties-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
