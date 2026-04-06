import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'users-db.json');

// GET: Récupère tous les utilisateurs depuis le fichier JSON
export async function GET() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const users = JSON.parse(data);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erreur lecture DB:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Met à jour intégralement le fichier JSON (synchronisation depuis le store)
export async function POST(request: Request) {
  try {
    const users = await request.json();
    
    // Pour cet environnement de dev, nous persistons tout le tableau envoyé par le store
    await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur écriture DB:', error);
    return NextResponse.json({ error: 'Failed to sync users' }, { status: 500 });
  }
}
