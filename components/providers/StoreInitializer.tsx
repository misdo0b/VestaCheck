'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/useUserStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTenantStore } from '@/store/useTenantStore';
import { useOrganizationStore } from '@/store/useOrganizationStore';
import { useAgencyStore } from '@/store/useAgencyStore';
import { runTenantMigration } from '@/lib/utils/TenantMigration';
import { db } from '@/lib/db';

export function StoreInitializer() {
  const { data: session } = useSession();
  
  const initUsers = useUserStore((state) => state.initStore);
  const initProperties = usePropertyStore((state) => state.initStore);
  const initInspections = useInspectionStore((state) => state.initStore);
  const initTenants = useTenantStore((state) => state.initStore);
  const initOrganizations = useOrganizationStore((state) => state.initStore);
  const initAgencies = useAgencyStore((state) => state.initStore);

  useEffect(() => {
    async function performInitialization() {
      if (!session?.user) return;
      const user = session.user as any;

      // 1. Initialiser les stores depuis le stockage local (Dexie)
      await Promise.all([
        initUsers(user),
        initProperties(user),
        initInspections(user),
        initTenants(user),
        initOrganizations(user),
        initAgencies(user)
      ]);

      // 1.5 Lancer la migration des locataires si nécessaire
      await runTenantMigration();

      // 2. Synchronisation descendante : Toujours récupérer les derniers utilisateurs, organisations et agences du serveur
      const fetchUsers = useUserStore.getState().fetchUsers;
      const fetchOrganizations = useOrganizationStore.getState().fetchOrganizations;
      const fetchAgencies = useAgencyStore.getState().fetchAgencies;
      
      await Promise.all([
        fetchUsers(),
        fetchOrganizations(),
        fetchAgencies()
      ]);

      // 3. Vérifier si on a des données. Si le cache est vide ou incomplet (migration), on fait un bootstrap complet.
      const firstProperty = await db.properties.toCollection().first();
      const propertyCount = await db.properties.count();
      
      const isLegacyData = propertyCount > 0 && !(firstProperty as any)?.organizationId;

      if (propertyCount === 0 || isLegacyData) {
        console.log(`[StoreInitializer] ${isLegacyData ? 'Données obsolètes détectées' : 'Cache vide'} : Bootstrap complet des données...`);
        try {
          const res = await fetch('/api/bootstrap');
          if (res.ok) {
            const { properties, users, inspections, tenants, templates, organizations, agencies } = await res.json();
            
            // On écrit en masse dans Dexie (transaction sécurisée)
            await db.transaction('rw', [db.properties, db.users, db.inspections, db.tenants, db.templates, db.organizations, db.agencies], async () => {
              // Si données obsolètes, on nettoie d'abord
              if (isLegacyData) {
                await Promise.all([
                  db.properties.clear(),
                  db.users.clear(),
                  db.inspections.clear(),
                  db.tenants.clear(),
                  db.templates.clear(),
                  db.organizations.clear(),
                  db.agencies.clear()
                ]);
              }

              if (properties?.length > 0) await db.properties.bulkPut(properties);
              if (users?.length > 0) await db.users.bulkPut(users);
              if (inspections?.length > 0) await db.inspections.bulkPut(inspections);
              if (tenants?.length > 0) await db.tenants.bulkPut(tenants);
              if (templates?.length > 0) await db.templates.bulkPut(templates);
              if (organizations?.length > 0) await db.organizations.bulkPut(organizations);
              if (agencies?.length > 0) await db.agencies.bulkPut(agencies);
            });

            console.log("[StoreInitializer] Bootstrap terminé. Rafraîchissement des stores locaux...");

            // On rafraîchit les stores après l'écriture en masse
            initUsers(user);
            initProperties(user);
            initInspections(user);
            initTenants(user);
            initOrganizations(user);
            initAgencies(user);
          }
        } catch (err) {
          console.error('[StoreInitializer] Bootstrap failed:', err);
        }
      }
    }

    performInitialization();
  }, [session, initUsers, initProperties, initInspections, initTenants, initOrganizations, initAgencies]);

  return null;
}
