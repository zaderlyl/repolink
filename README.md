# Repolink

Un site pour trouver facilement des repos GitHub à ta portée et rencontrer des créateurs : recherche simplifiée, good first issues, profils et mise en relation entre débutants et développeurs expérimentés.

**Site en ligne : [zaderlyl.github.io/repolink](https://zaderlyl.github.io/repolink/)** · [Good first issues par langage](https://zaderlyl.github.io/repolink/good-first-issues/) · [Blog pour débuter en open source](https://zaderlyl.github.io/repolink/blog/)

## Ce que fait le site

- **Recherche** de repos avec des filtres simples : langages et topics (plusieurs à la fois), taille du projet (petits créateurs, populaires), langue.
- **Good first issues** : les issues accessibles aux débutants, filtrées par langage, avec une page par langage lisible par les moteurs de recherche.
- **Pépites à soutenir** sur l'accueil : des petits projets récents, encore peu connus, qui cherchent des contributeurs.
- **Explorer**, fiches de repo et profils de créateurs, mise en relation, favoris et page « Pour toi ».
- **Connexion avec GitHub** (lecture seule) pour passer de 60 à 5 000 requêtes par heure.
- **Blog** : des guides pour réussir sa première contribution open source.

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

## Connexion avec GitHub

La connexion utilise une OAuth App GitHub sans aucune permission. Le site est statique et ne peut pas garder le secret de l'application : un petit Worker Cloudflare (dossier [`worker/`](worker/README.md)) échange le code temporaire contre le jeton, et ne conserve rien. Le jeton reste dans le navigateur. Se connecter ne marche qu'en production, car une seule adresse de retour est enregistrée dans l'OAuth App.

## Stack

- [Astro](https://astro.build) : pages et composants
- [Tailwind CSS](https://tailwindcss.com) : styles
- API publique de GitHub : données des repos et des profils

## Structure

```
src/
  pages/        une page = une route (index.astro = l'accueil)
  layouts/      gabarits (en-tête, SEO, pages de contenu et blog)
  components/   navbar, footer et composants (ui/ = bouton, chip, carte-repo…)
  scripts/      code lancé dans le navigateur, un fichier par page
  lib/          logique (API GitHub, recherche, session, token, OAuth, cache)
  data/         listes (filtres, blog, langages) et JSON générés
  styles/       global.css : thème Tailwind (couleurs et polices Figma)
scripts/        préparation des données (npm run donnees)
tests/          tests (npm test)
worker/         Worker Cloudflare de la connexion
public/         fichiers servis tels quels (icônes, robots.txt, image de partage)
assets/         sources des images
.github/        workflow de déploiement, modèles d'issue et de pull request
```

Pour comprendre comment les pièces s'assemblent (déploiement, données, connexion, recherche), lis [docs/architecture.md](docs/architecture.md).

## Contribuer

Les contributions sont les bienvenues, surtout celles des débutants : lis le [guide de contribution](CONTRIBUTING.md) et le [code de conduite](CODE_OF_CONDUCT.md). Pour signaler une faille, voir [SECURITY.md](SECURITY.md).

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
