import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';

const DB_PATH = path.join(process.cwd(), 'data', 'agencies-db.json');

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;

  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const agencies = JSON.parse(data);
    
    // Segmentation : filtrer par organizationId
    const filteredAgencies = agencies.filter((a: any) => a.organizationId === currentUser.organizationId);
    
    return NextResponse.json(filteredAgencies);
  } catch (error) {
    console.error('Erreur lecture DB Agences:', error);
    return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const agencies = await request.json();
    await fs.writeFile(DB_PATH, JSON.stringify(agencies, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur écriture DB Agences:', error);
    return NextResponse.json({ error: 'Failed to sync agencies' }, { status: 500 });
  }
}
