import Dexie, { type Table } from 'dexie';
import { 
  User, 
  Property, 
  PropertyTemplate,
  InspectionReport, 
  Room, 
  InspectionItem, 
  PhotoMetadata,
  SyncStatus,
  Tenant,
  Organization,
  Agency
} from '@/types';

export interface LocalMutation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'user' | 'property' | 'template' | 'tenant' | 'inspection' | 'room' | 'item' | 'photo' | 'agency' | 'organization';
  entityId: string;
  data: any;
  timestamp: number;
}

/**
 * VestaDatabase - Base de données locale IndexedDB via Dexie.js
 * Structure miroir de la base de données PostgreSQL pour permettre le mode offline.
 */
export class VestaDatabase extends Dexie {
  users!: Table<User>;
  properties!: Table<Property>;
  templates!: Table<PropertyTemplate>;
  tenants!: Table<Tenant>;
  inspections!: Table<InspectionReport>;
  organizations!: Table<Organization>;
  agencies!: Table<Agency>;
  // Tables normalisées pour une gestion fine
  rooms!: Table<Room & { inspectionId: string }>;
  items!: Table<InspectionItem & { roomId: string }>;
  photos!: Table<PhotoMetadata & { itemId: string, blob?: Blob }>;
  mutationQueue!: Table<LocalMutation>;

  constructor() {
    super('VestaCheckDB');
    
    // Définition du schéma (seuls les index sont listés ici)
    this.version(4).stores({
      users: 'id, email, role, organizationId, agencyId',
      properties: 'id, ownerId, agentId, agencyId, organizationId, syncStatus',
      templates: 'id, propertyId, organizationId, syncStatus',
      tenants: 'id, *propertyIds, email, status, organizationId, agencyId, syncStatus',
      inspections: 'id, propertyId, inspectorId, tenantId, agencyId, organizationId, date, syncStatus',
      organizations: 'id, raisonSociale, siret',
      agencies: 'id, organizationId, name, type',
      rooms: 'id, inspectionId',
      items: 'id, roomId',
      photos: 'id, itemId, isSynced',
      mutationQueue: '++id, type, entity, entityId, timestamp'
    });
  }

  /**
   * Helper pour enregistrer une mutation dans la file d'attente
   */
  async enqueueMutation(mutation: Omit<LocalMutation, 'id' | 'timestamp'>) {
    return await this.mutationQueue.add({
      ...mutation,
      timestamp: Date.now()
    });
  }
}

export const db = new VestaDatabase();
