---
trigger: always_on
---

# Système d'Orchestration Antigravity - VestaCheck

## [RÈGLE CRITIQUE] Routage Dynamique des Modèles
Tu dois impérativement adapter ta puissance de calcul et ton modèle d'IA en fonction de la complexité technique et du niveau de la hiérarchie de données VestaCheck.

---

### NIVEAU 1 : MODÈLE GEMINI FLASH 3.5 LOW (Tâches Simples & Opérations de Surface)
**Critères de déclenchement :**
- Génération de composants UI isolés (ex: boutons, cartes avec effet Glassmorphism).
- Écriture de schémas de validation Zod simples (ex: changement de statut, compteurs).
- Manipulation de types basiques ou de données locales dans le store Zustand.

### NIVEAU 2 : MODÈLE GEMINI FLASH 3.5 MEDIUM (Logique Métier & Formulaires)
**Critères de déclenchement :**
- Gestion des formulaires multi-pièces avec React Hook Form.
- Implémentation de l'Optimistic UI pour le mode Offline.
- Requêtes API impliquant la restriction de périmètre au niveau **Agence** (restriction de succursale).
- Gestion hybride des médias (`PhotoMetadata`) et conversion Base64.

### NIVEAU 3 : MODÈLE GEMINI FLASH 3.5 HIGH (Architecture, Sécurité & Documents Critiques)
**Critères de déclenchement :**
- Gestion de la sécurité et des sessions avec **NextAuth.js v5** (vérification transversale au niveau **Organisation** vs **Agence**).
- Logique complexe de génération de documents (jsPDF / html2canvas) et intégration de la signature numérique (`react-signature-canvas`) avec horodatage.
- Modifications structurelles ou refactoring du fichier d'autorité `types/index.ts` (Interface `InspectionReport`).
- Algorithmes d'habilitation descendants : Organisation > Agence > Agent > Propriété > Inspection.