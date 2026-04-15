import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'tenants-db.json');

export async function GET() {
  try {
    const data = await fs.readFile(FILE_PATH, 'utf8').catch(() => '[]');
    const tenants = JSON.parse(data);

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('API Tenants Error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des locataires' }, { status: 500 });
  }
}
