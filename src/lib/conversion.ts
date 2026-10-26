// Conversion des réponses de GitHub vers les types de src/data/accueil.ts (Repo, Issue, Profil).
// Les pages et les composants ne voient ainsi que des textes prêts à afficher.
import type { Issue, Profil, Repo } from '../data/accueil.ts';
import { langagesRecherche } from '../data/filtres.ts';
import type {
	ContributeurGithub,
	EvenementGithub,
	IssueGithub,
	LangagesGithub,
	RepoGithub,
	UtilisateurGithub,
} from './github.ts';

// Couleurs des langages de GitHub (l'API ne les donne pas), prises dans la liste des filtres (src/data/filtres.ts) ; gris pour les autres
const COULEURS_LANGAGES: Record<string, string> = Object.fromEntries(langagesRecherche.map(({ nom, couleur }) => [nom, couleur]));
const COULEUR_PAR_DEFAUT = '#8b949e';
// Un repo peut avoir 20 topics : la carte n'en montre que deux, pour rester lisible
const MAX_TOPICS = 2;
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

// 48210 → « 48 210 repos » (« 1 repo » au singulier)
export const formaterRepos = (nombre: number) =>
	`${new Intl.NumberFormat('fr-FR').format(nombre)} ${nombre > 1 ? 'repos' : 'repo'}`;

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

// --- Fiche repo et profil créateur (étape 7) ---

export type FicheRepo = {
	nom: string; // « proprietaire/repo »
	proprietaire: string;
	nomCourt: string; // « repo »
	avatar: string;
	description: string;
	topics: string[];
	etoiles: string;
	forks: string;
	watchers: string;
	langage: string;
	couleurLangage: string;
	miseAJour: string;
	urlGithub: string;
	publique: boolean;
};

export type Repartition = {
	nom: string;
	couleur: string;
	pourcentage: number; // entier de 0 à 100
};

export type Contributeur = {
	pseudo: string;
	avatar: string;
	contributions: string;
};

export type ProfilCreateur = {
	nom: string;
	pseudo: string;
	avatar: string;
	bio: string;
	abonnes: string;
	reposPublics: number;
	urlGithub: string;
	lienGithub: string; // « github.com/pseudo », tel qu'affiché
	langages: string[]; // les plus utilisés dans ses repos
	competences: string[]; // les topics les plus fréquents de ses repos
};

const nettoyer = (texte: string | null | undefined) => (texte ?? '').replace(/\s+/g, ' ').trim();

export function versFicheRepo(repo: RepoGithub): FicheRepo {
	const [proprietaire, nomCourt] = repo.full_name.split('/');
	return {
		nom: repo.full_name,
		proprietaire,
		nomCourt,
		avatar: repo.owner.avatar_url,
		description: nettoyer(repo.description),
		topics: repo.topics ?? [],
		etoiles: formaterNombre(repo.stargazers_count),
		forks: formaterNombre(repo.forks_count ?? 0),
		watchers: formaterNombre(repo.subscribers_count ?? 0),
		langage: repo.language ?? LANGAGE_PAR_DEFAUT,
		couleurLangage: couleurLangage(repo.language),
		miseAJour: ilYA(repo.updated_at),
		urlGithub: repo.html_url,
		publique: !repo.private,
	};
}

// Barre de langages : les 3 premiers (s'ils pèsent au moins 1 %), le reste regroupé sous « Autres ».
export function versRepartition(octets: LangagesGithub): Repartition[] {
	const entrees = Object.entries(octets).sort((a, b) => b[1] - a[1]);
	const total = entrees.reduce((somme, [, valeur]) => somme + valeur, 0);
	if (total === 0) return [];

	const parts = entrees.map(([nom, valeur]) => ({ nom, pourcentage: (valeur / total) * 100 }));
	const principaux = parts.slice(0, 3).filter((part) => part.pourcentage >= 1);
	const resteBrut = 100 - principaux.reduce((somme, part) => somme + part.pourcentage, 0);

	const resultat: Repartition[] = principaux.map((part) => ({
		nom: part.nom,
		couleur: couleurLangage(part.nom),
		pourcentage: Math.round(part.pourcentage),
	}));
	if (Math.round(resteBrut) >= 1) {
		resultat.push({ nom: 'Autres', couleur: COULEUR_PAR_DEFAUT, pourcentage: Math.round(resteBrut) });
	}
	return resultat;
}

