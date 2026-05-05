import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/utils/password';
import { snakeToCamel, camelToSnake } from '@/lib/utils/mapping';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const currentUser = session.user as any;

  try {
    const supabase = await getSupabase(true);
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', currentUser.organizationId);

    if (error) throw error;
    
    return NextResponse.json(snakeToCamel(users) || []);
  } catch (error) {
    console.error('Erreur lecture Supabase Users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const users = await request.json();
    const supabase = await getSupabase(true);

    const hashedUsers = await Promise.all(users.map(async (u: any) => {
      let userData = { ...u };
      if (u.password && !u.password.startsWith('$2a$')) {
        userData.password = await hashPassword(u.password);
      }
      return userData;
    }));
    
    const { error } = await supabase.from('users').upsert(camelToSnake(hashedUsers));
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur écriture Supabase Users:', error);
    return NextResponse.json({ error: 'Failed to sync users' }, { status: 500 });
  }
}
