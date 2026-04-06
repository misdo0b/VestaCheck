import { create } from 'zustand';
import { InspectionReport, InspectionItem, PhotoMetadata } from '@/types';
import { mockInspections } from '@/data/mock-data';

interface InspectionState {
  inspections: InspectionReport[];
  currentInspection: InspectionReport | null;
  loading: boolean;
  
  // Actions
  setInspections: (inspections: InspectionReport[]) => void;
  setCurrentInspection: (report: InspectionReport | null) => void;
  updateItem: (roomId: string, itemId: string, updates: Partial<InspectionItem>) => void;
  addPhoto: (roomId: string, itemId: string, photoUrl: string) => void;
  saveOffline: () => void;
}

export const useInspectionStore = create<InspectionState>((set) => ({
  inspections: mockInspections,
  currentInspection: null,
  loading: false,

  setInspections: (inspections) => set({ inspections }),
  
  setCurrentInspection: (report) => set({ currentInspection: report }),

  updateItem: (roomId, itemId, updates) => set((state) => {
    if (!state.currentInspection) return state;
    
    const newRooms = state.currentInspection.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        items: room.items.map(item => {
          if (item.id !== itemId) return { ...item };
          return { ...item, ...updates };
        })
      };
    });

    return {
      currentInspection: {
        ...state.currentInspection,
        rooms: newRooms
      }
    };
  }),

  addPhoto: (roomId, itemId, photoUrl) => set((state) => {
    if (!state.currentInspection) return state;

    const newRooms = state.currentInspection.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        items: room.items.map(item => {
          if (item.id !== itemId) return item;
          const newPhoto: PhotoMetadata = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            compressedBase64: photoUrl,
            isSynced: false
          };
          return { ...item, photos: [...item.photos, newPhoto] };
        })
      };
    });

    return {
      currentInspection: {
        ...state.currentInspection,
        rooms: newRooms
      }
    };
  }),

  saveOffline: () => {
    // Logique de persistance locale via IndexedDB ou LocalStorage
    console.log("Sauvegarde locale effectuée (Simulée)");
  }
}));
