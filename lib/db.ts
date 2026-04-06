import Dexie, { type Table } from 'dexie';
import { 
  User, 
  Property, 
  PropertyTemplate,
  InspectionReport, 
  Room, 
  InspectionItem, 
  PhotoMetadata,
  SyncStatus 
} from '@/types';

export interface LocalMutation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'user' | 'property' | 'inspection' | 'room' | 'item' | 'photo';
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
  inspections!: Table<InspectionReport>;
  // Tables normalisées pour une gestion fine
  rooms!: Table<Room & { inspectionId: string }>;
  items!: Table<InspectionItem & { roomId: string }>;
  photos!: Table<PhotoMetadata & { itemId: string, blob?: Blob }>;
  mutationQueue!: Table<LocalMutation>;

  constructor() {
    super('VestaCheckDB');
    
    // Définition du schéma (seuls les index sont listés ici)
    this.version(1).stores({
      users: 'id, email, role',
      properties: 'id, ownerId, agentId, syncStatus',
      templates: 'id, propertyId, syncStatus',
      inspections: 'id, propertyId, inspectorId, date, syncStatus',
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
