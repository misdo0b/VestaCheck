import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/bootstrap
 * Renvoie les Biens, les Utilisateurs, les Inspections et les Locataires depuis Supabase.
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;
  const orgId = currentUser.organizationId;

  try {
    const supabase = await getSupabase(true); // Utilisation du service_role pour le bootstrap complet

    // Récupération parallèle de toutes les entités
    const [
      { data: users },
      { data: properties },
      { data: tenants },
      { data: templates },
      { data: organizations },
      { data: agencies },
      { data: inspections }
    ] = await Promise.all([
      supabase.from('users').select('*').eq('organization_id', orgId),
      supabase.from('properties').select('*').eq('organization_id', orgId),
      supabase.from('tenants').select('*, property_tenants(property_id)').eq('organization_id', orgId),
      supabase.from('property_templates').select('*').eq('organization_id', orgId),
      supabase.from('organizations').select('*').eq('id', orgId),
      supabase.from('agencies').select('*').eq('organization_id', orgId),
      // Pour les inspections, on récupère la structure imbriquée normalisée
      supabase.from('inspections')
        .select(`
          *,
          rooms (
            *,
            inspection_items (
              *,
              photos (*)
            )
          )
        `)
        .eq('organization_id', orgId)
    ]);

    // Formatage des données pour correspondre aux types attendus par le client (camelCase vs snake_case)
    // Note: Idéalement, on utiliserait un mapper, mais ici on va garder la structure plate si possible
    // ou s'assurer que les champs correspondent.

    console.log(`[Bootstrap] Fetched data for Org: ${orgId}`);

    const { snakeToCamel } = await import('@/lib/utils/mapping');

    return NextResponse.json({
      properties: snakeToCamel(properties) || [],
      templates: snakeToCamel(templates) || [],
      users: (snakeToCamel(users) || []).map(({ password, ...u }: any) => u),
      inspections: snakeToCamel(inspections) || [],
      tenants: (tenants || []).map((t: any) => ({
        ...snakeToCamel(t),
        propertyIds: t.property_tenants?.map((rel: any) => rel.property_id) || []
      })),
      organizations: snakeToCamel(organizations) || [],
      agencies: snakeToCamel(agencies) || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: 'Erreur lors du bootstrap des données Supabase' }, { status: 500 });
  }
}
