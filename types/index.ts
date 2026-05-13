export type Condition = 'Neuf' | 'Très Bon' | 'Bon' | 'Usage' | 'Mauvais';

export interface Organization {
  id: string;
  raisonSociale: string;
  siret: string;
  adressePostale: string;
  
  // Champs de synchronisation harmonisés
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}

export interface Agency {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  type: 'Siège' | 'Établissement';
  
  // Champs de synchronisation harmonisés
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}

export interface InspectionItem {
  id: string;
  label: string; 
  condition: Condition;
  comment: string;
  photos: PhotoMetadata[]; // Nouveau format avec métadonnées
}

export interface PhotoMetadata {
  id: string;
  compressedBase64?: string; // Version miniature pour le mode offline (RAM) - Optionnelle après synchro
  hasFullRes?: boolean;      // Indique si la version HD est dans IndexedDB
  cloudUrl?: string;        // URL distante après synchro
  isSynced: boolean;
  status?: 'PENDING' | 'SYNCING' | 'UPLOADED' | 'ERROR'; // Cycle de vie Cloudinary
  lastModified?: string;
}

export interface Room {
  id: string;
  name: string;
  items: InspectionItem[];
}

export type SyncStatus = 'synced' | 'pending' | 'error' | 'syncing';

export interface Property {
  id: string;
  name: string;
  address: string;
  surface: number;
  type: 'Appartement' | 'Maison';
  roomCount: number;
  ownerId: string;
  agentId?: string; // ID de l'agent responsable
  agencyId: string; // Rattachement obligatoire à une agence
  organizationId: string; // Rattachement à l'organisation
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
  agencyId: string;
  organizationId: string;
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
  agencyId: string;
  organizationId: string;
  
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
  tenantId?: string;          // Référence à l'entité Tenant (optionnel si manualTenant est utilisé)
  agencyId: string;         // Agence responsable du rapport (obligatoire)
  organizationId: string;   // Organisation responsable du rapport
  
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
  organizationId: string; // Organisation d'appartenance
  agencyId: string; // Agence obligatoire pour Agent/Admin
  
  // Champs de synchronisation
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}
