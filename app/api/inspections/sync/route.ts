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

    for (const mutation of mutations) {
      const { type, entity, entityId, data } = mutation;
      const table = entityToTable(entity);

      if (type === 'DELETE') {
        await supabase.from(table).delete().eq('id', entityId);
        continue;
      }

      // 1. Password Hash pour les utilisateurs
      if (entity === 'user' && data?.password) {
        if (data.password.trim() !== '' && !data.password.startsWith('$2')) {
          data.password = await hashPassword(data.password);
        } else if (data.password.trim() === '') {
          delete data.password;
        }
      }

      // 2. Normalisation et Upsert
      if (entity === 'inspection') {
        const { rooms, ...inspectionData } = data;
        
        // Mapping camelCase -> snake_case
        const mappedData = camelToSnake(inspectionData);
        
        const { error: insError } = await supabase.from('inspections').upsert({
          ...mappedData,
          id: entityId,
          last_modified: new Date().toISOString(),
          server_version: (data.serverVersion || 0) + 1
        });

        if (insError) throw insError;

        // Gestion des pièces si présentes dans la mutation
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
        const { propertyIds, ...tenantData } = data;
        const mappedData = camelToSnake(tenantData);
        
        const { error } = await supabase.from('tenants').upsert({
          ...mappedData,
          id: entityId,
          last_modified: new Date().toISOString(),
          server_version: (data.serverVersion || 0) + 1
        });
        
        if (error) throw error;

        // Synchronisation de la table de jointure property_tenants
        if (propertyIds && Array.isArray(propertyIds)) {
          await supabase.from('property_tenants').delete().eq('tenant_id', entityId);
          if (propertyIds.length > 0) {
            const relations = propertyIds.map((pId: string) => ({
              property_id: pId,
              tenant_id: entityId
            }));
            const { error: relError } = await supabase.from('property_tenants').insert(relations);
            if (relError) throw relError;
          }
        }
      } else {
        // Upsert générique pour les autres entités
        // On retire les champs qui ne sont pas des colonnes (ex: templateIds)
        const { templateIds, ...cleanData } = data;
        const mappedData = camelToSnake(cleanData);
        
        const { error } = await supabase.from(table).upsert({
          ...mappedData,
          id: entityId,
          last_modified: new Date().toISOString(),
          server_version: (data.serverVersion || 0) + 1
        });
        if (error) throw error;
      }

      // 3. Logique métier : Statut locataire automatique
      if (entity === 'inspection' && data.isFinalized && data.type === 'Sortie' && data.tenantId) {
        await supabase.from('tenants')
          .update({ status: 'Sorti', last_modified: new Date().toISOString() })
          .eq('id', data.tenantId);
        console.log(`[Sync] Locataire ${data.tenantId} marqué comme 'Sorti'.`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: mutations.length,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Sync] Erreur critique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation Supabase' }, 
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

