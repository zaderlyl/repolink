// Outils partagés par les pages qui se remplissent dans le navigateur (Recherche, Good first issues, fiche repo…).
// Chaque page fournit des modèles HTML (<template>) construits avec les vrais composants : ici on les remplit.
import { ErreurGithub } from '../lib/github.ts';
import type { RepoGithub } from '../lib/github.ts';
import { couleurLangage, versRepo } from '../lib/conversion.ts';
import { hrefRepo } from '../lib/adresses.ts';
import { CLASSES_PAGINATION, elementsPagination } from '../lib/pagination.ts';
import { nombrePages } from '../lib/recherche.ts';

export const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const echapper = (texte: string) =>
	texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// Remplit un modèle : chaque __cle__ est remplacé par la valeur (échappée) en une seule passe,
// donc un texte venu de GitHub qui contiendrait « __nom__ » ne peut pas être réinterprété.
export function depuisModele(id: string, valeurs: Record<string, string>): HTMLElement {
	const html = $<HTMLTemplateElement>(id).innerHTML.replace(/__(\w+?)__/g, (morceau, cle: string) =>
		cle in valeurs ? echapper(valeurs[cle]) : morceau,
	);
	const conteneur = document.createElement('template');
	conteneur.innerHTML = html;
	return conteneur.content.firstElementChild as HTMLElement;
}

// Une carte de repo, d'après le modèle « modele-repo » de la page (un <template> avec le composant CarteRepo).
// Le nombre de good first issues n'est pas dans une réponse de recherche : l'obtenir demanderait une requête par repo,
// ce que la limite de GitHub ne permet pas. La carte n'affiche donc pas cette pastille.
export function creerCarteRepo(repoGithub: RepoGithub): HTMLElement {
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
	return carte;
}

// Montre une seule zone parmi `zones` (liste, chargement, aucun résultat, erreur)
export function montrer(zones: string[], visible: string) {
	for (const id of zones) $(id).hidden = id !== visible;
}

export function messageErreur(erreur: unknown): string {
	if (erreur instanceof ErreurGithub) {
		if (erreur.type === 'limite' && erreur.reinitialisation) {
			const heure = erreur.reinitialisation.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
			return `GitHub limite le nombre de recherches. Réessaie vers ${heure}.`;
		}
		return erreur.message;
	}
	return 'Une erreur est survenue. Réessaie dans un instant.';
}

// --- Pastilles de filtre ---

export type Pastille = { texte: string; href: string; libelle?: string };

// Les pastilles toujours présentes (celles de la maquette) ; un autre langage venu de l'Explorer s'ajoute à côté.
// `hrefLangage('')` donne l'adresse sans langage (pastille TOUT). `supplement` : pastilles actives en plus (ex. le topic).
export function afficherPastilles(
	barre: HTMLElement,
	options: {
		langagesRapides: string[];
		langage: string;
		hrefLangage: (langage: string) => string;
		supplement?: Pastille[];
	},
) {
	barre.replaceChildren();
	const { langagesRapides, langage, hrefLangage, supplement = [] } = options;

	const ajouter = (texte: string, href: string, actif: boolean, couleur: string, libelle?: string) => {
		const chip = depuisModele(actif ? 'modele-chip-actif' : 'modele-chip', { texte, href, couleur });
		if (libelle) chip.setAttribute('aria-label', libelle);
		barre.append(chip);
	};

	ajouter('TOUT', hrefLangage(''), !langage, '#8b949e');
	for (const rapide of langagesRapides) {
		ajouter(rapide, hrefLangage(rapide), langage === rapide, couleurLangage(rapide));
	}
	if (langage && !langagesRapides.includes(langage)) {
		// Cliquer sur cette pastille retire le langage
		ajouter(langage, hrefLangage(''), true, couleurLangage(langage), `Retirer le langage ${langage}`);
	}
	for (const pastille of supplement) ajouter(pastille.texte, pastille.href, true, '#8b949e', pastille.libelle);
}

// --- Pagination ---

// Même rendu que le composant Pagination (mêmes classes, src/lib/pagination.ts).
export function afficherPagination(zone: HTMLElement, courante: number, total: number, hrefPage: (page: number) => string) {
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
		a.href = hrefPage(page);
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
	const desactive = (texte: string) => {
		const span = texteSeul(texte, `${c.fleche} ${c.desactive}`);
		span.setAttribute('aria-disabled', 'true');
		return span;
	};

	ajouter(courante > 1 ? lien(courante - 1, '‹ Préc.', `${c.fleche} ${c.survol}`) : desactive('‹ Préc.'));
	for (const element of elementsPagination(courante, pages)) {
		if (element === '…') ajouter(texteSeul('…', `${c.page} ${c.ellipse}`));
		else if (element === courante) {
			const actuelle = texteSeul(String(element), `${c.page} ${c.courante}`);
			actuelle.setAttribute('aria-current', 'page');
			actuelle.setAttribute('aria-label', `Page ${element}`);
			ajouter(actuelle);
		} else ajouter(lien(element, String(element), `${c.page} ${c.survol}`, `Page ${element}`));
	}
	ajouter(courante < pages ? lien(courante + 1, 'Suiv. ›', `${c.fleche} ${c.survol}`) : desactive('Suiv. ›'));

	nav.append(ul);
	zone.append(nav);
}
