# Politique de sécurité

Repolink est un projet étudiant, sans équipe dédiée à la sécurité : on fait de notre mieux, sans garantie. Si tu trouves une faille, merci de nous la signaler de façon responsable.

## Signaler une faille

**Ne publie pas la faille dans une issue ni dans une pull request.** Utilise le signalement privé de GitHub :

1. Va sur l'onglet [Security](https://github.com/zaderlyl/repolink/security) du dépôt.
2. Clique sur « Report a vulnerability ».
3. Décris ce que tu as trouvé, comment le reproduire et l'effet possible.

Nous répondons en général sous quelques jours. Dis-nous si tu souhaites être cité quand la faille est corrigée.

## Ce qui est concerné

- Le site : https://zaderlyl.github.io/repolink/
- Le code de ce dépôt, y compris la connexion avec GitHub et le Worker Cloudflare (dossier `worker/`).

Exemples utiles à signaler : une faille XSS, un moyen de récupérer le jeton d'une autre personne, un contournement des origines autorisées du Worker, un secret oublié dans l'historique du dépôt.

Ne sont pas concernés : les failles de GitHub ou de Cloudflare eux-mêmes (signale-les à ces services), les limites de requêtes de l'API de GitHub, et les attaques qui demandent d'avoir déjà accès à l'ordinateur de la victime.

## Comment le projet protège tes données

- **Pas de serveur ni de base de données** : ce que tu fais sur le site reste dans ton navigateur.
- **Connexion avec GitHub** : Repolink demande un jeton en lecture seule, sans aucune permission particulière. Il ne peut ni modifier tes repos ni voir tes repos privés.
- **Le secret de l'application GitHub** est stocké uniquement chez Cloudflare, jamais dans le dépôt. Le Worker échange le code temporaire contre le jeton et ne conserve rien.
- **Le jeton** est gardé dans ton navigateur et envoyé seulement à l'API de GitHub.
- Le Worker n'accepte que les requêtes venant du site et du serveur de développement local.

## Si tu penses que ton jeton a fuité

Tu peux le révoquer à tout moment dans tes réglages GitHub : [Settings → Applications](https://github.com/settings/applications). Il suffira de te reconnecter. « Se déconnecter » dans les paramètres de Repolink efface aussi le jeton de ton navigateur.

## Si tu as publié un secret par erreur dans le dépôt

Considère-le comme compromis : révoque-le tout de suite chez le service concerné, puis préviens-nous par le signalement privé ci-dessus.

## Versions concernées

Seule la version en ligne, c'est-à-dire la branche `main`, est maintenue.
