import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { snakeToCamel, camelToSnake } from '@/lib/utils/mapping';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;

  try {
    const supabase = await getSupabase(true);
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', currentUser.organizationId);

    if (error) throw error;
    
    return NextResponse.json(snakeToCamel(organizations) || []);
  } catch (error) {
    console.error('Erreur lecture Supabase Organisations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organizations = await request.json();
    const supabase = await getSupabase(true);
    
    const { error } = await supabase.from('organizations').upsert(camelToSnake(organizations));
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur écriture Supabase Organisations:', error);
    return NextResponse.json({ error: 'Failed to sync organizations' }, { status: 500 });
  }
}
