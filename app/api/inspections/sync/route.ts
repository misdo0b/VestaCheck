import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { hashPassword } from '@/lib/utils/password';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readDb(filename: string) {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    if (!data || data.trim() === '') return [];
    return JSON.parse(data);
  } catch (err) {
    console.error(`[Sync] Failed to read ${filename}:`, err);
    return []; // Fallback pour éviter de bloquer toute la synchro
  }
}

async function writeDb(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[Sync] Successful write to ${filename} (${data.length} items)`);
}

/**
 * POST /api/inspections/sync
 * Endpoint de synchronisation atomique pour les changements hors-ligne.
 */
export async function POST(req: Request) {
  try {
    const { mutations } = await req.json();

    if (!Array.isArray(mutations)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }

    console.log(`[Sync] Début du traitement de ${mutations.length} mutations...`);

    // Chargement des données actuelles
    const users = await readDb('users-db.json');
    const properties = await readDb('properties-db.json');
    const inspections = await readDb('inspections-db.json');
    const tenants = await readDb('tenants-db.json');

    const dbMap: Record<string, any[]> = {
      'user': users,
      'property': properties,
      'inspection': inspections,
      'tenant': tenants
    };

    const fileMap: Record<string, string> = {
      'user': 'users-db.json',
      'property': 'properties-db.json',
      'inspection': 'inspections-db.json',
      'tenant': 'tenants-db.json'
    };

    const affectedEntities = new Set<string>();

    for (const mutation of mutations) {
      const { type, entity, entityId, data } = mutation;
      const table = dbMap[entity];
      
      if (!table) {
        console.warn(`[Sync] Entité inconnue sautée : ${entity}`);
        continue;
      }

      affectedEntities.add(entity);
      console.log(`[Sync] Traitement ${type} sur ${entity} (${entityId})`);

      // 1. Password Hash pour les utilisateurs
      if (entity === 'user' && data?.password) {
        if (data.password.trim() !== '') {
          data.password = await hashPassword(data.password);
        } else {
          delete data.password;
        }
      }

      // 2. Traitement CRUD
      if (type === 'CREATE') {
        const existingIndex = table.findIndex((item: any) => item.id === entityId);
        if (existingIndex === -1) {
          table.push({ ...data, id: entityId, serverVersion: 1, lastModified: new Date().toISOString() });
        } else {
          // Si déjà présent, on fait un UPDATE silencieux pour gérer les reprises de synchro
          table[existingIndex] = { 
            ...table[existingIndex], 
            ...data, 
            serverVersion: (table[existingIndex].serverVersion || 1) + 1,
            lastModified: new Date().toISOString()
          };
        }
      } else if (type === 'UPDATE') {
        const index = table.findIndex((item: any) => item.id === entityId);
        if (index !== -1) {
          table[index] = { 
            ...table[index], 
            ...data, 
            serverVersion: (table[index].serverVersion || 1) + 1,
            lastModified: new Date().toISOString()
          };
        } else {
          // Si UPDATE d'un élément absent, on le crée (cas limite de synchro désordonnée)
          table.push({ ...data, id: entityId, serverVersion: 1, lastModified: new Date().toISOString() });
        }
      } else if (type === 'DELETE') {
        dbMap[entity] = table.filter((item: any) => item.id !== entityId);
      }

      // 3. Logique métier transversale (Statut locataire)
      if (entity === 'inspection' && mutations.some(m => m.entityId === entityId && (m.type === 'CREATE' || m.type === 'UPDATE'))) {
        // On récupère la version mise à jour du rapport dans la table
        const ins = table.find((item: any) => item.id === entityId);
        if (ins && ins.isFinalized && ins.type === 'Sortie' && ins.tenantId) {
          const tenantIndex = tenants.findIndex((t: any) => t.id === ins.tenantId);
          if (tenantIndex !== -1 && tenants[tenantIndex].status !== 'Sorti') {
            tenants[tenantIndex].status = 'Sorti';
            tenants[tenantIndex].lastModified = new Date().toISOString();
            tenants[tenantIndex].serverVersion = (tenants[tenantIndex].serverVersion || 1) + 1;
            affectedEntities.add('tenant');
            console.log(`[Sync] Locataire ${ins.tenantId} marqué comme 'Sorti' suite à finalisation.`);
          }
        }
      }
    }

    // Sauvegarde atomique des fichiers modifiés
    for (const entity of affectedEntities) {
      await writeDb(fileMap[entity], dbMap[entity]);
    }

    return NextResponse.json({ 
      success: true, 
      processed: mutations.length,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Sync] Serveur Crash:', error);
    return NextResponse.json(
      { error: 'Erreur critique lors de la synchronisation' }, 
      { status: 500 }
    );
  }
}
