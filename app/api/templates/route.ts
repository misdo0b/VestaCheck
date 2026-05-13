import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { snakeToCamel } from '@/lib/utils/mapping';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');
  const user = session.user as any;
  const orgId = user.organizationId;

  try {
    const supabase = await getSupabase(true);
    let query = supabase
      .from('property_templates')
      .select('*')
      .eq('organization_id', orgId);

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json(snakeToCamel(data));
  } catch (error) {
    console.error('API Templates Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
