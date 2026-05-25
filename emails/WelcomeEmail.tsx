import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from '@react-email/components';

interface WelcomeEmailProps {
  agentName: string;
  agencyName?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const WelcomeEmail = ({
  agentName,
  agencyName = 'votre agence',
}: WelcomeEmailProps) => {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Bienvenue sur VestaCheck – Révolutionnez vos états des lieux immobiliers</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            <div style={logoContainer}>
              <span style={logoText}>Vesta</span>
              <span style={logoSubtext}>Check</span>
            </div>
          </Section>

          {/* Welcome Message */}
          <Section style={contentSection}>
            <Heading style={h1}>Bienvenue parmi nous, {agentName} !</Heading>
            <Text style={paragraph}>
              Nous sommes ravis de vous compter parmi les professionnels de l'immobilier qui font confiance à <strong>VestaCheck</strong> pour simplifier et sécuriser leurs états des lieux.
            </Text>
            <Text style={paragraph}>
              Votre compte a été créé avec succès pour le compte de <strong>{agencyName}</strong>. Notre mission est de vous faire gagner un temps précieux sur le terrain tout en assurant une conformité juridique irréprochable.
            </Text>

            <Hr style={divider} />

            {/* Steps Title */}
            <Heading style={h2}>3 étapes pour démarrer efficacement</Heading>

            {/* Step 1 */}
            <Section style={card}>
              <Row>
                <Column style={cardBadgeCol}>
                  <span style={badge}>1</span>
                </Column>
                <Column style={cardContentCol}>
                  <Heading style={cardTitle}>Complétez votre profil & agence</Heading>
                  <Text style={cardDescription}>
                    Assurez-vous que vos informations d'identité, coordonnées et le logo de votre agence sont corrects. Ils figureront sur tous vos rapports finaux générés en PDF.
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Step 2 */}
            <Section style={card}>
              <Row>
                <Column style={cardBadgeCol}>
                  <span style={badge}>2</span>
                </Column>
                <Column style={cardContentCol}>
                  <Heading style={cardTitle}>Enregistrez votre premier bien</Heading>
                  <Text style={cardDescription}>
                    Configurez vos appartements ou maisons directement depuis le tableau de bord ou importez des modèles prédéfinis de pièces pour gagner du temps.
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Step 3 */}
            <Section style={card}>
              <Row>
                <Column style={cardBadgeCol}>
                  <span style={badge}>3</span>
                </Column>
                <Column style={cardContentCol}>
                  <Heading style={cardTitle}>Réalisez l'état des lieux terrain</Heading>
                  <Text style={cardDescription}>
                    Sur mobile ou tablette, même sans réseau internet. Saisissez les compteurs, l'état de chaque pièce, prenez des photos HD en direct et faites signer le locataire de manière sécurisée.
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={btn} href={`${baseUrl}/dashboard`}>
                Accéder à mon tableau de bord
              </Button>
            </Section>

            <Text style={paragraph}>
              Si vous avez des questions ou si vous rencontrez le moindre problème, notre support technique est à votre entière disposition à l'adresse <Link href="mailto:support@vestacheck.com" style={link}>support@vestacheck.com</Link>.
            </Text>

            <Text style={signature}>
              À très vite,<br />
              <strong>L'équipe VestaCheck</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} VestaCheck SaaS. Tous droits réservés.<br />
              Conçu pour simplifier la vie des agences immobilières et des administrateurs de biens.<br />
              <Link href={`${baseUrl}/privacy`} style={footerLink}>Politique de confidentialité</Link> • <Link href={`${baseUrl}/terms`} style={footerLink}>CGU</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

/* Styles - Premium Styling System with harmonious slate/indigo colors */
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

const logoSection = {
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

const h2 = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '25px 0 15px 0',
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

/* Onboarding Cards */
const card = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '16px',
  border: '1px solid #f1f5f9',
};

const cardBadgeCol = {
  width: '36px',
  verticalAlign: 'top',
};

const badge = {
  display: 'inline-block',
  width: '26px',
  height: '26px',
  lineHeight: '26px',
  backgroundColor: '#e0e7ff',
  color: '#4f46e5',
  borderRadius: '50%',
  fontWeight: '700',
  textAlign: 'center' as const,
  fontSize: '14px',
};

const cardContentCol = {
  paddingLeft: '12px',
  verticalAlign: 'top',
};

const cardTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 4px 0',
};

const cardDescription = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#475569',
  margin: '0',
};

/* CTA Button */
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
