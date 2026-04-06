import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useInspectionStore } from '@/store/useInspectionStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';

/**
 * useSync - Hook de gestion de la synchronisation en arrière-plan
 * Surveille la file d'attente des mutations et tente de les pousser dès que possible.
 */
export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Pour rafraîchir les stores après synchro
  const { initStore: initInspections } = useInspectionStore();
  const { initStore: initProperties } = usePropertyStore();
  const { initStore: initUsers } = useUserStore();

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

  const processQueue = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    const mutations = await db.mutationQueue.orderBy('timestamp').toArray();
    if (mutations.length === 0) return;

    setIsSyncing(true);
    console.log(`Synchronisation de ${mutations.length} changement(s)...`);

    try {
      // On regroupe les mutations par lot pour l'API /api/inspections/sync
      const response = await fetch('/api/inspections/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations })
      });

      if (response.ok) {
        // Succès : on vide la file locale et on met à jour les états
        const mutationIds = mutations.map(m => m.id!);
        await db.mutationQueue.bulkDelete(mutationIds);
        
        // On marque les entités comme synchronisées localement
        // (En production, on utiliserait le server_version renvoyé par l'API)
        
        await Promise.all([
          initInspections(),
          initProperties(),
          initUsers()
        ]);

        toast.success("Synchronisation terminée avec succès");
      } else {
        throw new Error("Erreur serveur lors de la synchronisation");
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error("Échec de la synchronisation automatique");
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, initInspections, initProperties, initUsers]);

  // Vérification périodique ou déclenchée par le retour du réseau
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    isOnline,
    isSyncing,
    processQueue
  };
}