export function versContributeur(contributeur: ContributeurGithub): Contributeur {
	return {
		pseudo: contributeur.login,
		avatar: contributeur.avatar_url,
		contributions: `${formaterNombre(contributeur.contributions)} ${contributeur.contributions > 1 ? 'contributions' : 'contribution'}`,
	};
}

// Les éléments les plus fréquents d'une liste, du plus au moins fréquent (à égalité : l'ordre d'arrivée)
function plusFrequents(elements: string[], combien: number): string[] {
	const compte = new Map<string, number>();
	for (const element of elements) compte.set(element, (compte.get(element) ?? 0) + 1);
	return [...compte.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, combien)
		.map(([element]) => element);
}

// `repos` : les repos de la personne. Langages et compétences sont déduits de ses repos :
// GitHub ne connaît pas de « compétences », on prend les topics les plus fréquents.
export function versProfilCreateur(utilisateur: UtilisateurGithub, repos: RepoGithub[]): ProfilCreateur {
	return {
		nom: utilisateur.name ?? utilisateur.login,
		pseudo: utilisateur.login,
		avatar: utilisateur.avatar_url,
		bio: nettoyer(utilisateur.bio),
		abonnes: formaterNombre(utilisateur.followers),
		reposPublics: utilisateur.public_repos,
		urlGithub: utilisateur.html_url,
		lienGithub: `github.com/${utilisateur.login}`,
		langages: plusFrequents(repos.flatMap((repo) => (repo.language ? [repo.language] : [])), 3),
		competences: plusFrequents(repos.flatMap((repo) => repo.topics ?? []), 4),
	};
}

// 0 événement → 0 ; 1 → 1 ; 2 à 3 → 2 ; 4 à 6 → 3 ; 7 et plus → 4
export const niveauActivite = (nombre: number) => (nombre <= 0 ? 0 : nombre === 1 ? 1 : nombre <= 3 ? 2 : nombre <= 6 ? 3 : 4);

const JOUR_MS = 24 * 3600 * 1000;

// Grille d'activité faite avec les événements publics : une liste de semaines (lundi au dimanche),
// la dernière contenant aujourd'hui (les jours à venir restent à 0). Les jours sont comptés en UTC, comme GitHub.
// `total` : nombre d'événements dans la période affichée.
export function grilleActivite(
	evenements: EvenementGithub[],
	nbSemaines = 13,
	maintenant: Date = new Date(),
): { semaines: number[][]; total: number } {
	const aujourdhui = Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate());
	const joursDepuisLundi = (new Date(aujourdhui).getUTCDay() + 6) % 7;
	const debut = aujourdhui - joursDepuisLundi * JOUR_MS - (nbSemaines - 1) * 7 * JOUR_MS;

	const parJour = new Array<number>(nbSemaines * 7).fill(0);
	let total = 0;
	for (const evenement of evenements) {
		const date = new Date(evenement.created_at);
		const jour = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
		const indice = Math.round((jour - debut) / JOUR_MS);
		if (indice >= 0 && indice < parJour.length && jour <= aujourdhui) {
			parJour[indice]++;
			total++;
		}
	}

	const semaines = Array.from({ length: nbSemaines }, (_, s) => parJour.slice(s * 7, s * 7 + 7).map(niveauActivite));
	return { semaines, total };
}

// GitHub ne garde que les 300 derniers événements publics (et 90 jours). Pour quelqu'un de très actif, ces 300 événements
// ne couvrent que quelques jours : on n'affiche alors que les semaines réellement connues, sans faire croire que le reste est vide.
// `evenements` : tous ceux qu'on a reçus ; renvoie le nombre de semaines (de 1 à `max`) à montrer dans la grille.
export function semainesCouvertes(evenements: EvenementGithub[], max = 13, maintenant: Date = new Date()): number {
	if (evenements.length < EVENEMENTS_MAX || evenements.length === 0) return max;
	const plusAncien = Math.min(...evenements.map((evenement) => new Date(evenement.created_at).getTime()));
	const lundi = (date: Date) => {
		const jour = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
		return jour - ((new Date(jour).getUTCDay() + 6) % 7) * JOUR_MS;
	};
	const semaines = Math.round((lundi(maintenant) - lundi(new Date(plusAncien))) / (7 * JOUR_MS)) + 1;
	return Math.min(max, Math.max(1, semaines));
}

// Nombre d'événements au-delà duquel GitHub tronque l'historique
export const EVENEMENTS_MAX = 300;
