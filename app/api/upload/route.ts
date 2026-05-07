import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import path from 'path';

export async function POST(req: Request) {
  const session = await auth();

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

    const fileExtension = path.extname(file.name) || '.jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
    
    const supabase = await getSupabase(true); // Service role pour l'écriture dans le storage

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('vestacheck-media')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('[Upload] Supabase Storage Error:', error);
      throw error;
    }

    // Récupération de l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('vestacheck-media')
      .getPublicUrl(fileName);

    console.log(`[Upload] Fichier sauvegardé sur Supabase : ${publicUrl}`);

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json({ error: 'Échec de l\'upload vers le cloud' }, { status: 500 });
  }
}
