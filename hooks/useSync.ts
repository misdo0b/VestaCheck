'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db';
import { useInspectionStore } from '@/store/useInspectionStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useTenantStore } from '@/store/useTenantStore';

export function useSync() {
  const { data: session } = useSession();
  const { syncStatus, setSyncStatus } = useInspectionStore();
  const { fetchProperties } = usePropertyStore();
  const { fetchTenants } = useTenantStore();
  const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

  // Verrou pour empêcher des exécutions concurrentes du processQueue
  const isProcessingRef = useRef(false);

  /**
   * Upload des photos HD qui n'ont pas encore été synchronisées.
   * On le fait en amont de la synchro SQL pour avoir les URLs Cloudinary prêtes.
   */
  const uploadUnsyncedPhotos = useCallback(async () => {
    try {
      // Utilisation d'un filtre au lieu d'un where clause pour éviter les erreurs "The parameter is not a valid key"
      // sur les index bohéens dans certains environnements IndexedDB.
      const unsyncedPhotos = await db.photos.filter(p => !p.isSynced || (p.isSynced as any) === 0 || (p.isSynced as any) === false).toArray();
      if (unsyncedPhotos.length === 0) return;

      console.log(`[Sync] ${unsyncedPhotos.length} photos HD en attente d'upload...`);
      
      const allInspections = await db.inspections.toArray();
      const modifiedInspectionIds = new Set<string>();

      for (const photo of unsyncedPhotos) {
        if (!photo.blob) continue;
        
        const formData = new FormData();
        formData.append('file', photo.blob, `${photo.id}.jpg`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const { url } = await response.json();

          // 1. Mise à jour table photos
          await db.photos.update(photo.id, {
            isSynced: true,
            cloudUrl: url
          });

          // 2. Mise à jour en mémoire des inspections correspondantes
          for (let i = 0; i < allInspections.length; i++) {
            const insp = allInspections[i];
            let photoFound = false;
            
            const updatedRooms = insp.rooms.map(room => ({
              ...room,
              items: room.items.map(item => {
                if (item.photos.some(p => p.id === photo.id)) {
                  photoFound = true;
                  return {
                    ...item,
                    photos: item.photos.map(p =>
                      p.id === photo.id ? { ...p, isSynced: true, cloudUrl: url } : p
                    )
                  };
                }
                return item;
              })
            }));

            if (photoFound) {
              allInspections[i] = { ...insp, rooms: updatedRooms };
              modifiedInspectionIds.add(insp.id);
            }
          }
        }
      }

      // 3. Persistance groupée des inspections modifiées
      for (const id of modifiedInspectionIds) {
        const updatedInsp = allInspections.find(insp => insp.id === id);
        if (updatedInsp) {
          await db.inspections.update(id, { rooms: updatedInsp.rooms });
          await db.enqueueMutation({
            type: 'UPDATE',
            entity: 'inspection',
            entityId: id,
            data: updatedInsp
          });
        }
      }
    } catch (error) {
      console.error('[Sync] Erreur upload photos HD:', error);
    }
  }, []);

  /**
   * Processus principal de synchronisation
   * 1. Upload des photos HD
   * 2. Envoi des mutations (CRUD) en batch vers l'API
   * 3. Récupération des dernières données
   */
  const processQueue = useCallback(async () => {
    if (!session || !isOnline || isProcessingRef.current) return;

    try {
      isProcessingRef.current = true;

      // 1. Upload des photos HD d'abord
      await uploadUnsyncedPhotos();

      // 2. Traitement de la file de mutations SQL
      const rawMutations = await db.mutationQueue.toArray();
      
      // Si rien à synchroniser, on s'arrête là
      if (rawMutations.length === 0) {
        if (syncStatus !== 'synced') setSyncStatus('synced');
        return;
      }

      setSyncStatus('syncing');

      // Préparation du batch
      const mutations = rawMutations.map(m => ({
        ...m,
        // On s'assure que les données sont propres pour JSON
        data: typeof m.data === 'string' ? JSON.parse(m.data) : m.data
      }));

      console.log(`[Sync] Envoi de ${mutations.length} mutations...`);

      const response = await fetch('/api/inspections/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Suppression des mutations traitées avec succès
        const processedIds = mutations.map(m => m.id);
        await db.mutationQueue.bulkDelete(processedIds);
        
        // Rafraîchissement des données locales pour s'assurer de la cohérence avec le serveur
        await Promise.all([
          fetchProperties(),
          fetchTenants()
        ]);

        setSyncStatus('synced');
        console.log('[Sync] Synchronisation réussie');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('[Sync] Erreur critique:', error);
      setSyncStatus('error');
    } finally {
      isProcessingRef.current = false;
      // Sécurité : si on sort du processus et qu'on est resté en "syncing", on repasse en "synced" 
      // (sauf si une erreur a déjà été enregistrée)
      if (useInspectionStore.getState().syncStatus === 'syncing') {
        setSyncStatus('synced');
      }
    }
  }, [session, syncStatus, setSyncStatus, uploadUnsyncedPhotos, fetchProperties, fetchTenants, isOnline]);

  // Déclenchement automatique de la synchro au montage et quand on repasse online
  useEffect(() => {
    if (isOnline && session) {
      processQueue();
    }
  }, [isOnline, session, processQueue]);

  // Intervalle de sécurité (toutes les 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && session) {
        processQueue();
      }
    }, 120000);
    return () => clearInterval(interval);
  }, [isOnline, session, processQueue]);

  return { processQueue, isOnline, isSyncing: syncStatus === 'syncing' };
}
