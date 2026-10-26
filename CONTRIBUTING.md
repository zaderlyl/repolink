# Contribuer à Repolink

Merci de vouloir aider ! Repolink est un projet pour les débutants, et il est aussi ouvert aux débutants : une faute corrigée ou une petite amélioration comptent autant qu'une grosse fonctionnalité. Si c'est ta première contribution, le guide [Comment faire sa première contribution open source](https://zaderlyl.github.io/repolink/blog/premiere-contribution-open-source/) explique chaque étape.

## Avant de commencer

1. Regarde les [issues ouvertes](https://github.com/zaderlyl/repolink/issues) : celles qui portent le label `good first issue` sont les plus accessibles.
2. Laisse un commentaire sur l'issue pour dire que tu t'en occupes, et attends une réponse avant de te lancer.
3. Pour une idée ou un bug qui n'a pas d'issue, ouvres-en une d'abord : on en discute avant que tu travailles pour rien.

## Installer le projet

Il faut [Node.js](https://nodejs.org/) 22 ou plus récent.

```bash
git clone https://github.com/TON-PSEUDO/repolink.git
cd repolink
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:4321/repolink/.

Les repos, issues et profils de l'accueil viennent de l'API de GitHub. Sans configuration, le site se construit avec des données d'exemple, ce qui suffit pour presque tout. Pour avoir de vraies données, le [README](README.md) explique comment créer un fichier `.env` avec un token en lecture seule.

## Vérifier ton travail

Avant d'ouvrir une pull request, lance :

```bash
npm run verifier
npm test
npm run build
```

- `npm run verifier` contrôle les types.
- `npm test` lance les tests du dossier `tests/` (sans internet). Si tu touches à de la logique, ajoute un fichier `tests/<sujet>.test.ts`.
- `npm run build` construit le site, comme le fait le déploiement.

Si l'un d'eux échoue, la pull request ne sera pas déployée.

## Branches

Ne travaille jamais directement sur `main` : crée une branche par sujet, avec un préfixe qui dit ce qu'elle contient.

| Préfixe | Usage | Exemple |
|---|---|---|
| `feature/` | Une fonctionnalité | `feature/pepites-accueil` |
| `fix/` | Corriger un bug | `fix/lien-casse-blog` |
| `docs/` | Documentation, textes, blog | `docs/guide-readme` |
| `refactor/` | Réorganiser sans changer le comportement | `refactor/constantes` |
| `test/` | Ajouter ou corriger des tests | `test/recherche` |
| `chore/` | Configuration, outillage | `chore/mise-a-jour-node` |

## Messages de commit

Format : `type: Message en français` (le type collé aux deux-points, une phrase qui commence par un verbe).

| Type | Usage | Exemple |
|---|---|---|
| `feat` | Nouvelle fonctionnalité | `feat: Ajoute le filtre par langue` |
| `fix` | Correction d'un bug | `fix: Corrige le lien cassé de l'accueil` |
| `docs` | Documentation, textes | `docs: Met à jour la page Cookies` |
| `test` | Tests | `test: Ajoute les tests de recherche` |
| `refactor` | Réorganiser sans changer le comportement | `refactor: Déplace les filtres dans un module` |
| `style` | Mise en forme uniquement | `style: Corrige l'indentation` |
| `chore` | Configuration, outillage | `chore: Met à jour les actions du workflow` |

Un commit = une idée, avec un message précis (pas « modifs » ni « fix »).

## Ouvrir la pull request

- Ouvre-la vers `main`, avec un titre qui reprend le format des commits.
- Explique ce que tu as changé et pourquoi, et ce que tu as vérifié.
- Ajoute `Closes #12` (avec le numéro de l'issue) pour fermer l'issue quand la pull request est fusionnée.
- Reste dans le sujet de l'issue : un petit changement bien fait est relu plus vite qu'un gros.

Un mainteneur te répondra, avec peut-être des remarques : c'est normal, corrige sur la même branche et la pull request se met à jour toute seule.

## Ce qu'il ne faut jamais committer

- Un token, une clé d'API, un mot de passe, un fichier `.env`. Si tu en as publié un par erreur, considère-le comme compromis : révoque-le, puis préviens-nous (voir [SECURITY.md](SECURITY.md)).
- Des fichiers sans rapport avec le projet.

## Conduite

Ce projet suit un [code de conduite](CODE_OF_CONDUCT.md). En participant, tu t'engages à le respecter.

## Une question ?

Ouvre une [issue](https://github.com/zaderlyl/repolink/issues) avec ta question : il n'y a pas de question bête.
