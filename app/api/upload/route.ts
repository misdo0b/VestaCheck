import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  const session = await auth();

  // 1. Vérification de l'authentification
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Génération d'un nom de fichier unique
    const fileExtension = path.extname(file.name) || '.jpg';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${uniqueId}${fileExtension}`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, fileName);

    // 3. Écriture physique sur le disque
    await writeFile(filePath, buffer);
    
    // 4. Retour de l'URL publique
    const publicUrl = `/uploads/${fileName}`;

    console.log(`[Upload] Fichier sauvegardé : ${publicUrl}`);

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json({ error: 'Échec de l\'upload' }, { status: 500 });
  }
}
