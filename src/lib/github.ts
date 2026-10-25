// Client de l'API publique de GitHub (https://docs.github.com/fr/rest).
// Sans token, GitHub accepte 60 requêtes par heure et par visiteur (10 par minute pour la recherche) :
// les réponses sont donc mises en cache 1 heure (src/lib/cache.ts).
// Deux tokens possibles : celui du build, passé par `options.token`, et celui, facultatif, que la personne a collé dans
// Paramètres (src/lib/token.ts) : il est lu dans son navigateur et donne 5000 requêtes par heure.
import { avecCache } from './cache.ts';
import { lireToken } from './token.ts';

const URL_API = 'https://api.github.com';

// Formes de réponse de GitHub, réduites aux champs dont Repolink a besoin.
// Elles sont converties vers les types de src/data/accueil.ts à l'étape 5.3.
export type ProprietaireGithub = {
	login: string;
	avatar_url: string;
	type: 'User' | 'Organization';
};

export type RepoGithub = {
	full_name: string; // « proprietaire/repo »
	html_url: string;
	description: string | null;
	language: string | null;
	stargazers_count: number;
	open_issues_count: number;
	topics?: string[];
	updated_at: string; // date ISO
	owner: ProprietaireGithub;
	// Présents seulement dans la réponse d'un repo seul (pas dans les résultats de recherche)
	forks_count?: number;
	subscribers_count?: number; // les « watchers » affichés par GitHub
	private?: boolean;
	fork?: boolean;
};

export type ContributeurGithub = {
	login: string;
	avatar_url: string;
	html_url: string;
	contributions: number;
};

// Octets de code par langage : { JavaScript: 12000, CSS: 3000 }
export type LangagesGithub = Record<string, number>;

export type EvenementGithub = {
	type: string;
	created_at: string; // date ISO
};

export type IssueGithub = {
	title: string;
	html_url: string;
	repository_url: string; // « https://api.github.com/repos/proprietaire/repo »
	state: 'open' | 'closed';
	created_at: string;
	labels: { name: string }[];
};

export type UtilisateurGithub = {
	login: string;
	name: string | null;
	bio: string | null;
	avatar_url: string;
	html_url: string;
	followers: number;
	public_repos: number;
};

export type ResultatRecherche<T> = {
	total_count: number;
	incomplete_results: boolean;
	items: T[];
};

export type OptionsRecherche = {
	tri?: 'stars' | 'updated' | 'help-wanted-issues';
	ordre?: 'asc' | 'desc';
	page?: number;
	parPage?: number;
	token?: string;
};

type TypeErreur = 'reseau' | 'limite' | 'introuvable' | 'jeton' | 'autre';

// Erreur lisible par les pages : `type` dit quoi afficher, `reinitialisation` dit quand réessayer.
export class ErreurGithub extends Error {
	type: TypeErreur;
	statut: number | null;
	reinitialisation: Date | null;

	constructor(type: TypeErreur, message: string, statut: number | null = null, reinitialisation: Date | null = null) {
		super(message);
		this.name = 'ErreurGithub';
		this.type = type;
		this.statut = statut;
		this.reinitialisation = reinitialisation;
	}
}

// Appel générique : renvoie le JSON ou lève une ErreurGithub.
// Avec le token du build, la réponse est toujours fraîche. Sinon elle passe par le cache, avec le token de la personne s'il existe.
// Les données sont publiques : une réponse obtenue avec ou sans token est la même, le cache peut donc être partagé.
export function requeteGithub<T>(
	chemin: string,
	parametres: Record<string, string | number | undefined> = {},
	token?: string,
): Promise<T> {
	const url = new URL(chemin, URL_API);
	for (const [cle, valeur] of Object.entries(parametres)) {
		if (valeur !== undefined) url.searchParams.set(cle, String(valeur));
	}

	if (token) return appelerGithub<T>(url, token);
	const jeton = jetonDuVisiteur();
	return avecCache(url.toString(), () => appelerGithub<T>(url, jeton ?? undefined));
}

// Le token que la personne a enregistré dans Paramètres ; pas de navigateur (build Node) ou pas de token : null
function jetonDuVisiteur(): string | null {
	try {
		return lireToken(globalThis.localStorage ?? null);
	} catch {
		return null;
	}
}

