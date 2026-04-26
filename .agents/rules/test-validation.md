---
trigger: always_on
---

# RÈGLE DU PROJET : TESTS ET VALIDATION POST-MODIFICATION

## 1. Intégrité de la Base de Données et des Schémas
Avant de valider toute modification impactant le modèle de données, l'agent doit s'assurer de :
- **Validation Zod** : Effectuer une vérification systématique via `InspectionReportSchema` dans `lib/validations/inspection.ts` pour garantir que les données produites sont valides.
- **Respect du Typage Strict** : Vérifier la conformité avec les interfaces définies dans `types/index.ts`, notamment pour les nouveaux champs de métadonnées et les identifiants de relations (`ownerId`, `inspectorId`, `agencyId`).
- **Hiérarchie Administrative** : Maintenir l'intégrité de la chaîne de dépendance : Organisation > Agence > Agent > Propriété > Inspection.

## 2. Non-régression des Features Existantes
Chaque mise à jour doit préserver les piliers fonctionnels suivants :
- **Gestion de l'État (Zustand)** : S'assurer que les actions du store (`updateItem`, `addPhoto`) dans `store/useInspectionStore.ts` ne créent pas d'effets de bord sur le reste du rapport.
- **Mode Offline & Persistance** : Garantir que la logique de sauvegarde locale (`saveOffline`) reste fonctionnelle pour l'usage sur le terrain.
- **Signatures Numériques** : Valider que les métadonnées de signature (`SignatureMetadata`) incluent toujours le type, l'horodatage et les données de tracé.

## 3. Synchronisation en Temps Réel
L'agent doit vérifier les mécanismes de fluidité de l'interface :
- **Optimistic UI** : Les modifications doivent être visibles immédiatement dans l'interface avant la confirmation de synchronisation.
- **Statut des Médias** : Vérifier que le flag `isSynced` dans `PhotoMetadata` est correctement géré lors du passage du mode local (Base64) au mode distant (Cloud URL).

## 4. Vérification de Conformité à la Demande
Sur requête ou lors d'étapes critiques, l'agent doit valider :
- **Sécurité et Permissions** : Vérifier que les filtres basés sur les rôles (`Administrateur`, `Agent`, `Propriétaire`) sont appliqués sur les requêtes de données (fetch).
- **Composants ARIA** : S'assurer que les nouveaux éléments d'interface respectent les standards d'accessibilité pour une utilisation sur tablette.
- **Complétude Légale** : Garantir que les éléments requis (compteurs, inventaire de clés, observations) sont présents avant de permettre la finalisation du rapport (`isFinalized`).

## 5. Protocole de Test Recommandé
1. Analyser l'impact sur les types globaux.
2. Valider les données via les schémas Zod.
3. Simuler une modification dans le store Zustand.
4. Vérifier les restrictions d'accès selon le rôle de l'utilisateur.