# Repolink

Un site pour trouver facilement des repos GitHub à ta portée et rencontrer des créateurs : recherche simplifiée, good first issues, profils et mise en relation entre débutants et développeurs expérimentés.

## Lancer le projet

```bash
npm install
npm run dev
```

URL : http://localhost:4321

## Données de l'accueil (token GitHub)

L'accueil affiche de vrais repos, issues et profils récupérés avec l'API de GitHub. Sans token, le site se construit quand même avec des données d'exemple.

1. Créer un token sur GitHub : *Settings → Developer settings → Fine-grained tokens*, accès « Public repositories (read-only) », aucune permission.
2. Copier le modèle puis y coller le token :
   ```bash
   cp .env.example .env
   ```
   ```
   GITHUB_TOKEN=ton_token_ici
   ```
3. Lancer la préparation des données :
   ```bash
   npm run donnees
   ```

Cela écrit `src/data/accueil.json`. Le fichier `.env` et ce JSON sont ignorés par git : le token ne doit jamais être commité.

## Stack

- [Astro](https://astro.build) : pages et composants
- [Tailwind CSS](https://tailwindcss.com) : styles
- API publique de GitHub : données des repos et des profils

## Structure

```
src/
  pages/    une page = une route (index.astro = l'accueil)
  styles/   global.css : thème Tailwind (couleurs et polices Figma)
assets/     images et polices
public/     fichiers servis tels quels (favicon)
README.md
```

## Maquettes

- **Figma** : [wireframe github (copie)](https://www.figma.com/design/GJ2KMbxx5scYChiw6kxbUE)
  - section *Wireframes* : les wireframes en gris
  - sections *Site* et *Pages secondaires* : les 46 pages stylées, avec le prototype cliquable (mode Présentation)
  - section *Composants* : la bibliothèque (boutons, champs, cartes, liens…) avec leurs états (survol, focus, ouvert…)
  - variables de couleurs (collection « Repolink ») et styles de texte
- **FigJam** : [Arborescence Repolink](https://www.figma.com/board/2iw6Lsaaydt88pwBVmgYYk) : les 46 pages et les liens entre elles

Ces liens demandent un accès Figma.
