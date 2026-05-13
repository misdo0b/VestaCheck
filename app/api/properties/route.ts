import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const agencyId = searchParams.get('agencyId');
  const currentUser = session.user as any;

  try {
    const supabase = await getSupabase(true);
    let query = supabase
      .from('properties')
      .select('*')
      .eq('organization_id', currentUser.organizationId);

    if (agencyId) {
      query = query.eq('agency_id', agencyId);
    } else if (currentUser.role !== 'Administrateur' && currentUser.agencyId) {
      // Les agents ne voient que les biens de leur agence
      query = query.eq('agency_id', currentUser.agencyId);
    }

    const { data: properties, error } = await query;

    if (error) throw error;

    const { snakeToCamel } = await import('@/lib/utils/mapping');
    return NextResponse.json(snakeToCamel(properties) || []);
  } catch (error) {
    console.error('API Properties Error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des biens' }, { status: 500 });
  }
}
