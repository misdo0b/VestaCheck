export type Condition = 'Neuf' | 'Très Bon' | 'Bon' | 'Usage' | 'Mauvais';

export interface InspectionItem {
  id: string;
  label: string; 
  condition: Condition;
  comment: string;
  photos: PhotoMetadata[]; // Nouveau format avec métadonnées
}

export interface PhotoMetadata {
  id: string;
  compressedBase64: string; // Version miniature pour le mode offline (RAM)
  hasFullRes?: boolean;      // Indique si la version HD est dans IndexedDB
  cloudUrl?: string;        // URL distante après synchro
  isSynced: boolean;
}

export interface Room {
  id: string;
  name: string;
  items: InspectionItem[];
}

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface Property {
  id: string;
  name: string;
  address: string;
  surface: number;
  type: 'Appartement' | 'Maison';
  roomCount: number;
  ownerId: string;
  agentId?: string; // ID de l'agent responsable
  templateIds?: string[];
  
  // Champs de synchronisation
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}

export interface PropertyTemplate {
  id: string;
  name: string;
  propertyId: string;
  rooms: Room[];
  keyInventories?: { id: string; type: string; count: number }[];
  
  // Champs de synchronisation
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}

export interface SignatureMetadata {
  drawData?: string; // Base64 signature
  type: 'Local' | 'Distance' | 'Aucune';
  signedAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Actuel' | 'Sorti';
  propertyIds: string[];
  
  // Champs de synchronisation
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}

export interface InspectionReport {
  id: string;
  propertyId: string; // Lien avec l'entité Property
  propertyAddress: string;
  date: string;
  type: 'Entrée' | 'Sortie';
  
  // Nouveaux champs d'identification
  ownerId: string;           // ID du propriétaire du logement
  inspectorId: string;       // ID de la personne qui réalise l'état des lieux
  tenantId: string;          // Référence à l'entité Tenant
  
  // Éléments de conformité légale
  counters: {
    water: number;
    electricity: number;
    gas?: number;
  };
  keyInventories: { id: string; type: string; count: number }[];
  generalObservations: string;

  signatures: {
    tenant: SignatureMetadata;
    inspector: SignatureMetadata;
  };

  rooms: Room[];
  isFinalized: boolean;

  // Champs de synchronisation
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}

export type UserRole = 'Administrateur' | 'Agent' | 'Propriétaire';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optionnel pour les transferts client, requis pour l'auth
  role: UserRole;
  agencyId?: string; // Pour regrouper des agents par agence
  
  // Champs de synchronisation
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}
