export type Condition = 'Neuf' | 'Très Bon' | 'Bon' | 'Usage' | 'Mauvais';

export interface InspectionItem {
  id: string;
  label: string; 
  condition: Condition;
  comment: string;
  photos: string[]; // Tableau d'URLs ou base64
}

export interface Room {
  id: string;
  name: string;
  items: InspectionItem[];
}

export interface InspectionReport {
  id: string;
  propertyAddress: string;
  date: string;
  type: 'Entrée' | 'Sortie';
  
  // Nouveaux champs d'identification
  ownerId: string;           // ID du propriétaire du logement
  inspectorId: string;       // ID de la personne qui réalise l'état des lieux
  tenantName: string;        // Nom du locataire concerné
  
  // Éléments de conformité légale
  counters: {
    water: number;
    electricity: number;
    gas?: number;
  };
  keysCount: number;
  generalObservations: string;

  // Contact locataire
  tenantEmail: string;
  tenantPhone: string;

  rooms: Room[];
  isFinalized: boolean;
}

export type UserRole = 'Administrateur' | 'Agent' | 'Propriétaire';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agencyId?: string; // Pour regrouper des agents par agence
}
