import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'organizations-db.json');

export async function GET() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const organizations = JSON.parse(data);
    return NextResponse.json(organizations);
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
