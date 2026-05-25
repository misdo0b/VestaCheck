import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  autoEmailSignatories: z.boolean(),
  theme: z.enum(['light', 'dark']),
  language: z.enum(['fr', 'en', 'es', 'zh', 'ar']),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
