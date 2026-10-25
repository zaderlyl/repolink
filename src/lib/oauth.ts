// Connexion avec GitHub (OAuth) : le site envoie la personne sur GitHub, qui la renvoie avec un « code » ;
// le Worker Cloudflare (dossier worker/) échange ce code contre un token, car le secret de l'OAuth App ne peut pas vivre dans un site statique.
// Ces fonctions ne touchent pas à la page : le stockage et le réseau sont passés en paramètres, ce qui permet de les tester seules.

// Publics : l'identifiant de l'OAuth App et l'adresse du Worker n'ont rien de secret
export const CLIENT_ID = 'Ov23liUhPBtbxKpy3Okx';
export const ADRESSE_WORKER = 'https://repolink-auth.devtober-lilian.workers.dev';

// `state` : un nombre aléatoire gardé le temps de l'aller-retour sur GitHub, pour refuser un retour qui ne vient pas de nous
export const CLE_ETAT = 'repolink:etat-oauth';

export type StockageEtat = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function genererEtat(): string {
	const octets = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');
}

// Pas de « redirect_uri » : GitHub renvoie vers l'adresse enregistrée dans l'OAuth App. Pas de « scope » : lecture seule.
export const adresseAutorisation = (etat: string) =>
	`https://github.com/login/oauth/authorize?${new URLSearchParams({ client_id: CLIENT_ID, state: etat })}`;

// Renvoie false si le navigateur refuse d'écrire : sans `state` gardé, on ne pourrait pas vérifier le retour
export function garderEtat(stockage: StockageEtat | null, etat: string): boolean {
	try {
		if (!stockage) return false;
		stockage.setItem(CLE_ETAT, etat);
		return true;
	} catch {
		return false;
	}
}

// Le `state` ne sert qu'une fois : on le lit puis on l'efface
export function reprendreEtat(stockage: StockageEtat | null): string | null {
	try {
		const etat = stockage?.getItem(CLE_ETAT) ?? null;
		stockage?.removeItem(CLE_ETAT);
		return etat;
	} catch {
		return null;
	}
}

export type RetourGithub =
	| { type: 'code'; code: string; etat: string }
	| { type: 'refus' } // la personne a cliqué sur « Annuler » chez GitHub
	| { type: 'aucun' }; // adresse sans retour de GitHub (page ouverte directement)

const FORME_CODE = /^[\w-]{10,64}$/;

export function lireRetour(parametres: URLSearchParams): RetourGithub {
	if (parametres.get('error')) return { type: 'refus' };
	const code = parametres.get('code') ?? '';
	const etat = parametres.get('state') ?? '';
	if (!code || !FORME_CODE.test(code) || !etat) return { type: 'aucun' };
	return { type: 'code', code, etat };
}

// Comparaison exacte : un `state` absent ou différent est refusé
export const etatValide = (recu: string, attendu: string | null) => attendu !== null && attendu !== '' && recu === attendu;

export class ErreurConnexion extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ErreurConnexion';
	}
}

// Demande le token au Worker ; `appeler` est `fetch` dans le navigateur
export async function echangerCode(code: string, appeler: typeof fetch = fetch): Promise<string> {
	let reponse: Response;
	try {
		reponse = await appeler(ADRESSE_WORKER, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code }),
		});
	} catch {
		throw new ErreurConnexion('Impossible de joindre le service de connexion. Vérifie ta connexion et réessaie.');
	}
	const donnees: unknown = await reponse.json().catch(() => null);
	const token = donnees && typeof donnees === 'object' ? (donnees as Record<string, unknown>).access_token : null;
	if (!reponse.ok || typeof token !== 'string') {
		throw new ErreurConnexion('GitHub a refusé la connexion (le code a expiré ou a déjà servi). Réessaie.');
	}
	return token;
}
