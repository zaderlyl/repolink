// Page Recherche : lit l'adresse, interroge l'API de GitHub (avec cache) et remplit la page.
// La page Astro (src/pages/recherche.astro) fournit les modèles HTML (<template>) : on les remplit ici,
// ainsi les cartes et les pastilles gardent exactement le style des composants.
import { rechercherRepos } from '../lib/github.ts';
import type { RepoGithub, ResultatRecherche } from '../lib/github.ts';
import { formaterRepos, versRepo } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { hrefRepo } from '../lib/adresses.ts';
import { construireOptions, construireRequete, hrefRecherche, lireFiltres, nombrePages } from '../lib/recherche.ts';
import type { Filtres } from '../lib/recherche.ts';
import { $, afficherPagination, afficherPastilles, depuisModele, messageErreur, montrer } from './commun.ts';

const LANGAGES_RAPIDES = ['JavaScript', 'Python'];
const ZONES = ['liste', 'chargement', 'vide', 'erreur'];

function afficherFiltres(filtres: Filtres) {
	const base = { q: filtres.q, topic: filtres.topic };
	afficherPastilles($('filtres'), {
		langagesRapides: LANGAGES_RAPIDES,
		langage: filtres.langage,
		hrefLangage: (langage) => hrefRecherche({ ...base, langage }),
		supplement: filtres.topic
			? [
					{
						texte: `topic : ${filtres.topic} ✕`,
						href: hrefRecherche({ q: filtres.q, langage: filtres.langage }),
						libelle: `Retirer le topic ${filtres.topic}`,
					},
				]
			: [],
	});
}

function remplirFormulaire(filtres: Filtres) {
	const champ = document.querySelector<HTMLInputElement>('#formulaire-recherche input[name="q"]');
	if (champ) champ.value = filtres.q;
	// Les champs cachés ne sont envoyés que s'ils ont une valeur : une nouvelle recherche garde le langage et le topic
	for (const nom of ['langage', 'topic'] as const) {
		const cache = document.querySelector<HTMLInputElement>(`#formulaire-recherche input[name="${nom}"]`);
		if (!cache) continue;
		cache.value = filtres[nom];
		cache.disabled = !filtres[nom];
	}
}

function afficherRepos(repos: RepoGithub[]) {
	const liste = $('liste');
	liste.replaceChildren();
	for (const repoGithub of repos) {
		// Le nombre de good first issues n'est pas dans la réponse : l'obtenir demanderait une requête par repo,
		// ce que la limite de GitHub ne permet pas. La carte n'affiche donc pas cette pastille ici.
		const repo = versRepo(repoGithub);
		const carte = depuisModele('modele-repo', {
			nom: repo.nom,
			href: hrefRepo(repo.nom),
			description: repo.description,
			miseajour: repo.miseAJour,
			langage: repo.langage,
			couleur: repo.couleurLangage,
			etoiles: repo.etoiles,
		});

		// La liste des topics du modèle contient une seule pastille : on la copie pour chaque topic
		const listeTopics = carte.querySelector('ul[aria-label="Topics"]');
		const modeleTopic = listeTopics?.firstElementChild;
		if (listeTopics && modeleTopic) {
			listeTopics.replaceChildren();
			for (const topic of repo.topics) {
				const pastille = modeleTopic.cloneNode(true) as HTMLElement;
				(pastille.firstElementChild ?? pastille).textContent = topic;
				listeTopics.append(pastille);
			}
			if (repo.topics.length === 0) listeTopics.remove();
		}

		const item = document.createElement('li');
		item.append(carte);
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
		resultat = await rechercherRepos(construireRequete(filtres), construireOptions(filtres));
	} catch (erreur) {
		$('statut').textContent = '';
		document.querySelector('#erreur p')!.textContent = messageErreur(erreur);
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
