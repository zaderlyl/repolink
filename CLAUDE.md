# Repolink

Site pour trouver des repos GitHub à sa portée et rencontrer des créateurs (recherche, good first issues, profils, mise en relation).

## Lancer le projet
```bash
npm install
npm run dev
```
URL : http://localhost:4321

## Structure
```
src/
  pages/    une page = une route (index.astro = l'accueil)
  styles/   global.css : thème Tailwind (couleurs et polices Figma)
assets/     images et polices
public/     fichiers servis tels quels (favicon)
README.md
```

## Stack
- Astro (pages et composants), Tailwind CSS (styles), API publique de GitHub (données).
- Couleurs et polices : variables de la collection Figma « Repolink » (fond, panneau, bordure, texte, accents, boutons). Titres en Space Grotesk, texte en Inter.

## Conventions
- kebab-case pour les fichiers, commentaires en français.
- Garder cette même organisation sur tous mes projets.
- Une branche par fonctionnalité, jamais de code directement sur `main`.
- Commits au format `type: Message en français` (chore, feat, fix, docs, refactor, style).
- Jamais de clé API ni de token dans git (voir `.env` dans `.gitignore`).
