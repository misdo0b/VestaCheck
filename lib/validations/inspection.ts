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
  propertyAddress: z.preprocess(val => val ?? '', z.string().default('')),
  date: z.preprocess(val => val ?? new Date().toISOString().split('T')[0], z.string().default('')),
  type: z.preprocess(val => val || 'Entrée', z.enum(['Entrée', 'Sortie']).default('Entrée')),
  ownerId: z.preprocess(val => val ?? '', z.string().default('')),
  inspectorId: z.preprocess(val => val ?? '', z.string().default('')),
  tenantId: z.preprocess(val => val ?? undefined, z.string().optional()),
  agencyId: z.preprocess(val => val ?? '', z.string().default('')),
  organizationId: z.preprocess(val => val ?? '', z.string().default('')),

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

// Schéma avec raffinements pour la validation RUNTIME dynamique
export const getInspectionReportSchema = (t: (key: string) => string) => {
  return BaseReportSchema
    .refine((data) => {
      const hasTenant = !!(data.tenantId && data.tenantId.trim() !== '') || !!(data.manualTenant?.name && data.manualTenant.name.trim() !== '');
      return hasTenant;
    }, {
      message: t('validation.tenantRequired') || "Veuillez sélectionner ou renseigner un locataire.",
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
      message: t('validation.reportIncomplete'),
      path: ['rooms']
    });
};

// Schéma de Template dynamique
export const getPropertyTemplateSchema = (t: (key: string) => string) => {
  return z.object({
    id: ensureStringId,
    name: z.string().min(1, t('validation.templateNameRequired')),
    propertyId: z.string(),
    agencyId: z.string().optional(),
    organizationId: z.string().optional(),
    rooms: z.array(RoomSchema).default([]),
    keyInventories: z.preprocess(val => val ?? [], z.array(z.object({
      id: ensureStringId,
      type: z.preprocess(val => val ?? 'Clés du logement', z.string().default('Clés du logement')),
      count: z.preprocess(val => val ?? 1, z.number().default(1)),
    })).default([])),
    lastModified: z.string().optional(),
  }).refine((data) => {
    if (!data.rooms || data.rooms.length === 0) return false;
    for (const room of data.rooms) {
      if (!room.name || room.name.trim() === '') return false;
      if (!room.items || room.items.length === 0) return false;
      for (const item of room.items) {
        if (!item.label || item.label.trim() === '') return false;
      }
    }
    return true;
  }, {
    message: t('validation.reportIncomplete') || "Chaque pièce doit avoir un nom et des éléments nommés.",
    path: ['rooms']
  });
};

// Types dérivés des schémas dynamiques pour garantir la compatibilité
export type InspectionFormData = z.infer<ReturnType<typeof getInspectionReportSchema>>;
export type TemplateFormData = z.infer<ReturnType<typeof getPropertyTemplateSchema>>;
export type InspectionReportType = InspectionFormData; // Alias pour compatibilité descendante

