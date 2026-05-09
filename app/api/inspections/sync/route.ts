import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/utils/password';
import { camelToSnake } from '@/lib/utils/mapping';

/**
 * POST /api/inspections/sync
 * Endpoint de synchronisation atomique pour Supabase.
 */
export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { mutations } = await req.json();

    if (!Array.isArray(mutations)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }

    console.log(`[Sync] Début de la synchronisation Supabase (${mutations.length} mutations)`);
    const supabase = await getSupabase(true); // Service role pour bypass RLS et gestion batch

    const results = [];
    for (const mutation of mutations) {
      try {
        const { type, entity, entityId, data } = mutation;
        const table = entityToTable(entity);

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(entityId)) {
          console.warn(`[Sync] Rejet mutation : ID non-UUID détecté (${entity}:${entityId})`);
          results.push({ id: mutation.id, status: 'error', error: 'Invalid UUID format. Expected standard UUID.' });
          continue;
        }

        if (type === 'DELETE') {
          await supabase.from(table).delete().eq('id', entityId);
          results.push({ id: mutation.id, status: 'success' });
          continue;
        }

        if (entity === 'user') {
          // L'email n'est requis que si on tente de créer ou si on l'a fourni
          if (!data.email && type === 'CREATE') {
            results.push({ id: mutation.id, status: 'error', error: 'Email is required for creation' });
            continue;
          }

          if (data.password) {
            if (data.password.trim() !== '' && !data.password.startsWith('$2')) {
              data.password = await hashPassword(data.password);
            } else if (data.password.trim() === '') {
              delete data.password;
            }
          }
        }

        if (entity === 'inspection') {
          const { rooms, ...inspectionData } = data;
          const mappedData = camelToSnake(inspectionData);

          const { error: insError } = await supabase.from('inspections').upsert({
            ...mappedData,
            id: entityId,
            last_modified: new Date().toISOString(),
            server_version: (data.serverVersion || 0) + 1
          });

          if (insError) throw insError;

          if (rooms && Array.isArray(rooms)) {
            for (const room of rooms) {
              const { items, ...roomData } = room;
              await supabase.from('rooms').upsert({
                id: room.id,
                inspection_id: entityId,
                name: room.name,
                display_order: room.display_order || 0
              });

              if (items && Array.isArray(items)) {
                for (const item of items) {
                  const { photos, ...itemData } = item;
                  await supabase.from('inspection_items').upsert({
                    id: item.id,
                    room_id: room.id,
                    label: item.label,
                    condition: item.condition,
                    comment: item.comment || ''
                  });

                  if (photos && Array.isArray(photos)) {
                    for (const photo of photos) {
                      await supabase.from('photos').upsert({
                        id: photo.id,
                        item_id: item.id,
                        compressed_base64: photo.compressedBase64,
                        cloud_url: photo.cloudUrl,
                        is_synced: photo.isSynced
                      });
                    }
                  }
                }
              }
            }
          }
        } else if (entity === 'tenant') {
          // Extraction robuste des propertyIds (supporte camelCase et snake_case)
          const propertyIds = data.propertyIds || data.property_ids;
          
          // Nettoyage des données pour l'upsert
          const { propertyIds: _, property_ids: __, ...tenantData } = data;
          const mappedData = camelToSnake(tenantData);

          const payload = {
            ...mappedData,
            id: entityId,
            last_modified: new Date().toISOString(),
            server_version: (data.serverVersion || 0) + 1
          };

          let error;
          if (type === 'UPDATE') {
            const { error: updateError } = await supabase
              .from('tenants')
              .update(payload)
              .eq('id', entityId);
            error = updateError;
          } else {
            const { error: upsertError } = await supabase
              .from('tenants')
              .upsert(payload);
            error = upsertError;
          }

          if (error) throw error;

          // Synchronisation de la table de jointure property_tenants
          if (propertyIds && Array.isArray(propertyIds)) {
            // Nettoyage des relations existantes
            await supabase.from('property_tenants').delete().eq('tenant_id', entityId);

            if (propertyIds.length > 0) {
              const relations = propertyIds
                .filter((pId: string) => pId && pId.length > 5 && pId !== 'prop1') // Filtrage IDs invalides
                .map((pId: string) => ({
                  property_id: pId,
                  tenant_id: entityId
                }));

              if (relations.length > 0) {
                const { error: relError } = await supabase.from('property_tenants').insert(relations);
                if (relError) {
                  console.error(`[Sync] Error updating property_tenants for tenant ${entityId}:`, relError);
                }
              }
            }
          }
        } else {
          const { templateIds, ...cleanData } = data;
          const mappedData = camelToSnake(cleanData);

          const payload = {
            ...mappedData,
            id: entityId,
            last_modified: new Date().toISOString(),
            server_version: (data.serverVersion || 0) + 1
          };

          let error;
          if (type === 'UPDATE') {
            const { error: updateError } = await supabase
              .from(table)
              .update(payload)
              .eq('id', entityId);
            error = updateError;
          } else {
            const { error: upsertError } = await supabase
              .from(table)
              .upsert(payload);
            error = upsertError;
          }

          if (error) throw error;
        }

        if (entity === 'inspection' && data.isFinalized && data.type === 'Sortie' && data.tenantId) {
          await supabase.from('tenants')
            .update({ status: 'Sorti', last_modified: new Date().toISOString() })
            .eq('id', data.tenantId);
        }

        results.push({ id: mutation.id, status: 'success' });
      } catch (mutationError: any) {
        console.error(`[Sync] Mutation error (${mutation.entity}:${mutation.entityId}):`, mutationError);
        results.push({
          id: mutation.id,
          status: 'error',
          error: mutationError.message || 'Unknown error',
          code: mutationError.code
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: mutations.length,
      results,
      syncedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Sync] Critical global error:', error);
    return NextResponse.json(
      { error: 'Critical sync error', message: error.message },
      { status: 500 }
    );
  }
}

function entityToTable(entity: string): string {
  const map: Record<string, string> = {
    'user': 'users',
    'property': 'properties',
    'inspection': 'inspections',
    'tenant': 'tenants',
    'agency': 'agencies',
    'organization': 'organizations',
    'template': 'property_templates'
  };
  return map[entity] || entity;
}

