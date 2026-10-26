// Filtres de la page Recherche : lecture de l'adresse (?q=…&langage=…&topic=…&taille=…&page=…)
// et construction de la requête de l'API de GitHub. Ces fonctions ne font aucun appel réseau.
import type { OptionsRecherche } from './github.ts';
import type { OngletRepo } from './adresses.ts';
import { dateLimiteActif, PREFERENCES_PAR_DEFAUT } from './preferences.ts';
import type { Preferences } from './preferences.ts';
import { lien } from './adresses.ts';

export const RESULTATS_PAR_PAGE = 10;
// GitHub ne donne jamais plus de 1000 résultats pour une recherche
export const MAX_RESULTATS = 1000;

// Taille du projet, d'après ses étoiles : les « petits » donnent leur chance aux créateurs encore peu connus
export type Taille = 'tous' | 'petits' | 'populaires';

export const TAILLES: { id: Taille; texte: string }[] = [
	{ id: 'tous', texte: 'Tous' },
	{ id: 'petits', texte: 'Petits projets' },
	{ id: 'populaires', texte: 'Populaires' },
];

// De 1 à 50 étoiles, un projet est « petit » ; au-delà, il est « populaire ».
// Les repos à 0 étoile sont écartés : sur un essai, 73 % seulement avaient une description (90 % dès 1 étoile).
export const ETOILES_PETIT_MIN = 1;
export const ETOILES_PETIT_MAX = 50;
// Sans texte, les repos « tous » sans étoile ne montreraient que des dépôts vides : on les écarte sous ce seuil
const ETOILES_MIN_SANS_TEXTE = 10;
// Un repo plus léger que cela (en Ko) est presque vide : on l'écarte des petits projets
const TAILLE_MIN_PETIT = 200;

export type Filtres = {
	q: string; // texte tapé par le visiteur (nom, mot-clé, créateur…)
	langage: string; // « JavaScript », ou vide pour tous
	topic: string; // « react », ou vide pour tous
	taille: Taille; // « petits », « populaires » ou « tous »
	page: number; // commence à 1
};

export const FILTRES_VIDES: Filtres = { q: '', langage: '', topic: '', taille: 'tous', page: 1 };

// Une taille inconnue (adresse tapée à la main) donne « tous »
const lireTaille = (valeur: string | null): Taille => TAILLES.find((t) => t.id === valeur)?.id ?? 'tous';

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
		taille: lireTaille(parametres.get('taille')),
		page: Number.isFinite(page) && page >= 1 ? Math.min(page, MAX_RESULTATS / RESULTATS_PAR_PAGE) : 1,
	};
}

// GitHub veut des guillemets autour des valeurs qui ne sont pas un simple mot
const valeur = (texte: string) => (/^[\w+#.-]+$/.test(texte) ? texte : `"${texte}"`);

// Requête de recherche de repos au format GitHub.
// Sans aucun filtre, on montre les repos qui accueillent les débutants (au moins une good first issue).
// Sans texte, on écarte aussi les repos de moins de 10 étoiles : triés par date, ils ne montreraient que des dépôts vides.
// La taille « petits » remplace ce plancher : de 1 à 50 étoiles, mais seulement des repos actifs et pas vides (size).
// La taille « populaires » ne garde que les repos de plus de 50 étoiles.
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
	if (filtres.taille === 'petits') morceaux.push(`stars:${ETOILES_PETIT_MIN}..${ETOILES_PETIT_MAX}`, `size:>${TAILLE_MIN_PETIT}`);
	else if (filtres.taille === 'populaires') morceaux.push(`stars:>${ETOILES_PETIT_MAX}`);
	else if (!filtres.q) morceaux.push(`stars:>=${ETOILES_MIN_SANS_TEXTE}`);
	if (preferences.masquerArchives) morceaux.push('archived:false');
	// Un petit projet sans activité récente n'aide personne : on garde les actifs même si la préférence est éteinte
	if (preferences.projetsActifs || filtres.taille === 'petits') morceaux.push(`pushed:>${dateLimiteActif(maintenant)}`);
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
	if (f.taille !== 'tous') parametres.set('taille', f.taille);
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
