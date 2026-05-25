---
trigger: always_on
---

# TESTS ET VALIDATION POST-MODIFICATION

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


# Protocole de Validation en Réel et Auto-Correction (Next.js)

## 1. Objectif du Test de Validation Réel
Après chaque développement ou modification majeure (notamment sur des fonctionnalités critiques comme la génération de rapports ou la signature), l'agent doit valider le comportement de l'application en conditions réelles. Il ne doit pas se contenter de tests unitaires, mais exécuter un parcours utilisateur de bout en bout dans un vrai navigateur pour intercepter les erreurs d'exécution (Runtime), de rendu ou de route.

## 2. Infrastructure de Test Recommandée
Pour mimer le comportement humain, l'agent doit s'appuyer sur l'écosystème suivant :
- **Pilote de Navigation** : Playwright (ou Puppeteer) configuré sur la session locale.
- **Analyse d'Erreurs** : Capture systématique des `page.on('pageerror')` (unhandled exceptions) et des logs `console.error` du navigateur.
- **Validation Visuelle** : Prise de captures d'écran (Screenshots) aux étapes clés du parcours pour détecter les blocages visuels ou applicatifs via vision/OCR.

## 3. Déroulement du Cycle de Validation (Pipeline Agent)

L'agent doit suivre scrupuleusement ce workflow de validation de manière autonome :
[Build & Lancement Dev] ➔ [Exécution du Script Playwright] ➔ [Analyse Logs/Screenshots]
│
┌───────────────────────────────────────────────────────────────┘
▼
[Erreur Détectée ?]
│
├──► OUI ➔ [Analyse de l'erreur Next.js] ➔ [Correction du Code] ➔ (Boucle)
│
└──► NON ➔ [Validation du Ticket / Commit]
### Étape 3.1 : Préparation et Lancement
1. Lancer le serveur de développement Next.js ou exécuter un build de production :
```bash
   npm run build && npm run start
   # Ou en mode dev si la validation à chaud est requise :
   npm run dev
Attendre que le port local (ex: http://localhost:3000) soit totalement actif.

### Étape 3.2 : Simulation Humaine via Script
L'agent doit écrire ou dérouler un script d'automatisation simulant les actions clés de l'état des lieux :

Connexion (Bypass ou Mock de la session NextAuth.js v5).

Navigation vers le Dashboard ou le formulaire d'inspection.

Remplissage des champs, triggers de validation Zod/React Hook Form.

Déclenchement de l'action cible (ex: clic sur "Générer le PDF").

### Étape 3.3 : Détection Visuelle et Technique des Erreurs
L'agent doit valider l'absence d'anomalies en combinant deux sources :

Technique : Interception immédiate de tout crash de l'App Router (ex: écran d'erreur Next.js, composant qui throw, erreur 500 sur une Server Action).

Visuelle (OCR/Vision) : En cas de gel de l'interface (bouton inactif, spinner infini), l'agent doit réaliser un screenshot de la page et utiliser ses capacités d'analyse de vision ou d'OCR pour lire l'écran et repérer des mots-clés bloquants ("An error occurred", "Crash", "Undefined", "NaN").

### 4. Protocole d'Auto-Correction
Si une erreur Next.js (côté client ou serveur) est détectée durant la simulation :

Isolation : Capturer la stack trace complète (via les logs du terminal du serveur Next.js ou la console Playwright).

Diagnostic : Identifier si le problème provient d'un composant React 19 (ex: problème d'hydratation / SSR vs Client Component avec "use client"), d'un problème d'API Next.js 15, ou d'une mauvaise manipulation d'un flux binaire (ex: jsPDF).

Résolution : Modifier le code de manière autonome pour corriger l'anomalie.

Ré-exécution : Relancer immédiatement le cycle complet de validation à l'étape 3.1 jusqu'à l'obtention d'un parcours utilisateur 100% fluide et exempt d'erreurs.