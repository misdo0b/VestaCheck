import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';

/**
 * GET /api/bootstrap
 * Renvoie les Biens, les Utilisateurs, les Inspections et les Locataires pour l'initialisation du cache local.
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;
  const orgId = currentUser.organizationId;

  try {
    const DATA_DIR = path.join(process.cwd(), 'data');
    
    // Lecture des fichiers JSON
    const [usersData, propertiesData, inspectionsData, tenantsData, templatesData, organizationsData, agenciesData] = await Promise.all([
      fs.readFile(path.join(DATA_DIR, 'users-db.json'), 'utf8'),
      fs.readFile(path.join(DATA_DIR, 'properties-db.json'), 'utf8'),
      fs.readFile(path.join(DATA_DIR, 'inspections-db.json'), 'utf8'),
      fs.readFile(path.join(DATA_DIR, 'tenants-db.json'), 'utf8').catch(() => '[]'),
      fs.readFile(path.join(DATA_DIR, 'templates-db.json'), 'utf8').catch(() => '[]'),
      fs.readFile(path.join(DATA_DIR, 'organizations-db.json'), 'utf8').catch(() => '[]'),
      fs.readFile(path.join(DATA_DIR, 'agencies-db.json'), 'utf8').catch(() => '[]')
    ]);

    const users = JSON.parse(usersData);
    const properties = JSON.parse(propertiesData);
    const inspections = JSON.parse(inspectionsData);
    const tenants = JSON.parse(tenantsData);
    const templates = JSON.parse(templatesData);
    const organizations = JSON.parse(organizationsData);
    const agencies = JSON.parse(agenciesData);

    // Filtrage strict par organizationId
    const filteredUsers = users.filter((u: any) => u.organizationId === orgId).map(({ password, ...u }: any) => u);
    const filteredProperties = properties.filter((p: any) => p.organizationId === orgId);
    const filteredInspections = inspections.filter((i: any) => i.organizationId === orgId);
    const filteredTenants = tenants.filter((t: any) => t.organizationId === orgId);
    const filteredTemplates = templates.filter((t: any) => t.organizationId === orgId);
    const filteredAgencies = agencies.filter((a: any) => a.organizationId === orgId);
    const filteredOrgs = organizations.filter((o: any) => o.id === orgId);

    console.log(`[Bootstrap] Filtering for Org: ${orgId}`);
    console.log(`[Bootstrap] Properties before: ${properties.length}, after: ${filteredProperties.length}`);
    console.log(`[Bootstrap] Users before: ${users.length}, after: ${filteredUsers.length}`);

    return NextResponse.json({
      properties: filteredProperties,
      templates: filteredTemplates,
      users: filteredUsers,
      inspections: filteredInspections,
      tenants: filteredTenants,
      organizations: filteredOrgs,
      agencies: filteredAgencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: 'Erreur lors du bootstrap des données réelles' }, { status: 500 });
  }
}
