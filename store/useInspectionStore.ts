import { create } from 'zustand';
import { InspectionReport, InspectionItem, PhotoMetadata } from '@/types';
import { uploadInspectionPhoto } from '@/app/actions/media';
import { useTenantStore } from './useTenantStore';
import { db } from '@/lib/db';
import { dataURLToBlob } from '@/lib/utils/image';
import { InspectionReportSchema } from '@/lib/validations/inspection';

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
      
      // Segmentation des données
      const filteredInspections = allLocalInspections.filter(inspection => {
        if (user.role === 'Administrateur') {
          // L'admin voit tout son organisation
          return (inspection as any).organizationId === user.organizationId;
        }
        // L'agent ne voit que son agence
        return inspection.agencyId === user.agencyId;
      });

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
        
        // 1. Récupérer les ID des inspections en attente de synchronisation
        const pendingMutations = await db.mutationQueue.where('entity').equals('inspection').toArray();
        const pendingIds = pendingMutations.map(m => m.entityId);

        if (data.length > 0) {
          // 2. Ne sauvegarder en local que les inspections qui n'ont pas de modifs en attente
          const safeData = data.filter((d: InspectionReport) => !pendingIds.includes(d.id));
          if (safeData.length > 0) {
            await db.inspections.bulkPut(safeData);
          }
        }
        
        // Merge avec les inspections existantes pour ne pas perdre les données des autres biens
        const currentInspections = get().inspections;
        const newInspections = [...currentInspections];
        
        data.forEach((newInspection: InspectionReport) => {
          // 3. Ignorer l'écrasement dans le store pour les inspections avec des modifs locales
          if (pendingIds.includes(newInspection.id)) {
            return;
          }

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

    // Validation Zod (informative pour les brouillons, ne pas bloquer)
    const validation = InspectionReportSchema.safeParse(updatedInspection);
    if (!validation.success) {
      console.warn('Draft validation warning (updateItem):', validation.error.format());
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

    // Validation Zod (informative pour les brouillons, ne pas bloquer)
    const validation = InspectionReportSchema.safeParse(updatedInspection);
    if (!validation.success) {
      console.warn('Draft validation warning (addPhoto):', validation.error.format());
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
      throw new Error("Validation Zod échouée pour la finalisation.");
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
    const { currentInspection, updateItem } = get();
    if (!currentInspection) return;

    // On parcourt toutes les pièces et tous les éléments pour trouver les photos PENDING
    for (const room of currentInspection.rooms) {
      for (const item of room.items) {
        // On synchronise les photos en attente OU en erreur (retry)
        const pendingPhotos = item.photos.filter(p => p.status === 'PENDING' || p.status === 'ERROR');
        
        if (pendingPhotos.length === 0) continue;

        for (const photo of pendingPhotos) {
          // 1. Marquer comme SYNCING dans l'UI (Optimistic)
          const updatedPhotos = item.photos.map(p => 
            p.id === photo.id ? { ...p, status: 'SYNCING' as const } : p
          );
          await updateItem(room.id, item.id, { photos: updatedPhotos });

          // 2. Appel de la Server Action
          const result = await uploadInspectionPhoto(photo.compressedBase64, {
            propertyId: currentInspection.propertyId,
            organizationId: currentInspection.organizationId,
            agencyId: currentInspection.agencyId,
          });

          if (result.success && result.url) {
            // 3. Succès : UPLOADED + remoteUrl + nettoyage Base64
            const finalPhotos = item.photos.map(p => 
              p.id === photo.id ? { 
                ...p, 
                status: 'UPLOADED' as const, 
                cloudUrl: result.url,
                isSynced: true,
                compressedBase64: '' // Libère la mémoire comme demandé
              } : p
            );
            await updateItem(room.id, item.id, { photos: finalPhotos });
          } else {
            // 4. Échec : ERROR
            const errorPhotos = item.photos.map(p => 
              p.id === photo.id ? { ...p, status: 'ERROR' as const } : p
            );
            await updateItem(room.id, item.id, { photos: errorPhotos });
          }
        }
      }
    }
  }
}));
