import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/utils/password';
import { getSupabase } from '@/lib/supabase';
import { camelToSnake } from '@/lib/utils/mapping';
import { registerSchema } from '@/lib/validations/auth';
import { verifyTurnstileToken } from '@/lib/utils/security';
import { sendWelcomeEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validation Honeypot & Turnstile côté serveur
    const validatedData = registerSchema.parse(body);

    if (validatedData.fax_number) {
      return NextResponse.json({ error: 'Échec de la validation de sécurité.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || '';
    const isHuman = await verifyTurnstileToken(validatedData.turnstileToken, ip);

    if (!isHuman) {
      return NextResponse.json({ error: 'Échec de la validation de sécurité (Captcha).' }, { status: 400 });
    }

    const supabase = await getSupabase(true);

    // 2. Vérification si l'utilisateur existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.admin.email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà.' }, { status: 400 });
    }

    // 3. Création de l'Organisation
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert(camelToSnake({
        raisonSociale: validatedData.organization.raisonSociale,
        siret: validatedData.organization.siret,
        adressePostale: validatedData.organization.adressePostale,
        serverVersion: 1,
        lastModified: new Date().toISOString()
      }))
      .select()
      .single();

    if (orgError) throw orgError;

    // 4. Création de l'Agence
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .insert(camelToSnake({
        organizationId: org.id,
        name: validatedData.agency.name,
        address: validatedData.agency.address,
        phone: validatedData.agency.phone,
        type: 'Siège',
        serverVersion: 1,
        lastModified: new Date().toISOString()
      }))
      .select()
      .single();

    if (agencyError) throw agencyError;

    // 5. Création de l'Utilisateur Admin
    const hashedPassword = await hashPassword(validatedData.admin.password);
    const { error: userError } = await supabase
      .from('users')
      .insert(camelToSnake({
        name: `${validatedData.admin.firstName} ${validatedData.admin.lastName}`,
        email: validatedData.admin.email.toLowerCase(),
        password: hashedPassword,
        role: 'Administrateur',
        organizationId: org.id,
        agencyId: agency.id,
        serverVersion: 1,
        lastModified: new Date().toISOString(),
        syncStatus: 'synced'
      }));

    if (userError) throw userError;

    // 6. Envoi asynchrone non-bloquant du mail de bienvenue
    const welcomeName = `${validatedData.admin.firstName} ${validatedData.admin.lastName}`;
    const welcomeEmailAddress = validatedData.admin.email.toLowerCase();
    const agencyName = validatedData.agency.name;
    
    sendWelcomeEmail(welcomeEmailAddress, welcomeName, agencyName).catch((err) => {
      console.error("[Mail] Échec d'envoi du mail de bienvenue lors de l'inscription:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Une erreur est survenue lors de l\'inscription.' }, { status: 500 });
  }
}
