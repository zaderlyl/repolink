# Repolink

Un site pour trouver facilement des repos GitHub à ta portée et rencontrer des créateurs : recherche simplifiée, good first issues, profils et mise en relation entre débutants et développeurs expérimentés.

## Lancer le projet

```bash
npm install
npm run dev
```

URL : http://localhost:4321/repolink/

## Tests

```bash
npm test
```

Les tests sont dans `tests/` (connexion, Worker, recherche, filtres). Ils tournent avec l'outil intégré de Node, sans internet ni token, et le workflow de déploiement les lance avant la construction : un test qui échoue bloque la mise en ligne.

## Données de l'accueil (token GitHub)

L'accueil affiche de vrais repos, issues et profils, et la page Explorer de vrais nombres de repos, récupérés avec l'API de GitHub. Sans token, le site se construit quand même avec des données d'exemple.

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

Cela écrit `src/data/accueil.json`, `src/data/explorer.json` et `src/data/langages.json` (environ 2 minutes 30, car GitHub limite les recherches). Le fichier `.env` et ces JSON sont ignorés par git : le token ne doit jamais être commité.

Sur GitHub Pages, le workflow `.github/workflows/deploiement.yml` lance `npm run donnees` avant chaque construction, à chaque push sur `main` et chaque jour à 5 h UTC. Il utilise le token fourni par GitHub Actions : rien à configurer.

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

## Licence

Le code est publié sous licence [MIT](LICENSE). Les textes du blog sont ceux de l'équipe Repolink.
