import { db } from '@/lib/db';
import { Tenant, InspectionReport } from '@/types';
import { useTenantStore } from '@/store/useTenantStore';

export const runTenantMigration = async () => {
  console.log('[Migration] Vérification de la nécessité d\'une migration des locataires...');
  
  const tenantCount = await db.tenants.count();
  if (tenantCount > 0) {
    console.log('[Migration] Migration déjà effectuée ou données présentes.');
    return;
  }

  const inspections = await db.inspections.toArray();
  if (inspections.length === 0) {
    console.log('[Migration] Aucune inspection trouvée pour la migration.');
    return;
  }

  console.log(`[Migration] Début de la migration depuis ${inspections.length} inspections...`);

  // Map pour stocker les locataires uniques par email
  const tenantMap = new Map<string, Tenant>();

  for (const inspection of inspections) {
    // Note: On cast en "any" car le type InspectionReport a changé 
    // mais les données locales sont encore à l'ancien format
    const oldInspection = inspection as any;
    
    // Si l'inspection a déjà un tenantId (nouveau format), on ignore
    if (oldInspection.tenantId) continue;

    const name = oldInspection.tenantName;
    const email = oldInspection.tenantEmail;
    const phone = oldInspection.tenantPhone || '';
    const propertyId = oldInspection.propertyId;

    if (!name || !email) continue;

    const key = email.toLowerCase();
    
    if (tenantMap.has(key)) {
      // Le locataire existe déjà, on ajoute la nouvelle propriété à sa liste
      const existing = tenantMap.get(key)!;
      if (!existing.propertyIds.includes(propertyId)) {
        existing.propertyIds.push(propertyId);
      }
    } else {
      // Nouveau locataire
      tenantMap.set(key, {
        id: `tenant_${crypto.randomUUID().slice(0, 8)}`,
        name,
        email: key,
        phone,
        status: 'Actuel',
        propertyIds: [propertyId],
        serverVersion: 1,
        lastModified: new Date().toISOString(),
        syncStatus: 'synced' // On considère que les données historiques sont synchro
      });
    }
  }

  const newTenants = Array.from(tenantMap.values());
  
  if (newTenants.length > 0) {
    console.log(`[Migration] ${newTenants.length} locataires uniques identifiés.`);
    
    // 1. Ajouter les locataires à la DB
    await db.tenants.bulkAdd(newTenants);

    // 2. Mettre à jour les inspections pour pointer vers les nouveaux IDs
    for (const inspection of inspections) {
      const oldInspection = inspection as any;
      if (oldInspection.tenantId) continue;

      const email = oldInspection.tenantEmail?.toLowerCase();
      const tenant = newTenants.find(t => t.email === email);
      
      if (tenant) {
        await db.inspections.update(inspection.id, {
          tenantId: tenant.id,
          // On garde les anciens champs pour le moment pour éviter les crashs UI 
          // avant que tous les composants soient mis à jour
        } as any);
      }
    }

    // 3. Charger le store
    useTenantStore.getState().setTenants(newTenants);
    console.log('[Migration] Migration terminée avec succès.');
  } else {
    console.log('[Migration] Aucun locataire valide à migrer.');
  }
};
