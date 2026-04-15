import { create } from 'zustand';
import { InspectionReport, InspectionItem, PhotoMetadata } from '@/types';
import { useTenantStore } from './useTenantStore';
import { db } from '@/lib/db';
import { dataURLToBlob } from '@/lib/utils/image';

interface InspectionState {
  inspections: InspectionReport[];
  currentInspection: InspectionReport | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  initStore: () => Promise<void>;
  setInspections: (inspections: InspectionReport[]) => void;
  setCurrentInspection: (report: InspectionReport | null) => Promise<void>;
  updateItem: (roomId: string, itemId: string, updates: Partial<InspectionItem>) => Promise<void>;
  addPhoto: (roomId: string, itemId: string, photoUrl: string) => Promise<void>;
  saveOffline: () => void;
  finalizeInspection: (id: string, fullData?: InspectionReport) => Promise<void>;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  inspections: [],
  currentInspection: null,
  loading: false,
  error: null,

  initStore: async () => {
    set({ loading: true });
    try {
      const localInspections = await db.inspections.toArray();
      set({ inspections: localInspections, loading: false });
    } catch (err) {
      console.error('Failed to init InspectionStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement des états des lieux' });
    }
  },

  setInspections: (inspections) => set({ inspections }),
  
  setCurrentInspection: async (report) => {
    set({ currentInspection: report });
    if (report) {
      await db.inspections.put(report);
    }
  },

  updateItem: async (roomId, itemId, updates) => {
    const { currentInspection } = get();
    if (!currentInspection) return;

    const newRooms = currentInspection.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        items: room.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, ...updates };
        })
      };
    });

    const updatedInspection: InspectionReport = {
      ...currentInspection,
      rooms: newRooms,
      syncStatus: 'pending',
      lastModified: new Date().toISOString()
    };

    set({ currentInspection: updatedInspection });

    try {
      await db.inspections.put(updatedInspection);
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'inspection',
        entityId: updatedInspection.id,
        data: { rooms: newRooms }
      });
    } catch (err) {
      console.error('Offline update failed:', err);
    }
  },

  addPhoto: async (roomId, itemId, photoUrl) => {
    const { currentInspection } = get();
    if (!currentInspection) return;

    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPhoto: PhotoMetadata = {
      id: photoId,
      compressedBase64: photoUrl, // Version UI
      isSynced: false
    };

    const newRooms = currentInspection.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        items: room.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, photos: [...item.photos, newPhoto] };
        })
      };
    });

    const updatedInspection: InspectionReport = {
      ...currentInspection,
      rooms: newRooms,
      syncStatus: 'pending',
      lastModified: new Date().toISOString()
    };

    set({ currentInspection: updatedInspection });

    try {
      // 1. Sauvegarde l'inspection mise à jour
      await db.inspections.put(updatedInspection);
      
      // 2. Sauvegarde le Blob HD dans Dexie pour upload ultérieur
      const blob = dataURLToBlob(photoUrl);
      await db.photos.add({
        ...newPhoto,
        itemId,
        blob
      });

      // 3. Mutation de synchronisation
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'inspection',
        entityId: updatedInspection.id,
        data: { rooms: newRooms }
      });
    } catch (err) {
      console.error('Failed to save photo offline:', err);
    }
  },

  saveOffline: () => {
    console.log("Les données sont persistées automatiquement via Dexie.js");
  },

  finalizeInspection: async (id, fullData) => {
    const { currentInspection, inspections } = get();
    const targetReport = fullData || (currentInspection?.id === id ? currentInspection : inspections.find(r => r.id === id));
    
    if (!targetReport) return;

    const finalizedReport: InspectionReport = { 
      ...targetReport, 
      isFinalized: true,
      syncStatus: 'pending',
      lastModified: new Date().toISOString()
    };

    set((state) => ({
      currentInspection: state.currentInspection?.id === id ? finalizedReport : state.currentInspection,
      inspections: state.inspections.some(r => r.id === id)
        ? state.inspections.map(r => r.id === id ? finalizedReport : r)
        : [...state.inspections, finalizedReport]
    }));

    try {
      await db.inspections.put(finalizedReport);
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'inspection',
        entityId: id,
        data: finalizedReport // Envoi de l'intégralité du rapport
      });
      
      // Automatisation du statut locataire si c'est une sortie
      if (finalizedReport.type === 'Sortie' && finalizedReport.tenantId) {
        await useTenantStore.getState().updateTenant(finalizedReport.tenantId, { 
          status: 'Sorti' 
        });
      }
    } catch (err) {
      console.error('Finalization save failed:', err);
    }
  }
}));
