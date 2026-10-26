// Page Recherche : lit l'adresse, interroge l'API de GitHub (avec cache) et remplit la page.
// La page Astro (src/pages/recherche.astro) fournit les modèles HTML (<template>) : on les remplit ici,
// ainsi les cartes et les pastilles gardent exactement le style des composants.
import { rechercherRepos } from '../lib/github.ts';
import type { RepoGithub, ResultatRecherche } from '../lib/github.ts';
import { couleurLangage, formaterRepos } from '../lib/conversion.ts';
import { groupesTopics, langagesRecherche } from '../data/filtres.ts';
import { purgerCache } from '../lib/cache.ts';
import { lirePreferences } from '../lib/preferences.ts';
import { basculer, construireOptions, construireRequete, expliquerTaille, hrefRecherche, lireFiltres, nombrePages, TAILLES } from '../lib/recherche.ts';
import type { Filtres } from '../lib/recherche.ts';
import { $, afficherErreurPage, afficherPagination, creerCarteRepo, depuisModele, montrer } from './commun.ts';

const LANGAGES_RAPIDES = ['JavaScript', 'Python'];

// Les préférences (page Paramètres) sont dans le stockage du navigateur ; s'il est bloqué, on garde les valeurs par défaut
function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}
const ZONES = ['liste', 'chargement', 'vide', 'erreur'];

// Une pastille de filtre ; `cle` sert à retrouver la même pastille après un nouvel affichage (le focus clavier y revient)
function pastille(texte: string, href: string, actif: boolean, couleur: string, cle: string, libelle?: string): HTMLElement {
	const chip = depuisModele(actif ? 'modele-chip-actif' : 'modele-chip', { texte, href, couleur });
	if (libelle) chip.setAttribute('aria-label', libelle);
	chip.dataset.cle = cle;
	return chip;
}

// Même recherche avec un filtre de plus ou de moins ; le texte et la taille restent, la page repart de 1
const vers = (filtres: Filtres, changement: Partial<Filtres>) => hrefRecherche({ ...filtres, page: 1, ...changement });
const contient = (liste: string[], valeur: string) => liste.some((v) => v.toLowerCase() === valeur.toLowerCase());

function afficherPastilles(filtres: Filtres) {
	const pastilles: HTMLElement[] = [pastille('TOUT', vers(filtres, { langages: [] }), filtres.langages.length === 0, '#8b949e', 'r:tout')];
	// Les langages rapides sont des interrupteurs, les autres langages choisis se retirent avec ✕
	for (const rapide of LANGAGES_RAPIDES) {
		const href = vers(filtres, { langages: basculer(filtres.langages, rapide) });
		pastilles.push(pastille(rapide, href, contient(filtres.langages, rapide), couleurLangage(rapide), `r:${rapide}`));
	}
	for (const langage of filtres.langages.filter((l) => !LANGAGES_RAPIDES.includes(l))) {
		const href = vers(filtres, { langages: basculer(filtres.langages, langage) });
		pastilles.push(pastille(`${langage} ✕`, href, true, couleurLangage(langage), `r:${langage}`, `Retirer le langage ${langage}`));
	}
	for (const topic of filtres.topics) {
		const href = vers(filtres, { topics: basculer(filtres.topics, topic) });
		pastilles.push(pastille(`topic : ${topic} ✕`, href, true, '#8b949e', `r:topic:${topic}`, `Retirer le topic ${topic}`));
	}
	$('filtres').replaceChildren(...pastilles);
}

// Le panneau « Plus de filtres » : tous les langages, puis les topics rangés par thème
function afficherPanneau(filtres: Filtres) {
	const choisis = filtres.langages.length + filtres.topics.length;
	$('titre-plus-filtres').textContent = choisis > 0 ? `Plus de filtres (${choisis})` : 'Plus de filtres';
	$('choix-langages').replaceChildren(
		...langagesRecherche.map(({ nom, couleur }) =>
			pastille(nom, vers(filtres, { langages: basculer(filtres.langages, nom) }), contient(filtres.langages, nom), couleur, `p:${nom}`),
		),
	);
	$('choix-topics').replaceChildren(
		...groupesTopics.map(({ titre, topics }) => {
			const groupe = document.createElement('div');
			const intitule = document.createElement('h3');
			intitule.className = 'text-[13px] text-texte-secondaire';
			intitule.textContent = titre;
			const pastilles = document.createElement('div');
			pastilles.className = 'mt-2 flex flex-wrap gap-2';
			pastilles.append(
				...topics.map((topic) =>
					pastille(topic, vers(filtres, { topics: basculer(filtres.topics, topic) }), contient(filtres.topics, topic), '#8b949e', `p:topic:${topic}`),
				),
			);
			groupe.append(intitule, pastilles);
			return groupe;
		}),
	);
}

