import { z } from 'zod';

/**
 * Schéma de validation pour le paramètre d'URL de finalisation (ID de l'inspection)
 */
export const FinalizeParamsSchema = z.object({
  id: z.string().uuid("L'identifiant d'état des lieux doit être un UUID valide."),
});

/**
 * Schéma de validation pour le corps de la requête JSON (payload entrante)
 */
export const FinalizeBodySchema = z.object({
  signatureDate: z.string().datetime({ message: "La date de signature doit être au format ISO 8601." }).optional(),
  notifyTenant: z.boolean().default(true),
  generalObservations: z.string().optional(),
});

export type FinalizeBody = z.infer<typeof FinalizeBodySchema>;
