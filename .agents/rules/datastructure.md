---
trigger: always_on
---

# RÈGLE DU PROJET : STRUCTURE DE DONNÉES ÉTAT DES LIEUX

## 1. Autorité du Schéma
- Tous les composants UI et les fonctions de stockage doivent impérativement respecter les interfaces définies dans `types/index.ts`.
- Le fichier `datastructure.md` sert de référence architecturale et doit être maintenu en synchronisation avec le code source.

## 2. Modèles de Données (TypeScript)

### 2.1 Types de Base et Énumérations
```typescript
export type Condition = 'Neuf' | 'Très Bon' | 'Bon' | 'Usage' | 'Mauvais';
export type SyncStatus = 'synced' | 'pending' | 'error';
export type UserRole = 'Administrateur' | 'Agent' | 'Propriétaire';
```

### 2.2 Composants de l'Inspection
```typescript
export interface PhotoMetadata {
  id: string;
  compressedBase64: string; // Miniature pour le mode offline
  hasFullRes?: boolean;      // Présence de la version HD en local
  cloudUrl?: string;        // URL Cloudinary après synchro
  isSynced: boolean;
}

export interface InspectionItem {
  id: string;
  label: string; 
  condition: Condition;
  comment: string;
  photos: PhotoMetadata[];
}

export interface Room {
  id: string;
  name: string;
  items: InspectionItem[];
}

export interface SignatureMetadata {
  drawData?: string; // Base64 de la signature
  type: 'Local' | 'Distance' | 'Aucune';
  signedAt?: string;
}
```

### 2.3 Entités Principales

#### Propriété (Property)
```typescript
export interface Property {
  id: string;
  name: string;
  address: string;
  surface: number;
  type: 'Appartement' | 'Maison';
  roomCount: number;
  ownerId: string;
  agentId?: string;
  templateIds?: string[];
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}
```

#### Modèle de Propriété (PropertyTemplate)
```typescript
export interface PropertyTemplate {
  id: string;
  name: string;
  propertyId: string;
  rooms: Room[];
  keyInventories?: { id: string; type: string; count: number }[];
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}
```

#### Rapport d'Inspection (InspectionReport)
```typescript
export interface InspectionReport {
  id: string;
  propertyId: string;
  propertyAddress: string;
  date: string;
  type: 'Entrée' | 'Sortie';
  ownerId: string;
  inspectorId: string;
  tenantId: string;
  
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
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}
```

#### Locataire (Tenant)
```typescript
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Actuel' | 'Sorti';
  propertyIds: string[];
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}
```

## 3. Gestion des Utilisateurs et Droits
- **Propriétaire :** Accès en lecture seule aux rapports liés à son `ownerId`.
- **Agent :** Création et modification des rapports liés à son `inspectorId` ou aux propriétés dont il est responsable.
- **Administrateur :** Accès total.

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agencyId?: string;
  serverVersion: number;
  lastModified: string;
  syncStatus: SyncStatus;
}
```
