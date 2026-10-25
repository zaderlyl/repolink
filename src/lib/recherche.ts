// Filtres de la page Recherche : lecture de l'adresse (?q=…&langage=…&topic=…&page=…)
// et construction de la requête de l'API de GitHub. Ces fonctions ne font aucun appel réseau.
import type { OptionsRecherche } from './github.ts';
import type { OngletRepo } from './adresses.ts';
import { dateLimiteActif, PREFERENCES_PAR_DEFAUT } from './preferences.ts';
import type { Preferences } from './preferences.ts';
import { lien } from './adresses.ts';

export const RESULTATS_PAR_PAGE = 10;
// GitHub ne donne jamais plus de 1000 résultats pour une recherche
export const MAX_RESULTATS = 1000;

export type Filtres = {
	q: string; // texte tapé par le visiteur (nom, mot-clé, créateur…)
	langage: string; // « JavaScript », ou vide pour tous
	topic: string; // « react », ou vide pour tous
	page: number; // commence à 1
};

export const FILTRES_VIDES: Filtres = { q: '', langage: '', topic: '', page: 1 };

// Un nom de langage ou de topic : lettres, chiffres et quelques signes (C++, C#, Jupyter Notebook, design-system)
const NOM_VALIDE = /^[\p{L}\p{N}+#._ -]{1,40}$/u;

function nettoyerNom(valeur: string | null): string {
	const nom = (valeur ?? '').trim();
	return NOM_VALIDE.test(nom) ? nom : '';
}

// Lit l'adresse de la page. Une valeur absente ou bizarre est ignorée : on ne plante jamais sur une adresse tapée à la main.
export function lireFiltres(parametres: URLSearchParams): Filtres {
	// Pas de retours à la ligne ni de caractères de contrôle dans la recherche
	const q = (parametres.get('q') ?? '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
	const page = Math.floor(Number(parametres.get('page')));
	return {
		q,
		langage: nettoyerNom(parametres.get('langage')),
		topic: nettoyerNom(parametres.get('topic')).toLowerCase(),
		page: Number.isFinite(page) && page >= 1 ? Math.min(page, MAX_RESULTATS / RESULTATS_PAR_PAGE) : 1,
	};
}

// GitHub veut des guillemets autour des valeurs qui ne sont pas un simple mot
const valeur = (texte: string) => (/^[\w+#.-]+$/.test(texte) ? texte : `"${texte}"`);

// Requête de recherche de repos au format GitHub.
// Sans aucun filtre, on montre les repos qui accueillent les débutants (au moins une good first issue).
// Sans texte, on écarte aussi les repos sans étoile (stars:>=10) : triés par date, ils ne montreraient que des dépôts vides.
// Les préférences (page Paramètres) ajoutent « projets actifs » (mis à jour ces 90 derniers jours) et « sans archivés ».
export function construireRequete(
	filtres: Filtres,
	preferences: Preferences = PREFERENCES_PAR_DEFAUT,
	maintenant: Date = new Date(),
): string {
	const morceaux: string[] = [];
	if (filtres.q) morceaux.push(filtres.q);
	if (filtres.langage) morceaux.push(`language:${valeur(filtres.langage)}`);
	if (filtres.topic) morceaux.push(`topic:${valeur(filtres.topic)}`);
	if (morceaux.length === 0) morceaux.push('good-first-issues:>0');
	if (!filtres.q) morceaux.push('stars:>=10');
	if (preferences.masquerArchives) morceaux.push('archived:false');
	if (preferences.projetsActifs) morceaux.push(`pushed:>${dateLimiteActif(maintenant)}`);
	return morceaux.join(' ');
}

// Tri et pagination. Avec un texte, GitHub classe par pertinence (pas de tri imposé) ;
// sans texte, on met en avant les repos mis à jour récemment.
export function construireOptions(filtres: Filtres): OptionsRecherche {
	return {
		tri: filtres.q ? undefined : 'updated',
		ordre: filtres.q ? undefined : 'desc',
		page: filtres.page,
		parPage: RESULTATS_PAR_PAGE,
	};
}

// Nombre de pages à proposer : GitHub s'arrête à 1000 résultats
export function nombrePages(total: number): number {
	return Math.max(1, Math.ceil(Math.min(total, MAX_RESULTATS) / RESULTATS_PAR_PAGE));
}

// Adresse de la page Recherche (ou d'une autre page qui lit les mêmes filtres, via `chemin`)
// pour des filtres donnés. Les valeurs par défaut ne sont pas écrites.
export function hrefRecherche(filtres: Partial<Filtres> = {}, chemin = '/recherche'): string {
	const f = { ...FILTRES_VIDES, ...filtres };
	const parametres = new URLSearchParams();
	if (f.q) parametres.set('q', f.q);
	if (f.langage) parametres.set('langage', f.langage);
	if (f.topic) parametres.set('topic', f.topic);
	if (f.page > 1) parametres.set('page', String(f.page));
	const texte = parametres.toString();
	return lien(texte ? `${chemin}?${texte}` : chemin);
}

// --- Good first issues ---
// Cette page ne garde que le langage et la page : le texte et le topic de la Recherche ne servent pas ici.

export const CHEMIN_ISSUES = '/good-first-issues';

export const hrefIssues = (filtres: Partial<Filtres> = {}) =>
	hrefRecherche({ langage: filtres.langage, page: filtres.page }, CHEMIN_ISSUES);

// Issues ouvertes, sans personne d'assigné, portant le label « good first issue », dans des repos non archivés.
export function construireRequeteIssues(filtres: Filtres): string {
	const morceaux = ['label:"good first issue"', 'state:open', 'is:issue', 'no:assignee', 'archived:false'];
	if (filtres.langage) morceaux.push(`language:${valeur(filtres.langage)}`);
	return morceaux.join(' ');
}

// Les plus récemment mises à jour d'abord
export function construireOptionsIssues(filtres: Filtres): OptionsRecherche {
	return { tri: 'updated', ordre: 'desc', page: filtres.page, parPage: RESULTATS_PAR_PAGE };
}

// --- Fiche repo et profil créateur ---

// Le propriétaire est un pseudo GitHub (lettres, chiffres, tirets) ; le repo ne peut pas s'appeler « . » ni « .. »
// (sinon l'adresse de l'API remonterait d'un dossier : /repos/../etc).
const NOM_REPO_VALIDE = /^[a-zA-Z0-9-]{1,39}\/(?!\.{1,2}$)[\w.-]{1,100}$/;
const PSEUDO_VALIDE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

// Un pseudo GitHub : lettres, chiffres et tirets, 39 caractères au plus, sans tiret au début
export const estPseudoValide = (pseudo: string) => PSEUDO_VALIDE.test(pseudo);
const ONGLETS: OngletRepo[] = ['apercu', 'issues', 'contributeurs', 'similaires'];

// « proprietaire/repo » lu dans ?nom=… ; vide si l'adresse est absente ou invalide
export function lireNomRepo(parametres: URLSearchParams): string {
	const nom = (parametres.get('nom') ?? '').trim();
	return NOM_REPO_VALIDE.test(nom) ? nom : '';
}

// Pseudo GitHub lu dans ?pseudo=… ; vide si l'adresse est absente ou invalide
export function lirePseudo(parametres: URLSearchParams): string {
	const pseudo = (parametres.get('pseudo') ?? '').trim();
	return PSEUDO_VALIDE.test(pseudo) ? pseudo : '';
}

export function lireOnglet(parametres: URLSearchParams): OngletRepo {
	const onglet = parametres.get('onglet') as OngletRepo | null;
	return onglet && ONGLETS.includes(onglet) ? onglet : 'apercu';
}

// Les good first issues ouvertes d'un seul repo
export const construireRequeteIssuesRepo = (nomRepo: string) =>
	`repo:${nomRepo} label:"good first issue" state:open is:issue`;

// Repos similaires : mêmes deux premiers topics, sinon même langage. Chaîne vide si on n'a rien pour comparer.
export function construireRequeteSimilaires(repo: { nom: string; topics: string[]; langage: string }): string {
	const topics = repo.topics.filter((topic) => NOM_VALIDE.test(topic)).slice(0, 2);
	const criteres = topics.length > 0 ? topics.map((topic) => `topic:${valeur(topic)}`) : repo.langage !== 'Autre' ? [`language:${valeur(repo.langage)}`] : [];
	if (criteres.length === 0) return '';
	return [...criteres, `-repo:${repo.nom}`, 'stars:>=10', 'archived:false'].join(' ');
}
