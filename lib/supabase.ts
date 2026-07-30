import { createClient } from '@supabase/supabase-js';
import { auth } from './auth';

/**
 * Configuration du client Supabase pour VestaCheck.
 * Ce client est conçu pour être utilisé principalement côté serveur (Server Actions, API Routes).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Récupère un client Supabase configuré.
 * 
 * @param useServiceRole - Utiliser la clé d'administration (bypass RLS). Utile pour le bootstrap ou les tâches système.
 * @returns Client Supabase
 */
export async function getSupabase(useServiceRole = false) {
  const key = (useServiceRole && supabaseServiceKey) ? supabaseServiceKey : supabaseAnonKey;
  
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false, // Pas de persistance côté serveur
    }
  });
}

/**
 * Utilitaire pour effectuer des requêtes sécurisées en injectant le contexte NextAuth.
 * Si RLS est activé côté Supabase, ce helper permet de s'assurer que les filtres
 * sont toujours appliqués même en utilisant la clé service_role sur le serveur.
 */
export async function createAuthenticatedClient() {
  const session = await auth();
  const supabase = await getSupabase(true); // On utilise la clé service pour la puissance, mais on restreint manuellement
  
  if (!session?.user) {
    throw new Error("Authentification requise pour accéder à Supabase.");
  }

  const user = session.user as any;

  return {
    client: supabase,
    user,
    /**
     * Helper pour appliquer les filtres de hiérarchie VestaCheck.
     * Organisation > Agence > Agent
     */
    applyFilters: (query: any) => {
      let q = query.eq('organization_id', user.organizationId);
      
      // Si l'utilisateur est un Agent, on restreint à son agence
      if (user.role === 'Agent') {
        q = q.eq('agency_id', user.agencyId);
      }
      
      return q;
    }
  };
}
