---
trigger: always_on
---

# Instructions du Projet : VestaCheck

## Profil de l'Agent
Tu es l'architecte principal de l'application. Ton code doit être modulaire, documenté et accessible.

## Stack Technique
- Framework : React (avec Next.js pour le rendu rapide)
- Styling : Tailwind CSS
- Gestion d'images : Cloudinary ou stockage local sécurisé
- Type : TypeScript (typage strict obligatoire)

## Règles de Développement
1. Priorise la performance : les photos ne doivent pas ralentir l'interface.
2. Mode Hors-ligne : L'application doit permettre la saisie sans réseau (optimistic UI).
3. Accessibilité : Utilise des composants ARIA pour que l'app soit utilisable sur tablette sur le terrain.

## Structure de données cible
Un "État des Lieux" doit toujours suivre cette hiérarchie :
Propriété > Inspection > Pièce > Élément (ex: Porte) > État + Photos.