import { z } from 'zod';

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const ensureStringId = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() !== '') return val;
  return generateUUID();
}, z.string());

export const CONDITION_OPTIONS = ['Neuf', 'Très Bon', 'Bon', 'Usage', 'Mauvais'] as const;

export const ConditionSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const normalized = val.trim();
      const matched = CONDITION_OPTIONS.find(c => c.toLowerCase() === normalized.toLowerCase());
      if (matched) return matched;
    }
    return 'Bon';
  },
  z.enum(CONDITION_OPTIONS)
);

export const PhotoMetadataSchema = z.object({
  id: ensureStringId,
  compressedBase64: z.preprocess(val => val ?? '', z.string().default('')),
  cloudUrl: z.preprocess(val => val ?? undefined, z.string().optional()),
  isSynced: z.preprocess(val => val ?? false, z.boolean().default(false)),
  hasFullRes: z.preprocess(val => val ?? false, z.boolean().default(false)),
  status: z.preprocess(val => val ?? 'PENDING', z.enum(['PENDING', 'SYNCING', 'UPLOADED', 'ERROR']).default('PENDING')),
  storagePath: z.preprocess(val => val ?? undefined, z.string().optional()),
});

export const InspectionItemSchema = z.object({
  id: ensureStringId,
  label: z.preprocess(val => val ?? '', z.string().default('')), // Permis vide pendant la saisie
  condition: ConditionSchema,
  comment: z.preprocess(val => val ?? '', z.string().default('')),
  photos: z.preprocess(val => val ?? [], z.array(PhotoMetadataSchema).default([])),
});

export const RoomSchema = z.object({
  id: ensureStringId,
  name: z.preprocess(val => val ?? '', z.string().default('')), // Permis vide pendant la saisie
  items: z.preprocess(val => val ?? [], z.array(InspectionItemSchema).default([])),
});

// Schéma de base pour éviter la duplication et les erreurs cycliques
const BaseReportSchema = z.object({
  id: ensureStringId,
  propertyId: z.string(),
  propertyAddress: z.string(),
  date: z.string(),
  type: z.enum(['Entrée', 'Sortie']),
  ownerId: z.string(),
  inspectorId: z.string(),
  tenantId: z.preprocess(val => val ?? undefined, z.string().optional()),
  agencyId: z.string(),
  organizationId: z.string(),

  // Locataire manuel si pas sélectionné
  manualTenant: z.object({
    name: z.preprocess(val => val ?? '', z.string().default('')),
    email: z.preprocess(val => val ?? '', z.string().default('')),
    phone: z.preprocess(val => val ?? '', z.string().default('')),
  }).optional(),

  counters: z.object({
    water: z.preprocess(val => val ?? 0, z.number().default(0)),
    electricity: z.preprocess(val => val ?? 0, z.number().default(0)),
    gas: z.preprocess(val => val ?? undefined, z.number().optional()),
  }),

  keyInventories: z.preprocess(val => val ?? [], z.array(z.object({
    id: ensureStringId,
    type: z.preprocess(val => val ?? 'Clés du logement', z.string().default('Clés du logement')),
    count: z.preprocess(val => val ?? 1, z.number().default(1)),
  })).default([])),

  generalObservations: z.preprocess(val => val ?? '', z.string().default('')),

  signatures: z.object({
    tenant: z.object({
      drawData: z.preprocess(val => val ?? undefined, z.string().optional()),
      type: z.preprocess(val => val ?? 'Aucune', z.enum(['Local', 'Distance', 'Aucune']).default('Aucune')),
      signedAt: z.preprocess(val => val ?? undefined, z.string().optional()),
    }).optional(),
    inspector: z.object({
      drawData: z.preprocess(val => val ?? undefined, z.string().optional()),
      type: z.preprocess(val => val ?? 'Aucune', z.enum(['Local', 'Distance', 'Aucune']).default('Aucune')),
      signedAt: z.preprocess(val => val ?? undefined, z.string().optional()),
    }).optional(),
  }).optional(),

  rooms: z.preprocess(val => val ?? [], z.array(RoomSchema).default([])),
  isFinalized: z.preprocess(val => val ?? false, z.boolean().default(false)),
  lastModified: z.string(),
});

// Schéma avec raffinements pour la validation RUNTIME
export const InspectionReportSchema = BaseReportSchema
  .refine((data) => {
    // Si finalisé, le locataire est requis
    if (data.isFinalized) {
      const hasTenant = !!data.tenantId || (!!data.manualTenant?.name && !!data.manualTenant?.email && !!data.manualTenant?.phone);
      if (data.type === 'Sortie') return !!data.tenantId;
      return hasTenant;
    }
    return true;
  }, {
    message: "Le locataire est requis (sélection ou saisie manuelle complète) pour finaliser le rapport.",
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
  id: ensureStringId,
  name: z.string().min(1, "Nom du modèle requis"),
  propertyId: z.string(),
  agencyId: z.string().optional(),
  organizationId: z.string().optional(),
  rooms: z.array(RoomSchema).default([]),
  lastModified: z.string(),
});

export type InspectionFormData = z.infer<typeof InspectionReportSchema>;
export type TemplateFormData = z.infer<typeof PropertyTemplateSchema>;
