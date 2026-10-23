// Conversion des réponses de GitHub vers les types de src/data/accueil.ts (Repo, Issue, Profil).
// Les pages et les composants ne voient ainsi que des textes prêts à afficher.
import type { Issue, Profil, Repo } from '../data/accueil.ts';
import type { IssueGithub, RepoGithub, UtilisateurGithub } from './github.ts';

// Couleurs des langages de GitHub (l'API ne les donne pas) ; gris pour les autres
const COULEURS_LANGAGES: Record<string, string> = {
	JavaScript: '#f1e05a',
	TypeScript: '#3178c6',
	Python: '#3572a5',
	CSS: '#563d7c',
	HTML: '#e34c26',
	Go: '#00add8',
	Rust: '#dea584',
	Java: '#b07219',
	'C++': '#f34b7d',
	C: '#555555',
	'C#': '#178600',
	PHP: '#4f5d95',
	Ruby: '#701516',
	Swift: '#f05138',
	Kotlin: '#a97bff',
	Shell: '#89e051',
	Vue: '#41b883',
	Svelte: '#ff3e00',
	Dart: '#00b4ab',
	Lua: '#000080',
	SCSS: '#c6538c',
};
const COULEUR_PAR_DEFAUT = '#8b949e';
// Un repo peut avoir 20 topics : la carte n'en montre que quelques-uns
const MAX_TOPICS = 3;
const LANGAGE_PAR_DEFAUT = 'Autre';

export const couleurLangage = (langage: string | null) =>
	(langage && COULEURS_LANGAGES[langage]) || COULEUR_PAR_DEFAUT;

// 842 → « 842 », 1250 → « 1.2k », 12000 → « 12k », 1500000 → « 1.5M »
export function formaterNombre(nombre: number): string {
	const abrege = (valeur: number, suffixe: string) => {
		const arrondi = Math.floor(valeur * 10) / 10;
		return `${Number.isInteger(arrondi) ? arrondi : arrondi.toFixed(1)}${suffixe}`;
	};
	if (nombre >= 1_000_000) return abrege(nombre / 1_000_000, 'M');
	if (nombre >= 1_000) return abrege(nombre / 1_000, 'k');
	return String(nombre);
}

// « il y a 2 jours », « il y a 1 semaine »… `maintenant` sert aux tests
export function ilYA(dateIso: string, maintenant: Date = new Date()): string {
	const secondes = Math.max(0, Math.floor((maintenant.getTime() - new Date(dateIso).getTime()) / 1000));
	const unites: [number, string, string][] = [
		[365 * 24 * 3600, 'an', 'ans'],
		[30 * 24 * 3600, 'mois', 'mois'],
		[7 * 24 * 3600, 'semaine', 'semaines'],
		[24 * 3600, 'jour', 'jours'],
		[3600, 'heure', 'heures'],
		[60, 'minute', 'minutes'],
	];
	for (const [duree, singulier, pluriel] of unites) {
		const valeur = Math.floor(secondes / duree);
		if (valeur >= 1) return `il y a ${valeur} ${valeur > 1 ? pluriel : singulier}`;
	}
	return 'à l’instant';
}

// « https://api.github.com/repos/proprietaire/repo » → « proprietaire/repo »
export const nomRepoDepuisUrl = (urlApi: string) => urlApi.split('/repos/')[1] ?? urlApi;

// `goodFirstIssues` : GitHub ne le donne pas dans la réponse d'un repo (open_issues_count compte toutes les issues).
// Il faut le demander à part, avec une recherche d'issues « good first issue » sur ce repo.
export function versRepo(repo: RepoGithub, goodFirstIssues = 0): Repo {
	return {
		nom: repo.full_name,
		description: repo.description ?? '',
		langage: repo.language ?? LANGAGE_PAR_DEFAUT,
		couleurLangage: couleurLangage(repo.language),
		etoiles: formaterNombre(repo.stargazers_count),
		topics: (repo.topics ?? []).slice(0, MAX_TOPICS),
		goodFirstIssues,
		miseAJour: ilYA(repo.updated_at),
	};
}

export function versIssue(issue: IssueGithub): Issue {
	return {
		titre: issue.title,
		repo: nomRepoDepuisUrl(issue.repository_url),
		ouverte: ilYA(issue.created_at),
	};
}

export function versProfil(utilisateur: UtilisateurGithub): Profil {
	return {
		nom: utilisateur.name ?? utilisateur.login,
		pseudo: utilisateur.login,
		abonnes: formaterNombre(utilisateur.followers),
		// Les bios de GitHub contiennent des retours à la ligne : on les remplace par des espaces
		bio: (utilisateur.bio ?? '').replace(/\s+/g, ' ').trim(),
	};
}
