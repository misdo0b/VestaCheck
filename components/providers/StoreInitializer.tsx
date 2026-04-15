'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTenantStore } from '@/store/useTenantStore';
import { runTenantMigration } from '@/lib/utils/TenantMigration';
import { db } from '@/lib/db';

export function StoreInitializer() {
  const initUsers = useUserStore((state) => state.initStore);
  const initProperties = usePropertyStore((state) => state.initStore);
  const initInspections = useInspectionStore((state) => state.initStore);
  const initTenants = useTenantStore((state) => state.initStore);

  useEffect(() => {
    async function performInitialization() {
      // 1. Initialiser les stores depuis le stockage local (Dexie)
      const initUsers = useUserStore.getState().initStore;
      const initProperties = usePropertyStore.getState().initStore;
      const initInspections = useInspectionStore.getState().initStore;
      const initTenants = useTenantStore.getState().initStore;

      await Promise.all([
        initUsers(),
        initProperties(),
        initInspections(),
        initTenants()
      ]);

      // 1.5 Lancer la migration des locataires si nécessaire
      await runTenantMigration();

      // 2. Synchronisation descendante : Toujours récupérer les derniers utilisateurs du serveur
      // Cela permet de voir les utilisateurs ajoutés par d'autres (ex: Amélie)
      const fetchUsers = useUserStore.getState().fetchUsers;
      await fetchUsers();

      // 3. Vérifier si on a des données. Si le cache est vide, on fait un bootstrap complet.
      const propertyCount = await db.properties.count();
      if (propertyCount === 0) {
        console.log("[StoreInitializer] Premier lancement ou cache vide : Bootstrap complet des données...");
        try {
          const res = await fetch('/api/bootstrap');
          if (res.ok) {
            const { properties, users, inspections, tenants } = await res.json();
            
            // On écrit en masse dans Dexie (transaction sécurisée)
            await db.transaction('rw', [db.properties, db.users, db.inspections, db.tenants], async () => {
              if (properties?.length > 0) await db.properties.bulkPut(properties);
              if (users?.length > 0) await db.users.bulkPut(users);
              if (inspections?.length > 0) await db.inspections.bulkPut(inspections);
              if (tenants?.length > 0) await db.tenants.bulkPut(tenants);
            });

            console.log("[StoreInitializer] Bootstrap terminé. Rafraîchissement des stores locaux...");

            // On rafraîchit les stores après l'écriture en masse
            initUsers();
            initProperties();
            initInspections();
            initTenants();
          }
        } catch (err) {
          console.error('[StoreInitializer] Bootstrap failed:', err);
        }
      }
    }

    performInitialization();
  }, [initUsers, initProperties, initInspections, initTenants]);

  return null;
}
