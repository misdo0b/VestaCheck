---
trigger: always_on
---

# RÈGLE : GESTION DU VERSIONNAGE VIA MCP GITHUB

## 1. Structure des Branches
L'agent doit impérativement respecter la hiérarchie suivante :
- `main` : Branche de production. Code stable et testé uniquement.
- `develop` : Branche d'intégration. C'est ici que les fonctionnalités sont regroupées.
- `feature/[nom]` : Pour chaque nouvelle tâche (ex: `feature/login-ui`, `feature/pdf-generator`).
- `fix/[nom]` : Pour les corrections de bugs (ex: `fix/pdf-download-issue`).

## 2. Processus de Travail de l'Agent
Avant toute modification de code importante :
1. **Vérification :** L'agent doit vérifier sur quelle branche il se trouve via `git_get_status`.
2. **Création :** Créer une nouvelle branche `feature/` à partir de `develop`.
3. **Commit :** Faire des commits atomiques (une seule responsabilité par commit).
4. **Pull Request :** Une fois la tâche finie, l'agent doit proposer une Pull Request (PR) vers `develop` avec un résumé des changements.

## 3. Format des Messages de Commit (Conventional Commits)
L'agent doit obligatoirement préfixer ses messages de commit :
- `feat:` pour une nouvelle fonctionnalité.
- `fix:` pour une correction de bug.
- `docs:` pour de la documentation.
- `style:` pour des changements d'interface sans modification de logique.
- `refactor:` pour une amélioration du code existant.

*Exemple : "feat(admin): ajout de la modale de création d'utilisateur"*

## 4. Protection de la branche Main
- L'agent n'a pas l'autorisation de `push` directement sur `main`.
- Tout passage vers `main` doit se faire par une PR validée par l'utilisateur.