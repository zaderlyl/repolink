// Client de l'API publique de GitHub (https://docs.github.com/fr/rest).
// Sans token, GitHub accepte 60 requêtes par heure et par visiteur (10 par minute pour la recherche) :
// la gestion de cette limite et le cache viennent ensuite (étape 5.2).
// Ce fichier ne lit jamais de token tout seul : celui du build est passé par `options.token`.

const URL_API = 'https://api.github.com';

// Formes de réponse de GitHub, réduites aux champs dont Repolink a besoin.
// Elles sont converties vers les types de src/data/accueil.ts à l'étape 5.3.
export type ProprietaireGithub = {
	login: string;
	avatar_url: string;
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

type TypeErreur = 'reseau' | 'limite' | 'introuvable' | 'autre';

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
export async function requeteGithub<T>(
	chemin: string,
	parametres: Record<string, string | number | undefined> = {},
	token?: string,
): Promise<T> {
	const url = new URL(chemin, URL_API);
	for (const [cle, valeur] of Object.entries(parametres)) {
		if (valeur !== undefined) url.searchParams.set(cle, String(valeur));
	}

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

	if (reponse.ok) return (await reponse.json()) as T;

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
