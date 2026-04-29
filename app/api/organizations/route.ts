import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';

const DB_PATH = path.join(process.cwd(), 'data', 'organizations-db.json');

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;

  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const organizations = JSON.parse(data);
    
    // Segmentation : filtrer pour ne renvoyer que son organisation
    const filteredOrganizations = organizations.filter((o: any) => o.id === currentUser.organizationId);
    
    return NextResponse.json(filteredOrganizations);
  } catch (error) {
    console.error('Erreur lecture DB Organisations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organizations = await request.json();
    await fs.writeFile(DB_PATH, JSON.stringify(organizations, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur écriture DB Organisations:', error);
    return NextResponse.json({ error: 'Failed to sync organizations' }, { status: 500 });
  }
}
