# Repolink

Site pour trouver des repos GitHub à sa portée et rencontrer des créateurs (recherche, good first issues, profils, mise en relation).

## Lancer le projet
```bash
npm install
npm run dev
```
URL : http://localhost:4321/repolink/

Tests : `npm test` (dossier `tests/`, outil de Node, sans internet). Le workflow les lance avant le build ; ajouter un fichier `tests/<sujet>.test.ts` quand on touche à de la logique.

Données de l'accueil (API GitHub) : créer un fichier `.env` avec `GITHUB_TOKEN=…` (token fine-grained en lecture seule sur les repos publics), puis lancer `npm run donnees`. Cela écrit `src/data/accueil.json`, `src/data/explorer.json` et `src/data/langages.json` (les issues des pages `/good-first-issues/<langage>/`), ignorés par git.

## Structure
```
src/
  pages/        une page = une route (index.astro = l'accueil)
  layouts/      layout.astro (en-tête, SEO) et article.astro (pages de contenu et blog)
  components/   navbar, footer, composants de page ; ui/ = composants de la maquette (bouton, chip, carte-repo…)
  scripts/      code lancé dans le navigateur, un fichier par page
  lib/          logique sans page (API GitHub, recherche, session, token, OAuth, cache) : testée dans tests/
  data/         listes (filtres, blog, langages) et données générées par « npm run donnees »
  styles/       global.css : thème Tailwind (couleurs et polices Figma)
scripts/        scripts Node de « npm run donnees » (préparent les JSON de src/data/)
tests/          tests (npm test)
worker/         Worker Cloudflare de la connexion GitHub
public/         fichiers servis tels quels (icônes, robots.txt, image de partage)
assets/         sources des images (ex. image-partage.svg)
.github/        workflow de déploiement, modèles d'issue et de pull request
```

## Stack
- Astro (pages et composants), Tailwind CSS (styles), API publique de GitHub (données).
- Couleurs et polices : variables de la collection Figma « Repolink » (fond, panneau, bordure, texte, accents, boutons). Titres en Space Grotesk, texte en Inter.

## Connexion avec GitHub
- OAuth App GitHub sans permission (lecture seule). Le site est statique : le secret de l'application ne peut pas y être gardé, donc `worker/` (Cloudflare Workers) échange le code temporaire contre le jeton. Le secret `CLIENT_SECRET` n'existe que chez Cloudflare (voir `worker/README.md`).
- Le jeton (`gho_…`) et la session sont dans le `localStorage` du navigateur (`src/lib/token.ts`, `session.ts`). Il sert à passer de 60 à 5 000 requêtes par heure.
- Se connecter ne marche qu'en production : une seule adresse de retour est enregistrée dans l'OAuth App.

## Données
- Accueil (repos à la une, issues, profils et « Pépites à soutenir »), Explorer et pages par langage : générés au build (`npm run donnees`, jeton du workflow). Chaque JSON est ignoré par git ; sans lui le site se construit quand même (données d'exemple, pages par langage sans liste d'issues, accueil sans pépites : cette section n'a pas de données factices et disparaît).
- Les pépites (petits projets récents avec une good first issue) sont choisies par `src/lib/pepites.ts`, testé dans `tests/pepites.test.ts`.
- Recherche, Good first issues, fiches repo et profils : appels à l'API de GitHub dans le navigateur, avec un cache d'une heure (`src/lib/cache.ts`).
- Le déploiement tourne à chaque push sur `main` et chaque jour à 5 h UTC (`.github/workflows/deploiement.yml`).

## Blog
- Les articles sont dans `src/data/blog.ts` (pas de CMS). Une section accepte des paragraphes, listes et blocs de code (`blocs`) ; `{base}` dans un lien devient `/repolink`.
- L'auteur reste « Équipe Repolink » tant qu'une personne n'a pas signé un article (données structurées dans `src/pages/blog/[slug].astro`).

## Maquettes (Figma)
- Pages, composants et prototype : https://www.figma.com/design/GJ2KMbxx5scYChiw6kxbUE (fichier « wireframe github (copie) »).
- Arborescence des 46 pages : https://www.figma.com/board/2iw6Lsaaydt88pwBVmgYYk
- Pour coder une page ou un composant, partir de la maquette correspondante (sections *Site*, *Pages secondaires* et *Composants*) et réutiliser les couleurs et polices du thème (`src/styles/global.css`).

## Conventions
- kebab-case pour les fichiers, commentaires en français.
- Garder cette même organisation sur tous mes projets.
- Une branche par fonctionnalité, jamais de code directement sur `main`.
- Commits au format `type: Message en français` (chore, feat, fix, docs, test, refactor, style).
- Jamais de clé API ni de token dans git (voir `.env` dans `.gitignore`).

## Feuille de route
Elle est dans les [issues GitHub](https://github.com/zaderlyl/repolink/issues), classées par labels (`feature`, `bug`, `seo`, `tests`…) et par priorité (`priorité: haute|moyenne|basse`). Les mentions légales à compléter (éditeur, contact) sont l'issue n°56.
