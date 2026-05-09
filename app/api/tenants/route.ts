import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;

  try {
    const supabase = await getSupabase(true);
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('organization_id', currentUser.organizationId);

    if (error) throw error;

    const { snakeToCamel } = await import('@/lib/utils/mapping');
    return NextResponse.json({ tenants: snakeToCamel(tenants) || [] });
  } catch (error) {
    console.error('API Tenants Error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des locataires' }, { status: 500 });
  }
}
