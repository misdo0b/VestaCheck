import { z } from 'zod';

export const ConditionSchema = z.enum(['Neuf', 'Très Bon', 'Bon', 'Usage', 'Mauvais']);

export const PhotoMetadataSchema = z.object({
  id: z.string(),
  compressedBase64: z.string(),
  hasFullRes: z.boolean().optional(),
  cloudUrl: z.string().optional(),
  isSynced: z.boolean().default(false),
  status: z.enum(['PENDING', 'SYNCING', 'UPLOADED', 'ERROR']).default('PENDING'),
  storagePath: z.string().optional(),
});

export const InspectionItemSchema = z.object({
  id: z.string(),
  label: z.string().default(''), // Permis vide pendant la saisie
  condition: ConditionSchema,
  comment: z.string().default(''),
  photos: z.array(PhotoMetadataSchema).default([]),
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string().default(''), // Permis vide pendant la saisie
  items: z.array(InspectionItemSchema).default([]),
});

// Schéma de base pour éviter la duplication et les erreurs cycliques
const BaseReportSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  propertyAddress: z.string(),
  date: z.string(),
  type: z.enum(['Entrée', 'Sortie']),
  ownerId: z.string(),
  inspectorId: z.string(),
  tenantId: z.string().optional(),
  agencyId: z.string(),
  organizationId: z.string(),
  
  // Locataire manuel si pas sélectionné
  manualTenant: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
  }).optional(),

  counters: z.object({
    water: z.number().min(0),
    electricity: z.number().min(0),
    gas: z.number().optional(),
  }),
  
  keyInventories: z.array(z.object({
    id: z.string(),
    type: z.string(),
    count: z.number().min(0),
  })).default([]),

  generalObservations: z.string().default(''),

  signatures: z.object({
    tenant: z.object({
      drawData: z.string().optional(),
      type: z.enum(['Local', 'Distance', 'Aucune']),
      signedAt: z.string().optional(),
    }).optional(),
    inspector: z.object({
      drawData: z.string().optional(),
      type: z.enum(['Local', 'Distance', 'Aucune']),
      signedAt: z.string().optional(),
    }).optional(),
  }).optional(),

  rooms: z.array(RoomSchema).default([]),
  isFinalized: z.boolean().default(false),
  lastModified: z.string(),
});

// Schéma avec raffinements pour la validation RUNTIME
export const InspectionReportSchema = BaseReportSchema
  .refine((data) => {
    // Validation du locataire selon le type
    const hasTenant = !!data.tenantId || (!!data.manualTenant?.name && !!data.manualTenant?.email && !!data.manualTenant?.phone);
    if (data.type === 'Sortie') return !!data.tenantId;
    return hasTenant;
  }, {
    message: "Le locataire est requis (sélection ou saisie manuelle complète)",
    path: ['tenantId']
  })
  .refine((data) => {
    // Si finalisé, on exige que tout soit rempli
    if (data.isFinalized) {
      if (data.rooms.length === 0) return false;
      for (const room of data.rooms) {
        if (!room.name || room.name.trim() === '') return false;
        if (room.items.length === 0) return false;
        for (const item of room.items) {
          if (!item.label || item.label.trim() === '') return false;
        }
      }
    }
    return true;
  }, {
    message: "Le rapport doit être complet (noms des pièces et éléments) pour être finalisé.",
    path: ['isFinalized']
  });

// Schéma de Template
export const PropertyTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nom du modèle requis"),
  propertyId: z.string(),
  rooms: z.array(RoomSchema).default([]),
  lastModified: z.string(),
});

export type InspectionFormData = z.infer<typeof InspectionReportSchema>;
export type TemplateFormData = z.infer<typeof PropertyTemplateSchema>;
