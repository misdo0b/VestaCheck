import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { InspectionReport, InspectionItem, PhotoMetadata } from '@/types';
import { mockInspections } from '@/data/mock-data';
import { idbStorage } from '@/lib/utils/store-storage';

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
  finalizeInspection: (id: string, fullData?: InspectionReport) => void;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set) => ({
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
        // La persistance est maintenant gérée automatiquement par le middleware persist + IndexedDB
        console.log("Sauvegarde persistante effectuée via IndexedDB");
      },

      finalizeInspection: (id, fullData) => set((state) => {
        const targetReport = fullData || (state.currentInspection?.id === id ? state.currentInspection : state.inspections.find(r => r.id === id));
        
        if (!targetReport) return state;

        const finalizedReport = { ...targetReport, isFinalized: true };
        const exists = state.inspections.some(r => r.id === id);

        return {
          currentInspection: finalizedReport,
          inspections: exists
            ? state.inspections.map(r => r.id === id ? finalizedReport : r)
            : [...state.inspections, finalizedReport]
        };
      })
    }),
    {
      name: 'vestacheck-inspections-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
