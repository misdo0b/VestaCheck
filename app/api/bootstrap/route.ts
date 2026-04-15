import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/bootstrap
 * Renvoie les Biens, les Utilisateurs, les Inspections et les Locataires pour l'initialisation du cache local.
 */
export async function GET() {
  try {
    const DATA_DIR = path.join(process.cwd(), 'data');
    
    // Lecture des fichiers JSON (Base de données réelle)
    const [usersData, propertiesData, inspectionsData, tenantsData] = await Promise.all([
      fs.readFile(path.join(DATA_DIR, 'users-db.json'), 'utf8'),
      fs.readFile(path.join(DATA_DIR, 'properties-db.json'), 'utf8'),
      fs.readFile(path.join(DATA_DIR, 'inspections-db.json'), 'utf8'),
      fs.readFile(path.join(DATA_DIR, 'tenants-db.json'), 'utf8').catch(() => '[]') // Fallback si absent
    ]);

    const users = JSON.parse(usersData);
    const properties = JSON.parse(propertiesData);
    const inspections = JSON.parse(inspectionsData);
    const tenants = JSON.parse(tenantsData);

    // On retire les mots de passe pour la sécurité avant l'envoi au client
    const safeUsers = users.map(({ password, ...user }: any) => user);

    return NextResponse.json({
      properties: properties,
      users: safeUsers,
      inspections: inspections,
      tenants: tenants,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: 'Erreur lors du bootstrap des données réelles' }, { status: 500 });
  }
}
