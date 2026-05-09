import { useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useInspectionStore } from '@/store/useInspectionStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { useTenantStore } from '@/store/useTenantStore';
import { useAgencyStore } from '@/store/useAgencyStore';
import { useOrganizationStore } from '@/store/useOrganizationStore';

/**
 * useSync - Hook de gestion de la synchronisation en arrière-plan
 * Gère l'authentification, l'upload des photos HD et la file d'attente des mutations.
 */
export function useSync() {
  const { data: session } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Observer la file d'attente (Mutations + Photos non synchronisées)
  const mutationCount = useLiveQuery(() => db.mutationQueue.count()) || 0;
  const unsyncedPhotosCount = useLiveQuery(() => 
    db.photos.filter(photo => photo.isSynced === false).count()
  ) || 0;

  // Pour rafraîchir les stores après synchro
  const { initStore: initInspections, currentInspection } = useInspectionStore();
  const { initStore: initProperties } = usePropertyStore();
  const { initStore: initUsers } = useUserStore();
  const { initStore: initTenants } = useTenantStore();
  const { initStore: initAgencies } = useAgencyStore();
  const { initStore: initOrganizations } = useOrganizationStore();

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

  /**
   * uploadUnsyncedPhotos - Parcourt et upload les photos HD stockées localement
   */
  const uploadUnsyncedPhotos = async () => {
    const unsyncedPhotos = await db.photos.filter(photo => photo.isSynced === false).toArray();
    if (unsyncedPhotos.length === 0) return;

    console.log(`[Sync] Upload de ${unsyncedPhotos.length} photo(s) HD...`);

    for (const photo of unsyncedPhotos) {
      if (!photo.blob) {
        // Nettoyage si le blob est manquant mais marqué non-sync
        await db.photos.update(photo.id, { isSynced: true });
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', photo.blob, `photo-${photo.id}.jpg`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const { url } = await response.json();
          
          // 1. Mettre à jour l'enregistrement photo local
          await db.photos.update(photo.id, { 
            isSynced: true, 
            cloudUrl: url,
            blob: undefined // Libère de la mémoire après upload réussi
          });

          // 2. Mettre à jour l'inspection correspondante dans le JSON rooms
          const allInspections = await db.inspections.toArray();
          for (const insp of allInspections) {
            let found = false;
            const updatedRooms = insp.rooms.map(room => ({
              ...room,
              items: room.items.map(item => {
                if (item.id === photo.itemId) {
                  return {
                    ...item,
                    photos: item.photos.map(p => {
                      if (p.id === photo.id) {
                        found = true;
                        return { ...p, isSynced: true, cloudUrl: url };
                      }
                      return p;
                    })
                  };
                }
                return item;
              })
            }));

            if (found) {
              await db.inspections.update(insp.id, { rooms: updatedRooms });
              // Si c'est l'inspection en cours, on déclenche une mutation de synchro pour le cloudUrl
              await db.enqueueMutation({
                type: 'UPDATE',
                entity: 'inspection',
                entityId: insp.id,
                data: { rooms: updatedRooms }
              });
              break;
            }
          }
        }
      } catch (err) {
        console.error(`[Sync] Échec upload photo ${photo.id}:`, err);
      }
    }
  };

  const processQueue = useCallback(async () => {
    // Éviter les doubles lancements ou la synchro hors-ligne/non-identifié
    if (isSyncing || !isOnline || !session) return;

    const mutations = await db.mutationQueue.orderBy('timestamp').toArray();
    if (mutations.length === 0 && unsyncedPhotosCount === 0) return;

    setIsSyncing(true);
    console.log(`[Sync] Démarrage du cycle de synchronisation...`);

    try {
      // 1. Synchronisation des Photos HD
      await uploadUnsyncedPhotos();

      // 2. Synchronisation des mutations de données
      const remainingMutations = await db.mutationQueue.orderBy('timestamp').toArray();
      if (remainingMutations.length > 0) {
        const response = await fetch('/api/inspections/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mutations: remainingMutations })
        });

        if (response.ok) {
          const syncResult = await response.json();
          const results = syncResult.results || [];
          
          // On ne supprime que les mutations qui ont réussi côté serveur
          const successfulMutationIds = results
            .filter((r: any) => r.status === 'success')
            .map((r: any) => r.id);
            
          const failedCount = results.length - successfulMutationIds.length;
          
          if (successfulMutationIds.length > 0) {
            await db.mutationQueue.bulkDelete(successfulMutationIds);
          }

          // Gestion des erreurs fatales (ex: UUID invalide) pour éviter les boucles infinies
          const fatalMutationIds = results
            .filter((r: any) => r.status === 'error' && r.error.includes('Invalid UUID format'))
            .map((r: any) => r.id);
            
          if (fatalMutationIds.length > 0) {
            console.warn(`[Sync] Suppression de ${fatalMutationIds.length} mutation(s) invalides (IDs obsolètes)`);
            await db.mutationQueue.bulkDelete(fatalMutationIds);
          }

          if (failedCount > 0) {
            const failedMutations = results.filter((r: any) => r.status === 'error');
            console.error(`[Sync] ${failedCount} mutations ont échoué :`, failedMutations);
            toast.warning(`${failedCount} éléments n'ont pas pu être synchronisés.`, {
              id: 'sync-warning',
              description: 'Vérifiez la console pour plus de détails.'
            });
          } else {
            toast.success("Données synchronisées avec succès", { id: 'sync-success' });
          }
          
          // Rafraîchir les stores pour obtenir l'état final du serveur
          const user = session.user as any;
          await Promise.all([
            initInspections(user),
            initProperties(user),
            initUsers(user),
            initTenants(user),
            initAgencies(user),
            initOrganizations(user)
          ]);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur serveur lors de la synchronisation");
        }
      }
    } catch (err: any) {
      console.error('[Sync] Error:', err);
      toast.error(`Échec de la synchronisation`, {
        id: 'sync-error',
        description: err.message || 'Erreur inconnue'
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, session, initInspections, initProperties, initUsers, initTenants, unsyncedPhotosCount]);

  // Synchronisation réactive : déclenchée dès que mutationCount > 0 ou photos en attente
  useEffect(() => {
    if ((mutationCount > 0 || unsyncedPhotosCount > 0) && isOnline && session) {
      const timer = setTimeout(() => {
        processQueue();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mutationCount, unsyncedPhotosCount, isOnline, session, processQueue]);

  return {
    isOnline,
    isSyncing,
    processQueue,
    mutationCount,
    unsyncedPhotosCount
  };
}