async function appelerGithub<T>(url: URL, token?: string): Promise<T> {
	const entetes: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
	};
	if (token) entetes.Authorization = `Bearer ${token}`;

	let reponse: Response;
	try {
		reponse = await fetch(url, { headers: entetes });
	} catch {
		throw new ErreurGithub('reseau', 'Impossible de joindre GitHub. Vérifie ta connexion.');
	}

	// 204 « pas de contenu » : par exemple les contributeurs d'un repo vide. On le traite comme une liste vide.
	if (reponse.status === 204) return [] as unknown as T;
	if (reponse.ok) return (await reponse.json()) as T;

	// 401 : GitHub refuse le token (mal copié, expiré ou supprimé)
	if (reponse.status === 401) {
		throw new ErreurGithub('jeton', 'GitHub refuse ton token (invalide ou expiré). Remplace-le ou retire-le dans Paramètres.', 401);
	}
	// GitHub répond 403 ou 429 quand la limite est atteinte : x-ratelimit-remaining vaut alors 0
	const restantes = reponse.headers.get('x-ratelimit-remaining');
	if ((reponse.status === 403 || reponse.status === 429) && restantes === '0') {
		const reset = Number(reponse.headers.get('x-ratelimit-reset'));
		const quand = reset ? new Date(reset * 1000) : null;
		throw new ErreurGithub('limite', 'Limite de requêtes GitHub atteinte. Réessaie un peu plus tard.', reponse.status, quand);
	}
	if (reponse.status === 404) {
		throw new ErreurGithub('introuvable', 'Introuvable sur GitHub.', 404);
	}
	// 422 : GitHub refuse la requête (trop d'opérateurs AND/OR, texte trop long…)
	if (reponse.status === 422) {
		throw new ErreurGithub('autre', 'GitHub n’a pas compris cette recherche. Essaie avec des mots plus simples.', 422);
	}
	throw new ErreurGithub('autre', `GitHub a répondu avec l'erreur ${reponse.status}.`, reponse.status);
}

// Les paramètres de recherche communs aux repos et aux issues
function parametresRecherche(q: string, options: OptionsRecherche) {
	return { q, sort: options.tri, order: options.ordre, page: options.page, per_page: options.parPage };
}

// `q` suit la syntaxe de GitHub, par exemple « language:python topic:cli good-first-issues:>0 ».
// Les filtres simplifiés de Repolink construiront cette chaîne à l'étape 6.
export function rechercherRepos(q: string, options: OptionsRecherche = {}) {
	return requeteGithub<ResultatRecherche<RepoGithub>>('/search/repositories', parametresRecherche(q, options), options.token);
}

// Pour les good first issues : `label:"good first issue" state:open is:issue`
export function rechercherIssues(q: string, options: OptionsRecherche = {}) {
	return requeteGithub<ResultatRecherche<IssueGithub>>('/search/issues', parametresRecherche(q, options), options.token);
}

export function recupererRepo(nomComplet: string, token?: string) {
	return requeteGithub<RepoGithub>(`/repos/${nomComplet}`, {}, token);
}

export function recupererProfil(pseudo: string, token?: string) {
	return requeteGithub<UtilisateurGithub>(`/users/${pseudo}`, {}, token);
}

// Répartition du code d'un repo par langage (en octets)
export function recupererLangages(nomComplet: string, token?: string) {
	return requeteGithub<LangagesGithub>(`/repos/${nomComplet}/languages`, {}, token);
}

export function recupererContributeurs(nomComplet: string, parPage = 30, token?: string) {
	return requeteGithub<ContributeurGithub[]>(`/repos/${nomComplet}/contributors`, { per_page: parPage }, token);
}

// Repos d'une personne ou d'une organisation, les plus récemment mis à jour d'abord
export function recupererReposUtilisateur(pseudo: string, parPage = 30, token?: string) {
	return requeteGithub<RepoGithub[]>(`/users/${pseudo}/repos`, { sort: 'updated', per_page: parPage }, token);
}

// Événements publics récents (GitHub en garde 90 jours, 300 au plus, répartis en 3 pages de 100)
export function recupererEvenements(pseudo: string, page = 1, token?: string) {
	return requeteGithub<EvenementGithub[]>(`/users/${pseudo}/events/public`, { per_page: 100, page }, token);
}

// Tous les événements publics disponibles : jusqu'à 3 pages de 100, on s'arrête à la première page incomplète
export async function recupererEvenementsRecents(pseudo: string, token?: string) {
	const tous: EvenementGithub[] = [];
	for (let page = 1; page <= 3; page++) {
		const evenements = await recupererEvenements(pseudo, page, token);
		tous.push(...evenements);
		if (evenements.length < 100) break;
	}
	return tous;
}
