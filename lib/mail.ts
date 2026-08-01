import { Resend } from 'resend';
import * as React from 'react';
import WelcomeEmail from '@/emails/WelcomeEmail';
import InspectionCompletedEmail from '@/emails/InspectionCompletedEmail';

// Initialisation du client Resend. 
// Sécurisé : Si la clé n'est pas configurée ou est une clé fictive, nous passons en mode "log" pour ne pas bloquer le développement.
const resendApiKey = process.env.RESEND_API_KEY;
const isDummyKey = !resendApiKey || resendApiKey.startsWith('re_dummy') || resendApiKey === 're_...';
const resend = isDummyKey ? null : new Resend(resendApiKey);

// Expéditeur par défaut (Doit correspondre à un domaine vérifié sur Resend, ex: vestacheck.com)
const envFrom = process.env.EMAIL_FROM;
const DEFAULT_FROM = (envFrom && envFrom.includes('@') && !envFrom.endsWith('@'))
  ? envFrom
  : 'VestaCheck <onboarding@vestacheck.com>';

/**
 * Envoie un e-mail de bienvenue à un nouvel Agent après son inscription.
 * 
 * @param email - Adresse e-mail de l'agent destinataire
 * @param name - Nom complet de l'agent
 * @param agencyName - Nom de l'agence (optionnel)
 */
export async function sendWelcomeEmail(email: string, name: string, agencyName?: string) {
  const subject = 'Bienvenue sur VestaCheck – Vos outils sont prêts !';

  try {
    if (!resend) {
      console.log('--- [SIMULATION MAIL BIENVENUE] ---');
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: Bienvenue à l'agent ${name} rattaché à l'agence: ${agencyName || 'Non spécifié'}`);
      console.log('------------------------------------');
      return { success: true, simulated: true };
    }

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [email],
      subject,
      react: React.createElement(WelcomeEmail, {
        agentName: name,
        agencyName,
      }),
    });

    if (error) {
      console.error('Erreur lors de l\'envoi du mail de bienvenue Resend:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur critique dans sendWelcomeEmail:', error);
    return { success: false, error };
  }
}

interface InspectionCompletedParams {
  agentEmail: string;
  agentName: string;
  tenantEmail: string;
  tenantName: string;
  propertyAddress: string;
  inspectionType: 'Entrée' | 'Sortie';
  date: string;
  agencyName: string;
  inspectionId: string;
  counters?: {
    water: number;
    electricity: number;
    gas?: number;
  };
  pdfAttachment?: {
    filename: string;
    content: Buffer | string;
  };
}

/**
 * Déclenche les e-mails de confirmation de clôture d'état des lieux.
 * Un e-mail est envoyé à l'Agent et un e-mail est envoyé au Locataire avec des contenus personnalisés et le PDF joint.
 */
export async function sendInspectionCompletedEmails(params: InspectionCompletedParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const reportUrl = `${baseUrl}/dashboard/inspections/${params.inspectionId}`;

  const agentSubject = `[Clôturé] État des lieux signé - ${params.propertyAddress}`;
  const tenantSubject = `Votre exemplaire d'état des lieux - ${params.propertyAddress}`;

  const attachments = params.pdfAttachment ? [
    {
      filename: params.pdfAttachment.filename,
      content: params.pdfAttachment.content,
    }
  ] : undefined;

  try {
    if (!resend) {
      console.log('--- [SIMULATION MAILS CLÔTURE ÉTAT DES LIEUX AVEC PIÈCE JOINTE PDF] ---');
      console.log(`[Agent] To: ${params.agentEmail} | Subject: ${agentSubject}`);
      console.log(`[Locataire] To: ${params.tenantEmail} | Subject: ${tenantSubject}`);
      console.log(`Détails: Bien situé au ${params.propertyAddress}, type ${params.inspectionType}`);
      console.log(`PDF Joint: ${params.pdfAttachment?.filename || 'Aucun'}`);
      console.log('--------------------------------------------------');
      return { success: true, simulated: true };
    }

    // Envoi à l'Agent (Asynchrone simultané)
    const agentMailPromise = resend.emails.send({
      from: DEFAULT_FROM,
      to: [params.agentEmail],
      subject: agentSubject,
      attachments,
      react: React.createElement(InspectionCompletedEmail, {
        recipientType: 'agent',
        recipientName: params.agentName,
        propertyAddress: params.propertyAddress,
        inspectionType: params.inspectionType,
        date: params.date,
        agencyName: params.agencyName,
        reportUrl,
        counters: params.counters,
      }),
    });

    // Envoi au Locataire
    const tenantMailPromise = resend.emails.send({
      from: DEFAULT_FROM,
      to: [params.tenantEmail],
      subject: tenantSubject,
      attachments,
      react: React.createElement(InspectionCompletedEmail, {
        recipientType: 'tenant',
        recipientName: params.tenantName,
        propertyAddress: params.propertyAddress,
        inspectionType: params.inspectionType,
        date: params.date,
        agencyName: params.agencyName,
        reportUrl,
        counters: params.counters,
      }),
    });

    // On attend les deux envois en parallèle
    const [agentRes, tenantRes] = await Promise.all([agentMailPromise, tenantMailPromise]);

    if (agentRes.error || tenantRes.error) {
      console.error('Certains e-mails de finalisation n\'ont pas pu être envoyés:', {
        agentError: agentRes.error,
        tenantError: tenantRes.error,
      });
      return {
        success: false,
        agentError: agentRes.error,
        tenantError: tenantRes.error,
      };
    }

    return {
      success: true,
      agentData: agentRes.data,
      tenantData: tenantRes.data,
    };
  } catch (error) {
    console.error('Erreur critique dans sendInspectionCompletedEmails:', error);
    return { success: false, error };
  }
}
