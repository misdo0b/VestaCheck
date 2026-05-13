import { create } from 'zustand';
import { InspectionReport, InspectionItem, PhotoMetadata } from '@/types';
import { uploadInspectionPhoto } from '@/app/actions/media';
import { useTenantStore } from './useTenantStore';
import { db } from '@/lib/db';
import { dataURLToBlob } from '@/lib/utils/image';
import { InspectionReportSchema } from '@/lib/validations/inspection';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const fixInvalidIds = (inspection: InspectionReport): InspectionReport => {
  let changed = false;
  const seenIds = new Set<string>();

  const updatedRooms = inspection.rooms.map(room => {
    let roomChanged = false;
    let roomId = room.id;
    
    // Détection de non-UUID ou de doublon
    if (!isUUID(roomId) || seenIds.has(roomId)) {
      roomId = crypto.randomUUID();
      roomChanged = true;
      changed = true;
    }
    seenIds.add(roomId);

    const updatedItems = room.items.map(item => {
      let itemChanged = false;
      let itemId = item.id;
      
      if (!isUUID(itemId) || seenIds.has(itemId)) {
        itemId = crypto.randomUUID();
        itemChanged = true;
        changed = true;
      }
      seenIds.add(itemId);

      const updatedPhotos = item.photos.map(photo => {
        if (!isUUID(photo.id) || seenIds.has(photo.id)) {
          changed = true;
          const newPhotoId = crypto.randomUUID();
          seenIds.add(newPhotoId);
          return { ...photo, id: newPhotoId };
        }
        seenIds.add(photo.id);
        return photo;
      });

      if (itemChanged || updatedPhotos !== item.photos) {
        return { ...item, id: itemId, photos: updatedPhotos };
      }
      return item;
    });

    if (roomChanged || updatedItems !== room.items) {
      return { ...room, id: roomId, items: updatedItems };
    }
    return room;
  });

  if (changed) {
    return { ...inspection, rooms: updatedRooms, lastModified: new Date().toISOString() };
  }
  return inspection;
};

interface InspectionState {
  inspections: InspectionReport[];
  currentInspection: InspectionReport | null;
  loading: boolean;
  error: string | null;
  syncStatus: 'synced' | 'pending' | 'error' | 'syncing';

  // Actions
  setSyncStatus: (status: 'synced' | 'pending' | 'error' | 'syncing') => void;
  initStore: (user: { id: string; role: string; agencyId: string; organizationId: string }) => Promise<void>;
  setInspections: (inspections: InspectionReport[]) => void;
  setCurrentInspection: (report: InspectionReport | null) => Promise<void>;
  updateItem: (roomId: string, itemId: string, updates: Partial<InspectionItem>) => Promise<void>;
  addPhoto: (roomId: string, itemId: string, photoUrl: string) => Promise<void>;
  saveOffline: () => void;
  finalizeInspection: (id: string, fullData?: InspectionReport) => Promise<void>;
  getInspectionsByAgency: (agencyId: string) => InspectionReport[];
  fetchInspections: (propertyId?: string) => Promise<void>;
  syncPendingPhotos: () => Promise<void>;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  inspections: [],
  currentInspection: null,
  loading: false,
  error: null,
  syncStatus: 'synced',

  setSyncStatus: (status) => set({ syncStatus: status }),

