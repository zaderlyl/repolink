// Filtres de la page Recherche : lecture de l'adresse (?q=…&langage=…&topic=…&page=…)
// et construction de la requête de l'API de GitHub. Ces fonctions ne font aucun appel réseau.
import type { OptionsRecherche } from './github.ts';

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
export function construireRequete(filtres: Filtres): string {
	const morceaux: string[] = [];
	if (filtres.q) morceaux.push(filtres.q);
	if (filtres.langage) morceaux.push(`language:${valeur(filtres.langage)}`);
	if (filtres.topic) morceaux.push(`topic:${valeur(filtres.topic)}`);
	if (morceaux.length === 0) morceaux.push('good-first-issues:>0');
	if (!filtres.q) morceaux.push('stars:>=10');
	morceaux.push('archived:false');
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
	return texte ? `${chemin}?${texte}` : chemin;
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
