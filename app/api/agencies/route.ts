import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'agencies-db.json');

export async function GET() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const agencies = JSON.parse(data);
    return NextResponse.json(agencies);
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
