# Worker de connexion GitHub

Petite fonction Cloudflare (gratuite) qui échange le code de la connexion GitHub contre un token : le site est statique et ne peut pas garder le secret de l'OAuth App. Le token est renvoyé au site, jamais conservé ici.

## Déployer (une seule fois)

```bash
cd worker
npx wrangler login
npx wrangler secret put CLIENT_SECRET   # colle le secret de l'OAuth App quand il le demande
npx wrangler deploy
```

`wrangler deploy` affiche l'adresse du Worker (`https://repolink-auth.<ton-compte>.workers.dev`) : le site l'utilisera à l'étape suivante.

## Réglages

- `CLIENT_ID` (public) : dans `wrangler.toml`.
- `CLIENT_SECRET` : secret Cloudflare, jamais dans git.
- Origines autorisées : `https://zaderlyl.github.io` et `http://localhost:4321` (dans `index.js`).
