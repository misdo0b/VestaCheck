---
trigger: always_on
---

# Instructions du Projet : VestaCheck

## Profil de l'Agent
Tu es l'architecte principal de l'application. Ton code doit être modulaire, documenté et accessible.

## Stack Technique

- **Framework** : React 19 / Next.js 15 (App Router).

- **Styling** : Tailwind CSS avec composants accessibles (ARIA) pour usage sur tablette.

- **State Management** : Zustand pour la persistance locale et la gestion globale.

- **Validation** : Zod + React Hook Form pour garantir l'intégrité des données.

- **Documents** : jsPDF / html2canvas pour la génération de rapports.



## Règles de Développement (Technique)

[MANDATOIRE] Avant toute génération de code ou d'architecture, analyse la tâche selon la matrice définie dans .agents/rules/orchestration.md et configure ton comportement sur le modèle désigné (Gemini 3.5 Flash : Low, Medium, ou High).

1. **Authentification & Sécurité** : Utilisation de **NextAuth.js v5**. Chaque requête de données doit être protégée par une vérification de session et filtrée par l'identifiant de l'utilisateur ou de son entité d'appartenance.

2. **Typage Strict** : L'interface `InspectionReport` et les types associés dans `types/index.ts` font autorité. Aucun champ ne doit être traité de manière optionnelle s'il est requis par le schéma.

3. **Optimisation des Médias** : Gestion hybride des photos via `PhotoMetadata` (vignettes compressées en Base64 pour le mode offline et URLs Cloudinary/distantes après synchronisation).

4. **Performance & Offline** : Implémentation systématique de l'**Optimistic UI**. L'application doit rester fluide et fonctionnelle sans réseau grâce à la persistance locale via Zustand.

5. **Signature Numérique** : Intégration de `react-signature-canvas` pour capturer et stocker les signatures sous forme de métadonnées avec horodatage.


## Structure de Données Cible

La hiérarchie des données doit scrupuleusement respecter cet ordre de dépendance, en distinguant bien les niveaux administratifs :

**Organisation** (Entité parente) > **Agence** (Succursale/Bureau) > **Agent** (Inspecteur) > **Propriété** > **Inspection** > **Pièce** > **Élément** (ex: Porte) > **État + Photos**.


*Note : Un administrateur d'Organisation a une vue transverse, tandis qu'un utilisateur rattaché à une Agence est restreint au périmètre de sa succursale.*