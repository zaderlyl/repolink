# Repolink

Site pour trouver des repos GitHub à sa portée et rencontrer des créateurs (recherche, good first issues, profils, mise en relation).

## Lancer le projet
```bash
npm install
npm run dev
```
URL : http://localhost:4321/repolink/

Données de l'accueil (API GitHub) : créer un fichier `.env` avec `GITHUB_TOKEN=…` (token fine-grained en lecture seule sur les repos publics), puis lancer `npm run donnees`. Cela écrit `src/data/accueil.json`, `src/data/explorer.json` et `src/data/langages.json` (les issues des pages `/good-first-issues/<langage>/`), ignorés par git.

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

## Maquettes (Figma)
- Pages, composants et prototype : https://www.figma.com/design/GJ2KMbxx5scYChiw6kxbUE (fichier « wireframe github (copie) »).
- Arborescence des 46 pages : https://www.figma.com/board/2iw6Lsaaydt88pwBVmgYYk
- Pour coder une page ou un composant, partir de la maquette correspondante (sections *Site*, *Pages secondaires* et *Composants*) et réutiliser les couleurs et polices du thème (`src/styles/global.css`).

## Conventions
- kebab-case pour les fichiers, commentaires en français.
- Garder cette même organisation sur tous mes projets.
- Une branche par fonctionnalité, jamais de code directement sur `main`.
- Commits au format `type: Message en français` (chore, feat, fix, docs, refactor, style).
- Jamais de clé API ni de token dans git (voir `.env` dans `.gitignore`).

## Idées pour plus tard
- **Filtres multiples** sur la Recherche et les Good first issues : pouvoir choisir plusieurs langages et/ou plusieurs topics en même temps (aujourd'hui un seul de chaque). Il faudra des paramètres répétés dans l'adresse (`?langage=Go&langage=Rust`), des pastilles cumulables et un test de la façon dont GitHub combine plusieurs `language:` (ET ou OU) dans une requête. Le code à faire évoluer : `src/lib/recherche.ts` (`lireFiltres`, `construireRequete`, `hrefRecherche`) et `src/scripts/recherche.ts` (pastilles).
