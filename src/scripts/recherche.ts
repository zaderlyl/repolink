// Page Recherche : lit l'adresse, interroge l'API de GitHub (avec cache) et remplit la page.
// La page Astro (src/pages/recherche.astro) fournit les modèles HTML (<template>) : on les remplit ici,
// ainsi les cartes et les pastilles gardent exactement le style des composants.
import { rechercherRepos } from '../lib/github.ts';
import type { RepoGithub, ResultatRecherche } from '../lib/github.ts';
import { formaterRepos } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { lirePreferences } from '../lib/preferences.ts';
import { construireOptions, construireRequete, expliquerTaille, hrefRecherche, lireFiltres, nombrePages, TAILLES } from '../lib/recherche.ts';
import type { Filtres } from '../lib/recherche.ts';
import { $, afficherErreurPage, afficherPagination, afficherPastilles, creerCarteRepo, depuisModele, montrer } from './commun.ts';

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

function afficherFiltres(filtres: Filtres) {
	// Changer de langage garde le texte, le topic et la taille
	const base = { q: filtres.q, topic: filtres.topic, taille: filtres.taille };
	afficherPastilles($('filtres'), {
		langagesRapides: LANGAGES_RAPIDES,
		langage: filtres.langage,
		hrefLangage: (langage) => hrefRecherche({ ...base, langage }),
		supplement: filtres.topic
			? [
					{
						texte: `topic : ${filtres.topic} ✕`,
						href: hrefRecherche({ q: filtres.q, langage: filtres.langage, taille: filtres.taille }),
						libelle: `Retirer le topic ${filtres.topic}`,
					},
				]
			: [],
	});
	const aide = $('aide-taille');
	aide.textContent = expliquerTaille(filtres.taille);
	aide.hidden = filtres.taille === 'tous';
	// Changer de taille garde le texte, le langage et le topic ; on repart de la page 1
	$('filtres-taille').replaceChildren(
		...TAILLES.map(({ id, texte }) =>
			depuisModele(id === filtres.taille ? 'modele-chip-actif' : 'modele-chip', {
				texte,
				href: hrefRecherche({ q: filtres.q, langage: filtres.langage, topic: filtres.topic, taille: id }),
				couleur: '#8b949e',
			}),
		),
	);
}

function remplirFormulaire(filtres: Filtres) {
	const champ = document.querySelector<HTMLInputElement>('#formulaire-recherche input[name="q"]');
	if (champ) champ.value = filtres.q;
	// Les champs cachés ne sont envoyés que s'ils ont une valeur : une nouvelle recherche garde le langage, le topic et la taille
	for (const nom of ['langage', 'topic', 'taille'] as const) {
		const cache = document.querySelector<HTMLInputElement>(`#formulaire-recherche input[name="${nom}"]`);
		if (!cache) continue;
		cache.value = filtres[nom];
		cache.disabled = !filtres[nom] || filtres[nom] === 'tous';
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
