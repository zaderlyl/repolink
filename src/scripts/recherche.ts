// Page Recherche : lit l'adresse, interroge l'API de GitHub (avec cache) et remplit la page.
// La page Astro (src/pages/recherche.astro) fournit les modèles HTML (<template>) : on les remplit ici,
// ainsi les cartes et les pastilles gardent exactement le style des composants.
import { ErreurGithub, rechercherRepos } from '../lib/github.ts';
import type { ResultatRecherche, RepoGithub } from '../lib/github.ts';
import { couleurLangage, formaterRepos, versRepo } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { hrefRepo } from '../lib/adresses.ts';
import { CLASSES_PAGINATION, elementsPagination } from '../lib/pagination.ts';
import { construireOptions, construireRequete, hrefRecherche, lireFiltres, nombrePages } from '../lib/recherche.ts';
import type { Filtres } from '../lib/recherche.ts';

// Les pastilles toujours présentes (celles de la maquette) ; un autre langage venu de l'Explorer s'ajoute à côté
const LANGAGES_RAPIDES = ['JavaScript', 'Python'];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const echapper = (texte: string) =>
	texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// Remplit un modèle : chaque __cle__ est remplacé par la valeur (échappée) en une seule passe,
// donc un texte venu de GitHub qui contiendrait « __nom__ » ne peut pas être réinterprété.
function depuisModele(id: string, valeurs: Record<string, string>): HTMLElement {
	const html = $<HTMLTemplateElement>(id).innerHTML.replace(/__(\w+?)__/g, (morceau, cle: string) =>
		cle in valeurs ? echapper(valeurs[cle]) : morceau,
	);
	const conteneur = document.createElement('template');
	conteneur.innerHTML = html;
	return conteneur.content.firstElementChild as HTMLElement;
}

// --- Filtres : pastilles et formulaire ---

function afficherFiltres(filtres: Filtres) {
	const barre = $('filtres');
	barre.replaceChildren();

	const ajouterChip = (texte: string, href: string, actif: boolean, couleur: string, libelle?: string) => {
		const chip = depuisModele(actif ? 'modele-chip-actif' : 'modele-chip', { texte, href, couleur });
		if (libelle) chip.setAttribute('aria-label', libelle);
		barre.append(chip);
	};

	const base = { q: filtres.q, topic: filtres.topic };
	ajouterChip('TOUT', hrefRecherche(base), !filtres.langage, '#8b949e');
	for (const langage of LANGAGES_RAPIDES) {
		ajouterChip(langage, hrefRecherche({ ...base, langage }), filtres.langage === langage, couleurLangage(langage));
	}
	if (filtres.langage && !LANGAGES_RAPIDES.includes(filtres.langage)) {
		// Cliquer sur cette pastille retire le langage
		ajouterChip(filtres.langage, hrefRecherche(base), true, couleurLangage(filtres.langage), `Retirer le langage ${filtres.langage}`);
	}
	if (filtres.topic) {
		ajouterChip(
			`topic : ${filtres.topic} ✕`,
			hrefRecherche({ q: filtres.q, langage: filtres.langage }),
			true,
			'#8b949e',
			`Retirer le topic ${filtres.topic}`,
		);
	}
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

// --- Résultats ---

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

function afficherPagination(filtres: Filtres, total: number) {
	const zone = $('pagination');
	zone.replaceChildren();
	const pages = nombrePages(total);
	if (pages <= 1) return;

	const c = CLASSES_PAGINATION;
	const nav = document.createElement('nav');
	nav.setAttribute('aria-label', 'Pagination');
	const ul = document.createElement('ul');
	ul.className = 'flex items-center gap-1';

	const ajouter = (element: HTMLElement) => {
		const li = document.createElement('li');
		li.append(element);
		ul.append(li);
	};
	const lien = (page: number, texte: string, classes: string, libelle?: string) => {
		const a = document.createElement('a');
		a.href = hrefRecherche({ ...filtres, page });
		a.textContent = texte;
		a.className = classes;
		if (libelle) a.setAttribute('aria-label', libelle);
		return a;
	};
	const texteSeul = (texte: string, classes: string) => {
		const span = document.createElement('span');
		span.textContent = texte;
		span.className = classes;
		return span;
	};

	if (filtres.page > 1) ajouter(lien(filtres.page - 1, '‹ Préc.', `${c.fleche} ${c.survol}`));
	else ajouter(Object.assign(texteSeul('‹ Préc.', `${c.fleche} ${c.desactive}`), { ariaDisabled: 'true' }));

	for (const element of elementsPagination(filtres.page, pages)) {
		if (element === '…') ajouter(texteSeul('…', `${c.page} ${c.ellipse}`));
		else if (element === filtres.page) {
			const courante = texteSeul(String(element), `${c.page} ${c.courante}`);
			courante.setAttribute('aria-current', 'page');
			courante.setAttribute('aria-label', `Page ${element}`);
			ajouter(courante);
		} else ajouter(lien(element, String(element), `${c.page} ${c.survol}`, `Page ${element}`));
	}

	if (filtres.page < pages) ajouter(lien(filtres.page + 1, 'Suiv. ›', `${c.fleche} ${c.survol}`));
	else ajouter(Object.assign(texteSeul('Suiv. ›', `${c.fleche} ${c.desactive}`), { ariaDisabled: 'true' }));

	nav.append(ul);
	zone.append(nav);
}

// Montre une seule zone à la fois : liste, chargement, aucun résultat ou erreur
function montrer(zone: 'liste' | 'chargement' | 'vide' | 'erreur') {
	for (const id of ['liste', 'chargement', 'vide', 'erreur']) $(id).hidden = id !== zone;
}

function messageErreur(erreur: unknown): string {
	if (erreur instanceof ErreurGithub) {
		if (erreur.type === 'limite' && erreur.reinitialisation) {
			const heure = erreur.reinitialisation.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
			return `GitHub limite le nombre de recherches. Réessaie vers ${heure}.`;
		}
		return erreur.message;
	}
	return 'Une erreur est survenue. Réessaie dans un instant.';
}

async function charger() {
	purgerCache();
	const filtres = lireFiltres(new URLSearchParams(location.search));
	afficherFiltres(filtres);
	remplirFormulaire(filtres);
	montrer('chargement');

	let resultat: ResultatRecherche<RepoGithub>;
	try {
		resultat = await rechercherRepos(construireRequete(filtres), construireOptions(filtres));
	} catch (erreur) {
		$('statut').textContent = '';
		document.querySelector('#erreur p')!.textContent = messageErreur(erreur);
		montrer('erreur');
		return;
	}

	// Page trop loin (adresse tapée à la main) : on va à la dernière page qui existe
	const pages = nombrePages(resultat.total_count);
	if (filtres.page > pages) {
		location.replace(hrefRecherche({ ...filtres, page: pages }));
		return;
	}

	$('statut').textContent = formaterRepos(resultat.total_count);
	if (resultat.items.length === 0) {
		$('statut').textContent = ''; // le message « Aucun repo trouvé » suffit
		montrer('vide');
		return;
	}
	afficherRepos(resultat.items);
	afficherPagination(filtres, resultat.total_count);
	montrer('liste');
}

$('reessayer').addEventListener('click', () => location.reload());
charger();
