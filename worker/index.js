// Worker Cloudflare : échange le « code » de la connexion GitHub contre un token.
// Le site est statique et ne peut pas garder le secret de l'OAuth App : il reste ici, côté Cloudflare.
// Réglages (voir worker/README.md) : CLIENT_ID dans wrangler.toml, CLIENT_SECRET en secret Cloudflare.
const ORIGINES_AUTORISEES = ['https://zaderlyl.github.io', 'http://localhost:4321'];

function reponse(corps, statut, origine) {
	// Un statut 204 n'a pas de contenu : y mettre un corps fait planter Response (la requête préliminaire CORS échouait)
	return new Response(statut === 204 ? null : JSON.stringify(corps), {
		status: statut,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': origine,
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			Vary: 'Origin',
		},
	});
}

export default {
	async fetch(requete, env) {
		const origine = requete.headers.get('Origin') ?? '';
		// Seuls le site et le serveur de développement peuvent appeler ce Worker
		if (!ORIGINES_AUTORISEES.includes(origine)) return new Response('Origine refusée', { status: 403 });
		if (requete.method === 'OPTIONS') return reponse({}, 204, origine);
		if (requete.method !== 'POST') return reponse({ erreur: 'Méthode non autorisée' }, 405, origine);

		let code = '';
		try {
			({ code } = await requete.json());
		} catch {
			return reponse({ erreur: 'Requête invalide' }, 400, origine);
		}
		if (typeof code !== 'string' || !/^[\w-]{10,64}$/.test(code)) return reponse({ erreur: 'Code invalide' }, 400, origine);

		const github = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, code }),
		});
		const donnees = await github.json().catch(() => ({}));
		// Le token est renvoyé au site et jamais gardé ici
		if (!donnees.access_token) return reponse({ erreur: 'GitHub a refusé le code' }, 400, origine);
		return reponse({ access_token: donnees.access_token }, 200, origine);
	},
};
