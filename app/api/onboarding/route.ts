import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { camelToSnake } from '@/lib/utils/mapping';
import { step1Schema, step2Schema } from '@/lib/validations/auth';
import { sendWelcomeEmail } from '@/lib/mail';
import { z } from 'zod';

const onboardingApiSchema = z.object({
  organization: step1Schema,
  agency: step2Schema,
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = onboardingApiSchema.parse(body);

    const supabase = await getSupabase(true);

    // 1. Récupérer l'utilisateur courant par email
    const { data: dbUser, error: userFetchError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', session.user.email.toLowerCase())
      .single();

    if (userFetchError || !dbUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // 2. Création de l'Organisation
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert(camelToSnake({
        raisonSociale: validatedData.organization.raisonSociale,
        siret: validatedData.organization.siret,
        adressePostale: validatedData.organization.adressePostale,
        serverVersion: 1,
        lastModified: new Date().toISOString(),
        syncStatus: 'synced'
      }))
      .select()
      .single();

    if (orgError) {
      console.error("Onboarding Org Error:", orgError);
      throw new Error("Erreur lors de la création de l'organisation");
    }

    // 3. Création de l'Agence
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .insert(camelToSnake({
        organizationId: org.id,
        name: validatedData.agency.agencyName,
        address: validatedData.agency.agencyAddress,
        phone: validatedData.agency.agencyPhone,
        type: 'Siège',
        serverVersion: 1,
        lastModified: new Date().toISOString(),
        syncStatus: 'synced'
      }))
      .select()
      .single();

    if (agencyError) {
      console.error("Onboarding Agency Error:", agencyError);
      throw new Error("Erreur lors de la création de l'agence");
    }

    // 4. Mise à jour de l'utilisateur avec son Organisation et son Agence
    const { error: updateError } = await supabase
      .from('users')
      .update(camelToSnake({
        organizationId: org.id,
        agencyId: agency.id,
        role: 'Administrateur',
        lastModified: new Date().toISOString(),
        syncStatus: 'synced'
      }))
      .eq('id', dbUser.id);

    if (updateError) {
      console.error("Onboarding User Update Error:", updateError);
      throw new Error("Erreur lors du rattachement de l'utilisateur");
    }

    // 5. Envoi asynchrone non-bloquant du mail de bienvenue
    const welcomeName = dbUser.name || session.user.email.split('@')[0];
    sendWelcomeEmail(session.user.email, welcomeName, validatedData.agency.agencyName).catch((err) => {
      console.error("[Mail] Échec d'envoi du mail de bienvenue SSO:", err);
    });

    return NextResponse.json({ success: true, organizationId: org.id, agencyId: agency.id });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 });
    }
    console.error('Onboarding API Error:', error);
    return NextResponse.json({ error: error.message || 'Une erreur est survenue lors de l\'onboarding.' }, { status: 500 });
  }
}
