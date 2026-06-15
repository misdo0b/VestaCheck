import { create } from 'zustand';
import { InspectionReport, SyncStatus, Room } from '@/types';
import { db } from '@/lib/db';
import { uploadInspectionPhoto } from '@/app/actions/media';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const fixInvalidIds = (inspection: InspectionReport): InspectionReport => {
  if (!inspection || !inspection.rooms || !Array.isArray(inspection.rooms)) {
    return inspection;
  }
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
  syncStatus: SyncStatus;

  // Actions
  initStore: (user: any) => Promise<void>;
  fetchInspections: (propertyId?: string) => Promise<void>;
  setInspections: (inspections: InspectionReport[]) => void;
  setCurrentInspection: (report: InspectionReport | null) => void;
  addInspection: (report: InspectionReport) => Promise<void>;
  updateInspection: (id: string, report: Partial<InspectionReport>) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;
  
  // Actions spécifiques au rapport
  updateRoom: (roomId: string, data: Partial<Room>) => void;
  updateItem: (roomId: string, itemId: string, data: Partial<any>) => void;
  addPhoto: (roomId: string, itemId: string, photo: any) => Promise<void>;
  deletePhoto: (roomId: string, itemId: string, photoId: string) => void;
  
  // Synchronisation
  setSyncStatus: (status: SyncStatus) => void;
  syncPendingPhotos: (inspectionId: string) => Promise<void>;
  finalizeInspection: (id: string, report: Partial<InspectionReport>) => Promise<void>;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  inspections: [],
  currentInspection: null,
  loading: false,
  error: null,
  syncStatus: 'synced',

  initStore: async (user) => {
    if (!user) return;
    set({ loading: true });
    try {
      const allLocalInspections = await db.inspections.toArray();

      // Segmentation des données et nettoyage des IDs
      const filteredInspections = allLocalInspections
        .filter(inspection => {
          if (user.role === 'Administrateur') {
            return (inspection as any).organizationId === user.organizationId;
          }
          if (user.role === 'Propriétaire') {
            return inspection.ownerId === user.id;
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
      // On s'assure que les IDs sont valides dès qu'on sélectionne un rapport
      const fixedReport = fixInvalidIds(report);
      if (fixedReport !== report) {
        await db.inspections.put(fixedReport);
      }
      set({ currentInspection: fixedReport });
    } else {
      set({ currentInspection: null });
    }
  },

  addInspection: async (report) => {
    const fixedReport = fixInvalidIds(report);
    await db.inspections.add(fixedReport);
    await db.enqueueMutation({
      type: 'CREATE',
      entity: 'inspection',
      entityId: fixedReport.id,
      data: fixedReport
    });
    set(state => ({ inspections: [fixedReport, ...state.inspections] }));
  },

  updateInspection: async (id, data) => {
    const current = get().inspections.find(i => i.id === id);
    if (!current) return;

    const updated = fixInvalidIds({ ...current, ...data, lastModified: new Date().toISOString() });
    await db.inspections.put(updated);
    await db.enqueueMutation({
      type: 'UPDATE',
      entity: 'inspection',
      entityId: id,
      data: updated
    });

    set(state => ({
      inspections: state.inspections.map(i => i.id === id ? updated : i),
      currentInspection: state.currentInspection?.id === id ? updated : state.currentInspection
    }));
  },

  deleteInspection: async (id) => {
    await db.inspections.delete(id);
    await db.enqueueMutation({
      type: 'DELETE',
      entity: 'inspection',
      entityId: id,
      data: { id }
    });
    set(state => ({
      inspections: state.inspections.filter(i => i.id !== id),
      currentInspection: state.currentInspection?.id === id ? null : state.currentInspection
    }));
  },

  updateRoom: (roomId, data) => {
    const current = get().currentInspection;
    if (!current) return;

    const updatedRooms = current.rooms.map(r => 
      r.id === roomId ? { ...r, ...data } : r
    );
    
    get().updateInspection(current.id, { rooms: updatedRooms });
  },

  updateItem: (roomId, itemId, data) => {
    const current = get().currentInspection;
    if (!current) return;

    const updatedRooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        items: room.items.map(item => 
          item.id === itemId ? { ...item, ...data } : item
        )
      };
    });

    get().updateInspection(current.id, { rooms: updatedRooms });
  },

  addPhoto: async (roomId, itemId, photo) => {
    const current = get().currentInspection;
    if (!current) return;

    // 1. Sauvegarde dans IndexedDB (Photos HD)
    await db.photos.add({
      id: photo.id,
      itemId,
      blob: photo.blob,
      isSynced: false,
      compressedBase64: photo.compressedBase64,
      status: 'PENDING' as const,
      lastModified: new Date().toISOString()
    });

    // 2. Mise à jour du rapport (Miniature)
    const updatedRooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        items: room.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            photos: [...item.photos, {
              id: photo.id,
              compressedBase64: photo.compressedBase64,
              isSynced: false,
              status: 'PENDING' as const
            }]
          };
        })
      };
    });

    await get().updateInspection(current.id, { rooms: updatedRooms });
  },

  deletePhoto: async (roomId, itemId, photoId) => {
    const current = get().currentInspection;
    if (!current) return;

    // Suppression physique
    await db.photos.delete(photoId);

    const updatedRooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        items: room.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            photos: item.photos.filter(p => p.id !== photoId)
          };
        })
      };
    });

    await get().updateInspection(current.id, { rooms: updatedRooms });
  },

  finalizeInspection: async (id, data) => {
    const current = get().inspections.find(i => i.id === id);
    
    // Si l'état des lieux n'existe pas en local (cas d'une création directe), on initialise une structure par défaut
    const baseReport = current || {
      id,
      propertyId: data.propertyId || '',
      propertyAddress: data.propertyAddress || '',
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'Entrée',
      ownerId: data.ownerId || '',
      inspectorId: data.inspectorId || '',
      tenantId: data.tenantId || '',
      agencyId: data.agencyId || '',
      organizationId: data.organizationId || '',
      counters: data.counters || { water: 0, electricity: 0, gas: 0 },
      keyInventories: data.keyInventories || [],
      generalObservations: data.generalObservations || '',
      signatures: data.signatures || {
        tenant: { type: 'Aucune' },
        inspector: { type: 'Aucune' }
      },
      rooms: data.rooms || [],
      isFinalized: false,
      serverVersion: 0,
      syncStatus: 'pending' as const
    };

    const updated = fixInvalidIds({
      ...baseReport,
      ...data,
      agencyId: data.agencyId || baseReport.agencyId || '',
      organizationId: data.organizationId || baseReport.organizationId || '',
      isFinalized: true,
      syncStatus: 'pending' as const,
      lastModified: new Date().toISOString()
    } as InspectionReport);

    await db.inspections.put(updated);
    await db.enqueueMutation({
      type: current ? 'UPDATE' : 'CREATE',
      entity: 'inspection',
      entityId: id,
      data: updated
    });

    set(state => {
      const exists = state.inspections.some(i => i.id === id);
      const nextInspections = exists
        ? state.inspections.map(i => i.id === id ? updated : i)
        : [updated, ...state.inspections];

      return {
        inspections: nextInspections,
        currentInspection: state.currentInspection?.id === id ? updated : state.currentInspection
      };
    });

    // Lancer la synchronisation des photos HD en arrière-plan
    get().syncPendingPhotos(id).catch(err => {
      console.error("[Sync] Erreur lors de la synchronisation des photos :", err);
    });
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  syncPendingPhotos: async (inspectionId) => {
    const inspection = get().inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    let hasChanged = false;
    const updatedRooms = [...inspection.rooms];

    for (let i = 0; i < updatedRooms.length; i++) {
      const room = updatedRooms[i];
      let roomChanged = false;
      const updatedItems = [...room.items];

      for (let j = 0; j < updatedItems.length; j++) {
        const item = updatedItems[j];
        let itemChanged = false;
        const updatedPhotos = [...item.photos];

        for (let k = 0; k < updatedPhotos.length; k++) {
          const photo = updatedPhotos[k];
          if (photo.status === 'PENDING' && photo.compressedBase64) {
            try {
              if (!photo.compressedBase64) {
                updatedPhotos[k] = { ...photo, status: 'ERROR' as const };
                continue;
              }

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

        // Envoi mutation SQL
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
