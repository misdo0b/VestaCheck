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
    // On récupère les locataires avec leurs relations de propriétés
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select(`
        *,
        property_tenants (
          property_id
        )
      `)
      .eq('organization_id', currentUser.organizationId);

    if (error) throw error;

    const { snakeToCamel } = await import('@/lib/utils/mapping');
    const mappedTenants = (tenants || []).map((tenant: any) => {
      const camelTenant = snakeToCamel(tenant);
      // Transformation des relations en tableau d'IDs simple
      return {
        ...camelTenant,
        propertyIds: tenant.property_tenants?.map((rel: any) => rel.property_id) || []
      };
    });

    return NextResponse.json({ tenants: mappedTenants });
  } catch (error) {
    console.error('API Tenants Error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des locataires' }, { status: 500 });
  }
}
