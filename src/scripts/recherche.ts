// Page Recherche : lit l'adresse, interroge l'API de GitHub (avec cache) et remplit la page.
// La page Astro (src/pages/recherche.astro) fournit les modèles HTML (<template>) : on les remplit ici,
// ainsi les cartes et les pastilles gardent exactement le style des composants.
import { rechercherRepos } from '../lib/github.ts';
import type { RepoGithub, ResultatRecherche } from '../lib/github.ts';
import { couleurLangage, formaterRepos } from '../lib/conversion.ts';
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

// Une pastille de filtre ; « retirable » : cliquer la retire (texte avec ✕), sinon c'est un interrupteur
function pastille(texte: string, href: string, actif: boolean, couleur: string, libelle?: string): HTMLElement {
	const chip = depuisModele(actif ? 'modele-chip-actif' : 'modele-chip', { texte, href, couleur });
	if (libelle) chip.setAttribute('aria-label', libelle);
	return chip;
}

function afficherFiltres(filtres: Filtres) {
	// Chaque pastille mène à la même recherche avec un filtre de plus ou de moins ; le texte et la taille restent, la page repart de 1
	const vers = (changement: Partial<Filtres>) => hrefRecherche({ ...filtres, page: 1, ...changement });
	const pastilles: HTMLElement[] = [pastille('TOUT', vers({ langages: [] }), filtres.langages.length === 0, '#8b949e')];
	// Les langages rapides sont des interrupteurs, les autres langages choisis se retirent avec ✕
	for (const rapide of LANGAGES_RAPIDES) {
		const actif = filtres.langages.includes(rapide);
		pastilles.push(pastille(rapide, vers({ langages: basculer(filtres.langages, rapide) }), actif, couleurLangage(rapide)));
	}
	for (const langage of filtres.langages.filter((l) => !LANGAGES_RAPIDES.includes(l))) {
		pastilles.push(
			pastille(`${langage} ✕`, vers({ langages: basculer(filtres.langages, langage) }), true, couleurLangage(langage), `Retirer le langage ${langage}`),
		);
	}
	for (const topic of filtres.topics) {
		pastilles.push(pastille(`topic : ${topic} ✕`, vers({ topics: basculer(filtres.topics, topic) }), true, '#8b949e', `Retirer le topic ${topic}`));
	}
	$('filtres').replaceChildren(...pastilles);

	const aide = $('aide-taille');
	aide.textContent = expliquerTaille(filtres.taille);
	aide.hidden = filtres.taille === 'tous';
	// Changer de taille garde le texte, les langages et les topics ; on repart de la page 1
	$('filtres-taille').replaceChildren(
		...TAILLES.map(({ id, texte }) => pastille(texte, vers({ taille: id }), id === filtres.taille, '#8b949e')),
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

async function charger() {
	purgerCache();
	const filtres = lireFiltres(new URLSearchParams(location.search));
	afficherFiltres(filtres);
	remplirFormulaire(filtres);
	montrer(ZONES, 'chargement');

	let resultat: ResultatRecherche<RepoGithub>;
	try {
		resultat = await rechercherRepos(construireRequete(filtres, lirePreferences(stockage())), construireOptions(filtres));
	} catch (erreur) {
		$('statut').textContent = '';
		afficherErreurPage(erreur);
		montrer(ZONES, 'erreur');
		return;
	}

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
charger();
