import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readDb(filename: string) {
  const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
  return JSON.parse(data);
}

async function writeDb(filename: string, data: any) {
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

/**
 * POST /api/inspections/sync
 * Endpoint de synchronisation atomique pour les changements hors-ligne.
 * Applique les mutations sur les fichiers JSON du serveur.
 */
export async function POST(req: Request) {
  try {
    const { mutations } = await req.json();

    if (!Array.isArray(mutations)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }

    // Chargement des "tables"
    const users = await readDb('users-db.json');
    const properties = await readDb('properties-db.json');
    const inspections = await readDb('inspections-db.json');

    const dbMap: Record<string, any[]> = {
      'user': users,
      'property': properties,
      'inspection': inspections
    };

    const fileMap: Record<string, string> = {
      'user': 'users-db.json',
      'property': 'properties-db.json',
      'inspection': 'inspections-db.json'
    };

    const affectedFiles = new Set<string>();

    for (const mutation of mutations) {
      const { type, entity, entityId, data } = mutation;
      const table = dbMap[entity];
      
      if (!table) continue;

      affectedFiles.add(entity);

      if (type === 'CREATE') {
        // Ajouter si n'existe pas déjà
        if (!table.find((item: any) => item.id === entityId)) {
          table.push({ ...data, id: entityId, serverVersion: 1, lastModified: new Date().toISOString() });
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
        }
      } else if (type === 'DELETE') {
        dbMap[entity] = table.filter((item: any) => item.id !== entityId);
      }
    }

    // Sauvegarde des fichiers modifiés
    for (const entity of affectedFiles) {
      await writeDb(fileMap[entity], dbMap[entity]);
    }

    return NextResponse.json({ 
      success: true, 
      processed: mutations.length,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Server sync error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la synchronisation sur le serveur' }, 
      { status: 500 }
    );
  }
}
