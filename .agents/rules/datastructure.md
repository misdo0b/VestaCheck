---
trigger: always_on
---

# RÈGLE DU PROJET : STRUCTURE DE DONNÉES ÉTAT DES LIEUX

## 1. Autorité du Schéma
- Tous les composants UI et les fonctions de stockage doivent impérativement respecter l'interface TypeScript `InspectionReport`.
- Aucune modification de la structure des données (ajout de champ, changement de type) ne doit être faite sans validation explicite de l'utilisateur.

## 2. Modèle de Référence (TypeScript)
```typescript
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

// Mise à jour du rapport pour inclure les acteurs
export interface InspectionReport {
  id: string;
  propertyAddress: string;
  date: string;
  type: 'Entrée' | 'Sortie';
  
  // Nouveaux champs d'identification
  ownerId: string;           // ID du propriétaire du logement
  inspectorId: string;       // ID de la personne qui réalise l'état des lieux
  tenantName: string;        // Nom du locataire concerné
  
  rooms: Room[];
  isFinalized: boolean;
}

## 3. Gestion des Utilisateurs et Droits (Permissions)
- **Principe de Moindre Privilège :** Un utilisateur ne peut voir que les rapports auxquels il est lié.
- **Règles d'accès :**
    - `Administrateur` : Accès complet à tous les rapports de l'organisation.
    - `Agent` : Peut créer des rapports et voir uniquement ceux qu'il a réalisés (`inspectorId`).
    - `Propriétaire` : Accès en lecture seule uniquement aux rapports de ses propres logements (`ownerId`).
- **Sécurisation du Code :** Chaque fonction de récupération de données (fetch) doit inclure un filtre basé sur l'ID de l'utilisateur connecté.

// Définition des rôles
export type UserRole = 'Administrateur' | 'Agent' | 'Propriétaire';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  agencyId?: string; // Pour regrouper des agents par agence
}

