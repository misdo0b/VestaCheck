import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { auth } from '@/lib/auth';

/**
 * Route de synchronisation atomique pour les inspections.
 * Gère l'upsert récursif des inspections, pièces, éléments et photos.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { mutations } = await req.json();
    if (!mutations || !Array.isArray(mutations)) {
      return NextResponse.json({ error: 'Format de mutations invalide' }, { status: 400 });
    }

    const supabase = await getSupabase(true); // Utilisation du service_role pour garantir la persistance atomique
    const results = [];

    console.log(`[Sync] Début du traitement de ${mutations.length} mutations`);

    for (const mutation of mutations) {
      const { type, entity, entityId, data } = mutation;

      if (entity === 'inspection' && type === 'UPDATE') {
        console.log(`[Sync] Traitement de l'inspection: ${entityId}`);

        // 1. Upsert de l'inspection principale
        const { error: inspError } = await supabase.from('inspections').upsert({
          id: entityId,
          property_id: data.propertyId,
          inspector_id: data.inspectorId,
          owner_id: data.ownerId,
          tenant_id: data.tenantId,
          agency_id: data.agencyId,
          organization_id: data.organizationId,
          date: data.date,
          type: data.type,
          counters: data.counters || { water: 0, electricity: 0 },
          general_observations: data.generalObservations || '',
          is_finalized: data.isFinalized || false,
          last_modified: data.lastModified || new Date().toISOString(),
          property_address: data.propertyAddress,
          key_inventories: data.keyInventories || [],
          signatures: data.signatures || { tenant: { type: 'Aucune' }, inspector: { type: 'Aucune' } }
        });

        if (inspError) {
          console.error(`[Sync] Erreur upsert inspection ${entityId}:`, inspError);
          results.push({ id: mutation.id, status: 'error', error: inspError.message });
          continue;
        }

        // 2. Traitement des pièces et éléments (si présents)
        let hasError = false;
        if (data.rooms && Array.isArray(data.rooms)) {
          console.log(`[Sync] Traitement de ${data.rooms.length} pièces pour l'inspection ${entityId}`);

          for (const room of data.rooms) {
            try {
              // Upsert Room
              const { error: roomError } = await supabase.from('rooms').upsert({
                id: room.id,
                inspection_id: entityId,
                name: room.name,
                display_order: room.displayOrder || room.display_order || 0
              });

              if (roomError) throw roomError;

              // Upsert Items
              if (room.items && Array.isArray(room.items)) {
                for (const item of room.items) {
                  const { error: itemError } = await supabase.from('inspection_items').upsert({
                    id: item.id,
                    room_id: room.id,
                    label: item.label,
                    condition: item.condition,
                    comment: item.comment || '',
                    display_order: item.displayOrder || item.display_order || 0
                  });

                  if (itemError) throw itemError;

                  // Upsert Photos
                  if (item.photos && Array.isArray(item.photos)) {
                    for (const photo of item.photos) {
                      const { error: photoError } = await supabase.from('photos').upsert({
                        id: photo.id,
                        item_id: item.id,
                        cloud_url: photo.cloudUrl || null,
                        compressed_base64: photo.compressedBase64 || null,
                        is_synced: photo.isSynced || false,
                        has_full_res: photo.hasFullRes || false
                      });

                      if (photoError) throw photoError;
                    }
                  }
                }
              }
            } catch (err: any) {
              console.error(`[Sync] Échec de la hiérarchie pour la pièce ${room.id}:`, err);
              hasError = true;
              break; // On arrête pour cette inspection si une pièce échoue
            }
          }
        }

        if (!hasError) {
          results.push({ id: mutation.id, status: 'success' });
        } else {
          results.push({ id: mutation.id, status: 'error', error: 'Erreur lors du traitement de la hiérarchie des pièces' });
        }
      } else {
        // Autres types d'entités (propriétés, etc.) - Traitement générique simplifié
        const tableName = 
          entity === 'property' ? 'properties' :
          entity === 'tenant' ? 'tenants' :
          entity === 'user' ? 'users' :
          entity === 'template' ? 'property_templates' :
          entity === 'agency' ? 'agencies' :
          entity === 'organization' ? 'organizations' : null;

        if (tableName) {
          const { camelToSnake } = await import('@/lib/utils/mapping');
          
          // On s'assure d'inclure l'identifiant pour que l'upsert fonctionne comme un update/insert ciblé.
          // On convertit également les clés camelCase en snake_case pour la base de données.
          const payload = camelToSnake({
            id: entityId,
            ...data
          });

          // Si c'est un utilisateur et qu'un mot de passe en clair est fourni, on le hache
          if (entity === 'user' && payload.password && !payload.password.startsWith('$2a$')) {
            const { hashPassword } = await import('@/lib/utils/password');
            payload.password = await hashPassword(payload.password);
          }

          // Extraire les property_ids pour la table de jointure et nettoyer le payload
          const propertyIds = data.propertyIds || [];
          delete payload.property_ids;
          delete payload.property_ids_list;
          delete payload.template_ids;
          delete payload.template_ids_list;

          const { error } = await supabase.from(tableName).upsert(payload);
          
          let relationError = null;
          if (!error && entity === 'tenant' && data.propertyIds !== undefined) {
            try {
              // Nettoyage des anciennes associations
              const { error: deleteErr } = await supabase.from('property_tenants').delete().eq('tenant_id', entityId);
              if (deleteErr) throw deleteErr;
              
              // Insertion des nouvelles associations
              if (propertyIds.length > 0) {
                const relations = propertyIds.map((pid: string) => ({
                  tenant_id: entityId,
                  property_id: pid
                }));
                const { error: insertErr } = await supabase.from('property_tenants').insert(relations);
                if (insertErr) throw insertErr;
              }
            } catch (relationErr: any) {
              console.error(`[Sync] Erreur lors de la synchronisation des relations property_tenants pour le locataire ${entityId}:`, relationErr);
              relationError = relationErr;
            }
          }

          results.push({
            id: mutation.id,
            status: (error || relationError) ? 'error' : 'success',
            error: error?.message || relationError?.message
          });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('[Sync API] Global Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
