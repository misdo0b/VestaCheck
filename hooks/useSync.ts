import { useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useInspectionStore } from '@/store/useInspectionStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { useTenantStore } from '@/store/useTenantStore';

/**
 * useSync - Hook de gestion de la synchronisation en arrière-plan
 * Surveille la file d'attente des mutations et tente de les pousser dès que possible.
 */
export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Observer la file d'attente des mutations
  const mutationCount = useLiveQuery(() => db.mutationQueue.count()) || 0;

  // Pour rafraîchir les stores après synchro
  const { initStore: initInspections } = useInspectionStore();
  const { initStore: initProperties } = usePropertyStore();
  const { initStore: initUsers } = useUserStore();
  const { initStore: initTenants } = useTenantStore();

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
    // Éviter les doubles lancements ou la synchro hors-ligne
    if (isSyncing || !isOnline) return;

    const mutations = await db.mutationQueue.orderBy('timestamp').toArray();
    if (mutations.length === 0) return;

    setIsSyncing(true);
    console.log(`[Sync] Traitement de ${mutations.length} changement(s) en attente...`);

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
        
        // Rafraîchir les stores pour obtenir les IDs réels et les versions serveurs
        await Promise.all([
          initInspections(),
          initProperties(),
          initUsers(),
          initTenants()
        ]);

        toast.success("Synchronisation terminée avec succès");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur serveur lors de la synchronisation");
      }
    } catch (err: any) {
      console.error('[Sync] Error:', err);
      toast.error(`Échec de la synchronisation : ${err.message || 'Erreur inconnue'}`);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, initInspections, initProperties, initUsers]);

  // Synchronisation réactive : déclenchée dès que mutationCount > 0
  useEffect(() => {
    if (mutationCount > 0 && isOnline) {
      // On ajoute un petit délai pour regrouper les mutations si plusieurs arrivent vite
      const timer = setTimeout(() => {
        processQueue();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mutationCount, isOnline, processQueue]);

  return {
    isOnline,
    isSyncing,
    processQueue,
    mutationCount
  };
}
