import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { FinalizeParamsSchema, FinalizeBodySchema } from '@/lib/validations/email';
import { sendInspectionCompletedEmails } from '@/lib/mail';

/**
 * POST /api/inspections/[id]/finalize
 * Finalise un état des lieux, le verrouille en base de données, 
 * et envoie automatiquement les rapports officiels par e-mail.
 * 
 * Sécurisé multi-tenant, validé par Zod, et entièrement typé.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authentification & Sécurité - Vérification de la session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé. Authentification requise.' }, { status: 401 });
  }

  const currentUser = session.user as any;

  try {
    // 2. Validation Zod des paramètres d'URL (Next.js 15 nécessite d'attendre params)
    const { id } = await params;
    const validatedParams = FinalizeParamsSchema.safeParse({ id });
    if (!validatedParams.success) {
      return NextResponse.json({
        error: 'Identifiant invalide',
        details: validatedParams.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const inspectionId = validatedParams.data.id;

    // 3. Validation Zod du corps de la requête JSON (si présent)
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Le corps de la requête est optionnel
    }

    const validatedBody = FinalizeBodySchema.safeParse(body);
    if (!validatedBody.success) {
      return NextResponse.json({
        error: 'Payload invalide',
        details: validatedBody.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { signatureDate, notifyTenant, generalObservations } = validatedBody.data;

    // 4. Initialisation du client de base de données (Supabase bypass RLS pour contrôle d'accès programmatique fin)
    const supabase = await getSupabase(true);

    // 5. Récupération de l'état des lieux pour vérification de sécurité
    const { data: inspection, error: fetchError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (fetchError || !inspection) {
      console.error(`[Finalize] État des lieux ${inspectionId} introuvable:`, fetchError);
      return NextResponse.json({ error: 'État des lieux introuvable.' }, { status: 404 });
    }

    // 6. RÈGLE STRICTE DE SÉCURITÉ : ISOLATION MULTI-TENANT
    // L'état des lieux doit obligatoirement appartenir au même Tenant (Organisation) que l'utilisateur en session
    if (inspection.organization_id !== currentUser.organizationId) {
      console.warn(`[Alerte Sécurité] Tentative d'accès transverse par l'utilisateur ${currentUser.id} de l'organisation ${currentUser.organizationId} sur l'inspection ${inspectionId} appartenant à l'organisation ${inspection.organization_id}`);
      return NextResponse.json({ error: 'Accès interdit. Ressource hors périmètre.' }, { status: 403 });
    }

    // Si l'utilisateur est un simple Agent, il est également restreint à son Agence d'appartenance
    if (currentUser.role === 'Agent' && inspection.agency_id !== currentUser.agencyId) {
      console.warn(`[Alerte Sécurité] L'Agent ${currentUser.id} rattaché à l'agence ${currentUser.agencyId} a tenté d'accéder à l'inspection ${inspectionId} rattachée à l'agence ${inspection.agency_id}`);
      return NextResponse.json({ error: 'Accès interdit. Votre compte est restreint à son agence.' }, { status: 403 });
    }

    // 7. Enregistrement de la finalisation en base de données
    const updatePayload: Record<string, any> = {
      is_finalized: true,
      sync_status: 'synced',
      last_modified: new Date().toISOString(),
    };

    if (generalObservations) {
      updatePayload.general_observations = generalObservations;
    }

    // Optionnel : Mettre à jour l'horodatage de signature s'il est spécifié dans la requête
    if (signatureDate && inspection.signatures) {
      const signatures = { ...inspection.signatures };
      if (signatures.tenant) {
        signatures.tenant.signedAt = signatureDate;
      }
      if (signatures.inspector) {
        signatures.inspector.signedAt = signatureDate;
      }
      updatePayload.signatures = signatures;
    }

    const { error: updateError } = await supabase
      .from('inspections')
      .update(updatePayload)
      .eq('id', inspectionId);

    if (updateError) {
      console.error(`[Finalize] Erreur lors de la mise à jour de la finalisation pour ${inspectionId}:`, updateError);
      return NextResponse.json({ error: 'Impossible de finaliser l\'état des lieux en base de données.' }, { status: 500 });
    }

    // 8. Récupération des informations complémentaires pour la composition des e-mails
    // A. Récupération de l'Inspecteur (Agent)
    const { data: agent } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', inspection.inspector_id)
      .single();

    // B. Récupération du Locataire (Tenant)
    let tenantName = 'Locataire';
    let tenantEmail = '';

    if (inspection.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name, email')
        .eq('id', inspection.tenant_id)
        .single();
      
      if (tenant) {
        tenantName = tenant.name;
        tenantEmail = tenant.email;
      }
    } else if (inspection.manual_tenant) {
      tenantName = inspection.manual_tenant.name || 'Locataire';
      tenantEmail = inspection.manual_tenant.email || '';
    } else if (inspection.signatures?.tenant?.name) {
      tenantName = inspection.signatures.tenant.name;
    }

    // C. Récupération du nom de l'Agence
    const { data: agency } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', inspection.agency_id)
      .single();

    const agencyName = agency?.name || 'VestaCheck Partner';

    // 9. Déclenchement de l'envoi asynchrone des e-mails
    const agentEmail = agent?.email || currentUser.email;
    const agentName = agent?.name || currentUser.name;

    if (!agentEmail) {
      console.warn(`[Finalize] Pas d'e-mail trouvé pour l'agent de l'inspection ${inspectionId}. Envoi annulé.`);
      return NextResponse.json({ 
        success: true, 
        message: "État des lieux finalisé, mais l'e-mail n'a pas pu être envoyé car l'adresse de l'agent est manquante." 
      });
    }

    // Préparation des compteurs s'ils existent
    const counters = inspection.counters ? {
      water: inspection.counters.water || 0,
      electricity: inspection.counters.electricity || 0,
      gas: inspection.counters.gas
    } : undefined;

    // Envoi des e-mails (Agent + Locataire si désiré et si l'e-mail est présent)
    const emailResult = await sendInspectionCompletedEmails({
      agentEmail,
      agentName,
      tenantEmail: notifyTenant && tenantEmail ? tenantEmail : agentEmail, // Fallback vers l'agent si pas d'email locataire pour test
      tenantName,
      propertyAddress: inspection.property_address || 'Adresse non spécifiée',
      inspectionType: inspection.type || 'Entrée',
      date: inspection.date || new Date().toISOString(),
      agencyName,
      inspectionId,
      counters,
    });

    return NextResponse.json({
      success: true,
      message: 'État des lieux finalisé et e-mails planifiés avec succès.',
      emailSimulated: !!emailResult.simulated,
    });

  } catch (error: any) {
    console.error('[Finalize API] Erreur critique:', error);
    return NextResponse.json({ error: 'Une erreur interne est survenue lors de la finalisation.' }, { status: 500 });
  }
}
