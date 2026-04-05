import { z } from 'zod';

export const ConditionSchema = z.enum(['Neuf', 'Très Bon', 'Bon', 'Usage', 'Mauvais']);

export const PhotoMetadataSchema = z.object({
  id: z.string(),
  fullResBase64: z.string().optional(),
  compressedBase64: z.string(),
  cloudUrl: z.string().optional(),
  isSynced: z.boolean(),
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

export const InspectionReportSchema = z.object({
  id: z.string(),
  propertyAddress: z.string().min(5, "L'adresse est trop courte"),
  date: z.string().min(1, "La date de l'inspection est requise"),
  type: z.enum(['Entrée', 'Sortie']),
  ownerId: z.string(),
  inspectorId: z.string(),
  tenantName: z.string().min(2, "Le nom du locataire est requis"),
  tenantEmail: z.string().email("L'adresse email est invalide"),
  tenantPhone: z.string().min(10, "Le numéro de téléphone est trop court"),
  
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

  // Éléments de conformité
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

export type InspectionFormData = z.infer<typeof InspectionReportSchema>;
