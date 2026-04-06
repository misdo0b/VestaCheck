import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

/**
 * Adaptateur de stockage personnalisé pour Zustand utilisant IndexedDB (via idb-keyval)
 * Permet un stockage asynchrone, plus robuste et avec une limite bien supérieure au localStorage (Go vs 5Mo).
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
