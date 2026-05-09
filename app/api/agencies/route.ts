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
    const { data: agencies, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('organization_id', currentUser.organizationId);

    if (error) throw error;
    
    return NextResponse.json(snakeToCamel(agencies) || []);
  } catch (error) {
    console.error('Erreur lecture Supabase Agences:', error);
    return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const agencies = await request.json();
    const supabase = await getSupabase(true);
    
    const { error } = await supabase.from('agencies').upsert(camelToSnake(agencies));
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur écriture Supabase Agences:', error);
    return NextResponse.json({ error: 'Failed to sync agencies' }, { status: 500 });
  }
}
