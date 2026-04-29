import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'tenants-db.json');

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;

  try {
    const data = await fs.readFile(FILE_PATH, 'utf8').catch(() => '[]');
    const tenants = JSON.parse(data);

    // Segmentation : filtrer par organizationId
    const filteredTenants = tenants.filter((t: any) => t.organizationId === currentUser.organizationId);

    return NextResponse.json({ tenants: filteredTenants });
  } catch (error) {
    console.error('API Tenants Error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des locataires' }, { status: 500 });
  }
}