function afficherFiltres(filtres: Filtres) {
	afficherPastilles(filtres);
	afficherPanneau(filtres);
	const aide = $('aide-taille');
	aide.textContent = expliquerTaille(filtres.taille);
	aide.hidden = filtres.taille === 'tous';
	// Changer de taille garde le texte, les langages et les topics
	$('filtres-taille').replaceChildren(
		...TAILLES.map(({ id, texte }) => pastille(texte, vers(filtres, { taille: id }), id === filtres.taille, '#8b949e', `t:${id}`)),
	);
}

function remplirFormulaire(filtres: Filtres) {
	const champ = document.querySelector<HTMLInputElement>('#formulaire-recherche input[name="q"]');
	if (champ) champ.value = filtres.q;
	// Les champs cachés ne sont envoyés que s'ils ont une valeur : une nouvelle recherche garde les langages, les topics et la taille
	const valeurs = { langage: filtres.langages.join(','), topic: filtres.topics.join(','), taille: filtres.taille === 'tous' ? '' : filtres.taille };
	for (const [nom, valeur] of Object.entries(valeurs)) {
		const cache = document.querySelector<HTMLInputElement>(`#formulaire-recherche input[name="${nom}"]`);
		if (!cache) continue;
		cache.value = valeur;
		cache.disabled = !valeur;
	}
}

function afficherRepos(repos: RepoGithub[]) {
	const liste = $('liste');
	liste.replaceChildren();
	for (const repoGithub of repos) {
		const item = document.createElement('li');
		item.append(creerCarteRepo(repoGithub));
		liste.append(item);
	}
}

// Un choix de filtre ne recharge pas la page : on relance la recherche. Si deux choix se suivent vite, seul le dernier compte.
let dernierChargement = 0;

async function charger() {
	const numero = ++dernierChargement;
	purgerCache();
	const filtres = lireFiltres(new URLSearchParams(location.search));
	// Le focus clavier reste sur la même pastille quand elle est redessinée
	const cleFocus = (document.activeElement as HTMLElement | null)?.dataset?.cle;
	afficherFiltres(filtres);
	if (cleFocus) document.querySelector<HTMLElement>(`[data-cle="${CSS.escape(cleFocus)}"]`)?.focus();
	remplirFormulaire(filtres);
	$('statut').textContent = 'Chargement des repos…';
	$('pagination').replaceChildren();
	montrer(ZONES, 'chargement');

	let resultat: ResultatRecherche<RepoGithub>;
	try {
		resultat = await rechercherRepos(construireRequete(filtres, lirePreferences(stockage())), construireOptions(filtres));
	} catch (erreur) {
		if (numero !== dernierChargement) return;
		$('statut').textContent = '';
		afficherErreurPage(erreur);
		montrer(ZONES, 'erreur');
		return;
	}

	if (numero !== dernierChargement) return;

	// Page trop loin (adresse tapée à la main) : on va à la dernière page qui existe
	const pages = nombrePages(resultat.total_count);
	if (filtres.page > pages) {
		location.replace(hrefRecherche({ ...filtres, page: pages }));
		return;
	}

	if (resultat.items.length === 0) {
		$('statut').textContent = ''; // le message « Aucun repo trouvé » suffit
		// Avec une taille choisie, le plus simple est de l'élargir : un bouton y mène
		const voirTous = $('voir-tous');
		voirTous.hidden = filtres.taille === 'tous';
		voirTous.setAttribute('href', hrefRecherche({ ...filtres, taille: 'tous', page: 1 }));
		montrer(ZONES, 'vide');
		return;
	}
	$('statut').textContent = formaterRepos(resultat.total_count);
	afficherRepos(resultat.items);
	afficherPagination($('pagination'), filtres.page, resultat.total_count, (page) => hrefRecherche({ ...filtres, page }));
	montrer(ZONES, 'liste');
}

$('reessayer').addEventListener('click', () => location.reload());

// Les pastilles de filtre changent l'adresse sans recharger la page (le panneau reste ouvert, la page ne saute pas)
document.addEventListener('click', (evenement) => {
	if (evenement.defaultPrevented || evenement.button !== 0 || evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;
	const lienFiltre = (evenement.target as Element).closest<HTMLAnchorElement>('#filtres a, #filtres-taille a, #plus-filtres a');
	if (!lienFiltre) return;
	evenement.preventDefault();
	history.pushState(null, '', lienFiltre.href);
	void charger();
});
// Précédent / Suivant du navigateur
window.addEventListener('popstate', () => void charger());

// Le panneau garde son état (ouvert ou fermé) d'une recherche à l'autre, même après l'envoi du formulaire
const CLE_PANNEAU = 'repolink:filtres-ouverts';
function stockageSession(): Storage | null {
	try {
		return globalThis.sessionStorage ?? null;
	} catch {
		return null;
	}
}
const panneau = $<HTMLDetailsElement>('plus-filtres');
try {
	panneau.open = stockageSession()?.getItem(CLE_PANNEAU) === '1';
} catch {
	// stockage bloqué : le panneau reste fermé
}
panneau.addEventListener('toggle', () => {
	try {
		stockageSession()?.setItem(CLE_PANNEAU, panneau.open ? '1' : '0');
	} catch {
		// stockage bloqué : l'état ne sera pas gardé
	}
});

charger();
