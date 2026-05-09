import { z } from 'zod';

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  // Honeypot : doit être vide
  fax_number: z.string().max(0, 'Échec de la validation de sécurité').optional(),
  // Token Turnstile
  turnstileToken: z.string().min(1, 'Veuillez valider le captcha'),
});

/**
 * Schémas pour les étapes d'inscription
 */
export const step1Schema = z.object({
  raisonSociale: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  siret: z.string().length(14, 'Le SIRET doit faire exactement 14 chiffres'),
  adressePostale: z.string().min(5, 'L\'adresse est trop courte'),
});

export const step2Schema = z.object({
  agencyName: z.string().min(2, 'Le nom de l\'agence est requis'),
  agencyAddress: z.string().min(5, 'L\'adresse de l\'agence est trop courte'),
  agencyPhone: z.string().min(10, 'Le numéro de téléphone est invalide'),
});

export const step3Schema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
});

/**
 * Schéma global pour l'inscription (validation finale)
 */
export const registerSchema = z.object({
  organization: z.object({
    raisonSociale: z.string().min(2),
    siret: z.string().length(14),
    adressePostale: z.string().min(5),
  }),
  agency: z.object({
    name: z.string().min(2),
    address: z.string().min(5),
    phone: z.string().min(10),
  }),
  admin: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  }),
  // Honeypot
  fax_number: z.string().max(0, 'Échec de la validation de sécurité').optional(),
  // Turnstile
  turnstileToken: z.string().min(1, 'Échec de la validation de sécurité'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