  initStore: async (user) => {
    set({ loading: true });
    try {
      const allLocalInspections = await db.inspections.toArray();

      // Segmentation des données et nettoyage des IDs
      const filteredInspections = allLocalInspections
        .filter(inspection => {
          if (user.role === 'Administrateur') {
            return (inspection as any).organizationId === user.organizationId;
          }
          return inspection.agencyId === user.agencyId;
        })
        .map(inspection => fixInvalidIds(inspection));

      // Mise à jour préventive en DB si des IDs ont été fixés
      for (const inspection of filteredInspections) {
        await db.inspections.put(inspection);
      }

      set({ inspections: filteredInspections, loading: false });
    } catch (err) {
      console.error('Failed to init InspectionStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement des états des lieux' });
    }
  },

  fetchInspections: async (propertyId?: string) => {
    set({ loading: true });
    try {
      const url = propertyId ? `/api/inspections?propertyId=${propertyId}` : '/api/inspections';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          await db.inspections.bulkPut(data);
        }

        // Merge avec les inspections existantes pour ne pas perdre les données des autres biens
        const currentInspections = get().inspections;
        const newInspections = [...currentInspections];

        data.forEach((newInspection: InspectionReport) => {
          const index = newInspections.findIndex(i => i.id === newInspection.id);
          if (index !== -1) {
            newInspections[index] = newInspection;
          } else {
            newInspections.push(newInspection);
          }
        });

        set({ inspections: newInspections, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Fetch inspections failed:', err);
      set({ loading: false });
    }
  },

  setInspections: (inspections) => set({ inspections }),

  setCurrentInspection: async (report) => {
    if (report) {
      const fixedReport = fixInvalidIds(report);
      set({ currentInspection: fixedReport });
      await db.inspections.put(fixedReport);
    } else {
      set({ currentInspection: null });
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

    // Validation Zod avant mise en file d'attente
    const validation = InspectionReportSchema.safeParse(updatedInspection);
    if (!validation.success) {
      console.error('Validation échouée (updateItem):', validation.error);
      return;
    }

    set({ currentInspection: updatedInspection });

    try {
      await db.inspections.put(updatedInspection);
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'inspection',
        entityId: updatedInspection.id,
        data: updatedInspection
      });
    } catch (err) {
      console.error('Offline update failed:', err);
    }
  },

  addPhoto: async (roomId, itemId, photoUrl) => {
    const { currentInspection } = get();
    if (!currentInspection) return;

    const photoId = crypto.randomUUID();
    const newPhoto: PhotoMetadata = {
      id: photoId,
      compressedBase64: photoUrl, // Version UI
      isSynced: false,
      status: 'PENDING'
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

    // Validation Zod avant mise en file d'attente
    const validation = InspectionReportSchema.safeParse(updatedInspection);
    if (!validation.success) {
      console.error('Validation échouée (addPhoto):', validation.error);
      return;
    }

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
        data: updatedInspection
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

    // Validation Zod avant mise en file d'attente
    const validation = InspectionReportSchema.safeParse(finalizedReport);
    if (!validation.success) {
      console.error('Validation échouée (finalizeInspection):', validation.error);
      set({ error: "Le rapport ne respecte pas les critères légaux pour être finalisé." });
      return;
    }

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
  },

  getInspectionsByAgency: (agencyId) => {
    return get().inspections.filter(i => i.agencyId === agencyId);
  },

  syncPendingPhotos: async () => {
    const allLocalInspections = await db.inspections.toArray();
    const { updateItem, inspections } = get();

    for (const inspection of allLocalInspections) {
      let hasChanged = false;
      const updatedRooms = [...inspection.rooms];

      for (let i = 0; i < updatedRooms.length; i++) {
        const room = updatedRooms[i];
        let roomChanged = false;
        const updatedItems = [...room.items];

        for (let j = 0; j < updatedItems.length; j++) {
          const item = updatedItems[j];
          const pendingPhotos = item.photos.filter(p => p.status === 'PENDING' || p.status === 'ERROR');

          if (pendingPhotos.length === 0) continue;

          const updatedPhotos = [...item.photos];
          let itemChanged = false;

          for (let k = 0; k < updatedPhotos.length; k++) {
            const photo = updatedPhotos[k];
            if (photo.status !== 'PENDING' && photo.status !== 'ERROR') continue;

            // 1. Marquer comme SYNCING
            updatedPhotos[k] = { ...photo, status: 'SYNCING' as const };
            itemChanged = true;
            
            // Mise à jour immédiate pour l'UI si c'est l'inspection courante
            if (get().currentInspection?.id === inspection.id) {
              set(state => ({
                currentInspection: {
                  ...state.currentInspection!,
                  rooms: state.currentInspection!.rooms.map(r => 
                    r.id === room.id ? {
                      ...r,
                      items: r.items.map(it => it.id === item.id ? { ...it, photos: updatedPhotos } : it)
                    } : r
                  )
                }
              }));
            }

            // 2. Appel de la Server Action
            try {
              const result = await uploadInspectionPhoto(photo.compressedBase64, {
                propertyId: inspection.propertyId,
                organizationId: (inspection as any).organizationId,
                agencyId: inspection.agencyId,
              });

              if (result.success && result.url) {
                updatedPhotos[k] = {
                  ...photo,
                  status: 'UPLOADED' as const,
                  cloudUrl: result.url,
                  isSynced: true,
                  compressedBase64: '' 
                };
              } else {
                updatedPhotos[k] = { ...photo, status: 'ERROR' as const };
              }
            } catch (err) {
              console.error('Error uploading photo:', err);
              updatedPhotos[k] = { ...photo, status: 'ERROR' as const };
            }
            itemChanged = true;
          }

          if (itemChanged) {
            updatedItems[j] = { ...item, photos: updatedPhotos };
            roomChanged = true;
          }
        }

        if (roomChanged) {
          updatedRooms[i] = { ...room, items: updatedItems };
          hasChanged = true;
        }
      }

      if (hasChanged) {
        const updatedInspection = {
          ...inspection,
          rooms: updatedRooms,
          syncStatus: 'pending' as const,
          lastModified: new Date().toISOString()
        };

        // Sauvegarde DB
        await db.inspections.put(updatedInspection);
        
        // Mise à jour du store
        set(state => ({
          inspections: state.inspections.map(ins => ins.id === updatedInspection.id ? updatedInspection : ins),
          currentInspection: state.currentInspection?.id === updatedInspection.id ? updatedInspection : state.currentInspection
        }));

        // Enqueue mutation pour le JSON
        await db.enqueueMutation({
          type: 'UPDATE',
          entity: 'inspection',
          entityId: updatedInspection.id,
          data: updatedInspection
        });
      }
    }
  }
}));
