import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from '@react-email/components';

interface UtilityCounters {
  water: number;
  electricity: number;
  gas?: number;
}

interface InspectionCompletedEmailProps {
  recipientType: 'agent' | 'tenant';
  recipientName: string;
  propertyAddress: string;
  inspectionType: 'Entrée' | 'Sortie';
  date: string;
  agencyName: string;
  reportUrl: string;
  counters?: UtilityCounters;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const InspectionCompletedEmail = ({
  recipientType,
  recipientName,
  propertyAddress,
  inspectionType,
  date,
  agencyName,
  reportUrl,
  counters,
}: InspectionCompletedEmailProps) => {
  const isAgent = recipientType === 'agent';
  const displayDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Html lang="fr">
      <Head />
      <Preview>
        {isAgent
          ? `[Clôturé] État des lieux signé - ${propertyAddress}`
          : `Votre exemplaire de l'état des lieux - ${propertyAddress}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <div style={logoContainer}>
              <span style={logoText}>Vesta</span>
              <span style={logoSubtext}>Check</span>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading style={h1}>
              {isAgent ? 'Clôture de votre état des lieux' : 'Votre état des lieux est disponible'}
            </Heading>

            <Text style={paragraph}>
              Bonjour {recipientName},
            </Text>

            {isAgent ? (
              <Text style={paragraph}>
                Félicitations, l'état des lieux de <strong>{inspectionType.toLowerCase()}</strong> a été finalisé et signé avec succès. Le document officiel a été archivé et envoyé automatiquement au locataire.
              </Text>
            ) : (
              <Text style={paragraph}>
                Nous vous remercions pour votre confiance et votre collaboration lors de l'état des lieux de <strong>{inspectionType.toLowerCase()}</strong> réalisé pour votre logement. 
                Celui-ci a été validé et signé numériquement par l'agent de <strong>{agencyName}</strong> et vous-même.
              </Text>
            )}

            {/* Summary Details Box */}
            <Section style={detailsBox}>
              <Heading style={detailsTitle}>Récapitulatif de l'état des lieux</Heading>
              
              <Row style={detailRow}>
                <Column style={detailLabel}>Bien concerné :</Column>
                <Column style={detailValue}>{propertyAddress}</Column>
              </Row>
              
              <Row style={detailRow}>
                <Column style={detailLabel}>Type de rapport :</Column>
                <Column style={detailValue}>État des lieux d'{inspectionType}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Date de réalisation :</Column>
                <Column style={detailValue}>{displayDate}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Opérateur :</Column>
                <Column style={detailValue}>{agencyName}</Column>
              </Row>
            </Section>

            {/* Utility Counters Card (Mainly useful for Tenant or Agent quick recap) */}
            {counters && (
              <Section style={countersBox}>
                <Heading style={countersTitle}>Relevés de compteurs saisis</Heading>
                <Row style={counterRow}>
                  <Column style={counterCol}>
                    <Text style={counterName}>Électricité</Text>
                    <Text style={counterVal}>{counters.electricity} kWh</Text>
                  </Column>
                  <Column style={counterCol}>
                    <Text style={counterName}>Eau froide</Text>
                    <Text style={counterVal}>{counters.water} m³</Text>
                  </Column>
                  {counters.gas !== undefined && (
                    <Column style={counterCol}>
                      <Text style={counterName}>Gaz</Text>
                      <Text style={counterVal}>{counters.gas} m³</Text>
                    </Column>
                  )}
                </Row>
              </Section>
            )}

            {/* Action Area */}
            <Section style={buttonContainer}>
              {isAgent ? (
                <Button style={btn} href={reportUrl}>
                  Consulter sur mon tableau de bord
                </Button>
              ) : (
                <Button style={btn} href={reportUrl}>
                  Télécharger mon exemplaire PDF
                </Button>
              )}
            </Section>

            {!isAgent && (
              <Text style={warningText}>
                Important : Nous vous conseillons de télécharger ce document et de le conserver précieusement pendant toute la durée de votre bail ou de votre gestion locative.
              </Text>
            )}

            <Hr style={divider} />

            <Text style={paragraph}>
              Besoin d'aide ? Notre service support est accessible à l'adresse <Link href="mailto:support@vestacheck.com" style={link}>support@vestacheck.com</Link>.
            </Text>

            <Text style={signature}>
              Cordialement,<br />
              <strong>{isAgent ? "L'équipe VestaCheck" : `L'équipe ${agencyName}`}</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Cet e-mail automatique a été envoyé via VestaCheck par l'agence {agencyName}.<br />
              VestaCheck SaaS – Sécurisation et numérisation des rapports immobiliers.<br />
              <Link href={`${baseUrl}/terms`} style={footerLink}>CGU</Link> • <Link href={`${baseUrl}/privacy`} style={footerLink}>Mentions Légales</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InspectionCompletedEmail;

/* Premium Styling */
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0 auto',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  width: '600px',
  maxWidth: '100%',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
  overflow: 'hidden' as const,
  border: '1px solid #e2e8f0',
};

const headerSection = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const logoContainer = {
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '-0.5px',
};

const logoText = {
  color: '#ffffff',
};

const logoSubtext = {
  color: '#6366f1',
};

const contentSection = {
  padding: '40px 40px 30px 40px',
};

const h1 = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '700',
  textAlign: 'left' as const,
  margin: '0 0 20px 0',
  lineHeight: '1.3',
};

const paragraph = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '25px 0',
};

/* Details Card */
const detailsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #f1f5f9',
  marginBottom: '20px',
};

const detailsTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const detailRow = {
  marginBottom: '8px',
};

const detailLabel = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '500',
  width: '150px',
  verticalAlign: 'top',
};

const detailValue = {
  color: '#0f172a',
  fontSize: '14px',
  fontWeight: '600',
  verticalAlign: 'top',
};

/* Utility Counters Card */
const countersBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px 20px',
  border: '1px solid #dcfce7',
  marginBottom: '20px',
};

const countersTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#15803d',
  margin: '0 0 10px 0',
};

const counterRow = {
  textAlign: 'center' as const,
};

const counterCol = {
  verticalAlign: 'top',
};

const counterName = {
  fontSize: '12px',
  color: '#16a34a',
  margin: '0 0 4px 0',
  fontWeight: '500',
};

const counterVal = {
  fontSize: '16px',
  color: '#14532d',
  fontWeight: '700',
  margin: '0',
};

/* Button & Action */
const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const btn = {
  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
};

const warningText = {
  color: '#b45309',
  backgroundColor: '#fffbeb',
  borderRadius: '6px',
  border: '1px solid #fef3c7',
  padding: '12px 16px',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '16px 0',
};

const link = {
  color: '#4f46e5',
  textDecoration: 'underline',
};

const signature = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '25px 0 0 0',
};

/* Footer */
const footer = {
  backgroundColor: '#f1f5f9',
  padding: '24px 40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
};

const footerLink = {
  color: '#475569',
  textDecoration: 'underline',
  fontSize: '12px',
};
