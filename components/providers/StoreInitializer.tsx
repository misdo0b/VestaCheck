'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { db } from '@/lib/db';

export function StoreInitializer() {
  const initUsers = useUserStore((state) => state.initStore);
  const initProperties = usePropertyStore((state) => state.initStore);
  const initInspections = useInspectionStore((state) => state.initStore);

  useEffect(() => {
    async function performInitialization() {
      // 1. Initialiser les stores depuis le stockage local (Dexie)
      await Promise.all([
        initUsers(),
        initProperties(),
        initInspections()
      ]);

      // 2. Vérifier si on a des données. Si le cache est vide, on fait un bootstrap
      const propertyCount = await db.properties.count();
      if (propertyCount === 0) {
        console.log("Premier lancement ou cache vide : Bootstrap des données...");
        try {
          const res = await fetch('/api/bootstrap');
          if (res.ok) {
            const { properties, users } = await res.json();
            
            // On écrit en masse dans Dexie
            await db.transaction('rw', db.properties, db.users, async () => {
              await db.properties.bulkPut(properties);
              await db.users.bulkPut(users);
            });

            // On rafraîchit les stores
            initUsers();
            initProperties();
          }
        } catch (err) {
          console.error('Bootstrap failed:', err);
        }
      }
    }

    performInitialization();
  }, [initUsers, initProperties, initInspections]);

  return null; // Composant invisible
}
