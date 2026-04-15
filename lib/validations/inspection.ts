import { z } from 'zod';

export const ConditionSchema = z.enum(['Neuf', 'Très Bon', 'Bon', 'Usage', 'Mauvais']);

export const PhotoMetadataSchema = z.object({
  id: z.string(),
  compressedBase64: z.string(), // Version miniature (RAM)
  hasFullRes: z.boolean().optional(), // Présent dans IndexedDB
  cloudUrl: z.string().optional(),
  isSynced: z.boolean(),
});

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Le nom du locataire est requis"),
  email: z.string().email("L'adresse email est invalide"),
  phone: z.string().min(10, "Le numéro de téléphone est trop court"),
  status: z.enum(['Actuel', 'Sorti']).default('Actuel'),
  propertyIds: z.array(z.string()).default([]),
});

export const InspectionItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Le nom de l'élément est requis"),
  condition: ConditionSchema,
  comment: z.string().default(''),
  photos: z.array(PhotoMetadataSchema).default([]),
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom de la pièce est requis"),
  items: z.array(InspectionItemSchema).min(1, "Chaque pièce doit contenir au moins un élément"),
});

// Schéma de base pour éviter la duplication et les erreurs cycliques
const BaseReportSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  propertyAddress: z.string().min(5, "L'adresse est trop courte"),
  date: z.string().min(1, "La date de l'inspection est requise"),
  type: z.enum(['Entrée', 'Sortie']),
  ownerId: z.string(),
  inspectorId: z.string(),
  tenantId: z.string().optional(),
  manualTenant: z.object({
    name: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(10, "Téléphone requis"),
  }).optional(),
  signatures: z.object({
    tenant: z.object({
      drawData: z.string().optional(),
      type: z.enum(['Local', 'Distance', 'Aucune']).default('Aucune'),
      signedAt: z.string().optional(),
    }),
    inspector: z.object({
      drawData: z.string().optional(),
      type: z.enum(['Local', 'Distance', 'Aucune']).default('Aucune'),
      signedAt: z.string().optional(),
    }),
  }),
  counters: z.object({
    water: z.number().min(0, "L'index d'eau doit être un nombre positif"),
    electricity: z.number().min(0, "L'index d'électricité doit être un nombre positif"),
    gas: z.number().min(0).optional(),
  }),
  keyInventories: z.array(z.object({
    id: z.string(),
    type: z.string().min(1, "Le type de clé est requis"),
    count: z.number().min(0, "Le compte ne peut pas être négatif"),
  })),
  generalObservations: z.string().min(0).default(''),
  rooms: z.array(RoomSchema).min(1, "Au moins une pièce est requise"),
  isFinalized: z.boolean().default(false),
});

// Exportation de l'interface complète
export type InspectionFormData = z.infer<typeof BaseReportSchema>;

// Schéma avec raffinements pour la validation RUNTIME
export const InspectionReportSchema = BaseReportSchema.refine((data) => {
  if (data.type === 'Sortie') {
    return !!data.tenantId;
  }
  return !!data.tenantId || (!!data.manualTenant?.name && !!data.manualTenant?.email && !!data.manualTenant?.phone);
}, {
  message: "Le locataire est requis (sélection ou saisie manuelle complète)",
  path: ['tenantId']
});

// Schéma de Template
export const PropertyTemplateSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  rooms: z.array(RoomSchema).min(1, "Au moins une pièce est requise"),
  keyInventories: z.array(z.object({
    id: z.string(),
    type: z.string().min(1, "Le type de clé est requis"),
    count: z.number().min(0),
  })).optional(),
}).passthrough();
