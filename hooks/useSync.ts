import React, { useEffect, useCallback, useState } from 'react';
import { useInspectionStore } from '@/store/useInspectionStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useTenantStore } from '@/store/useTenantStore';
import { db } from '@/lib/db';
import { useSession } from 'next-auth/react';

/**
 * Hook de synchronisation globale.
 * Gère le cycle de vie des données entre IndexedDB et Supabase.
 */
export function useSync() {
  const { data: session } = useSession();
  const { syncStatus, setSyncStatus, currentInspection } = useInspectionStore();
  const { fetchProperties } = usePropertyStore();
  const { fetchTenants } = useTenantStore();

  // Détection de l'état en ligne
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isSyncing = syncStatus === 'syncing';

  /**
   * Synchronise les photos HD (Blobs) vers Supabase Storage
   * Cette étape est complémentaire à la synchronisation des miniatures vers Cloudinary
   */
  const uploadUnsyncedPhotos = useCallback(async () => {
    try {
      const unsyncedPhotos = await db.photos.where('isSynced').equals(0).toArray();
      if (unsyncedPhotos.length === 0) return;

      console.log(`[Sync] ${unsyncedPhotos.length} photos HD en attente d'upload...`);

      for (const photo of unsyncedPhotos) {
        const formData = new FormData();
        formData.append('file', photo.blob, `${photo.id}.jpg`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const { url } = await response.json();
          
          // Mise à jour locale
          await db.photos.update(photo.id, { 
            isSynced: 1, 
            cloudUrl: url,
            lastModified: new Date().toISOString()
          });

          // Mise à jour de l'inspection correspondante dans le JSON pour cohérence
          // On cherche l'élément dans toutes les inspections locales
          const allInspections = await db.inspections.toArray();
          for (const insp of allInspections) {
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
              const updatedInspection = { ...insp, rooms: updatedRooms };
              await db.inspections.update(insp.id, { rooms: updatedRooms });
              
              // On déclenche une mutation de synchro pour mettre à jour la base SQL
              await db.enqueueMutation({
                type: 'UPDATE',
                entity: 'inspection',
                entityId: insp.id,
                data: updatedInspection
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Sync] Erreur upload photos HD:', error);
    }
  }, []);

  /**
   * Traite la file d'attente des mutations de données
   */
  const processQueue = useCallback(async () => {
    if (!session || syncStatus === 'syncing' || !isOnline) return;

    try {
      // 1. Upload des photos HD d'abord
      await uploadUnsyncedPhotos();

      // 2. Synchronisation des mutations de données
      const rawMutations = await db.mutationQueue.orderBy('timestamp').toArray();
      if (rawMutations.length === 0) return;

      setSyncStatus('syncing');

      // Fusion des mutations consécutives pour la même entité (Squashing)
      // On ne garde que la dernière version d'un UPDATE pour une entité donnée
      const squashedMap = new Map();
      const mutationsToDelete = [];

      for (const m of rawMutations) {
        const key = `${m.entity}:${m.entityId}`;
        if (m.type === 'UPDATE' && squashedMap.has(key)) {
          const prev = squashedMap.get(key);
          if (prev.type === 'UPDATE') {
            mutationsToDelete.push(prev.id);
            squashedMap.set(key, m);
            continue;
          }
        }
        squashedMap.set(key, m);
      }

      // Nettoyage immédiat des mutations obsolètes
      if (mutationsToDelete.length > 0) {
        await db.mutationQueue.bulkDelete(mutationsToDelete);
      }

      const uniqueMutations = Array.from(squashedMap.values());
      
      // Enrichissement et nettoyage final
      const mutations = await Promise.all(uniqueMutations.map(async (m) => {
        if (m.entity === 'inspection' && m.type === 'UPDATE') {
          const fullReport = await db.inspections.get(m.entityId);
          if (fullReport) {
            // On s'assure que les photos déjà synchronisées n'envoient plus leur Base64 (trop lourd)
            const cleanedRooms = fullReport.rooms.map(room => ({
              ...room,
              items: room.items.map(item => ({
                ...item,
                photos: item.photos.map(p => ({
                  ...p,
                  compressedBase64: p.isSynced ? '' : p.compressedBase64
                }))
              }))
            }));
            return { ...m, data: { ...fullReport, rooms: cleanedRooms } };
          }
        }
        return m;
      }));

      console.log(`[Sync] Envoi de ${mutations.length} mutations au serveur...`);

      const response = await fetch('/api/inspections/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations })
      });

      if (response.ok) {
        const { results } = await response.json();
        
        // On supprime de la queue locale uniquement ce qui a réussi
        const successfulIds = (results || [])
          .filter((r: any) => r.status === 'success')
          .map((r: any) => r.id);

        if (successfulIds.length > 0) {
          await db.mutationQueue.bulkDelete(successfulIds);
          console.log(`[Sync] ${successfulIds.length} mutations synchronisées.`);
        }

        setSyncStatus('synced');

        // Rafraîchissement optionnel des données globales après une synchro réussie
        if (successfulIds.length > 0) {
          fetchProperties();
          fetchTenants();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Sync] Erreur serveur:', response.status, errorData);
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('[Sync] Erreur lors de la synchronisation:', error);
      setSyncStatus('error');
    }
  }, [session, syncStatus, setSyncStatus, uploadUnsyncedPhotos, fetchProperties, fetchTenants, isOnline]);

  // Déclencheur automatique périodique ou sur changement d'état
  useEffect(() => {
    if (session) {
      const timer = setInterval(() => {
        processQueue();
      }, 30000); // Toutes les 30 secondes si online
      
      // Aussi déclencher immédiatement
      processQueue();
      
      return () => clearInterval(timer);
    }
  }, [session, processQueue]);

  // Déclencheur sur changement manuel d'inspection (quand on quitte un champ par exemple)
  // On ne le fait pas sur chaque touche pour éviter de saturer la queue
  useEffect(() => {
    if (currentInspection && session) {
      const timeout = setTimeout(() => {
         processQueue();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [currentInspection, session, processQueue]);

  return { processQueue, syncStatus, isSyncing, isOnline };
}
