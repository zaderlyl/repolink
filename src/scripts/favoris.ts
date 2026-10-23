// Boutons Star : chargé sur toutes les pages (src/layouts/layout.astro).
// Tout bouton qui porte un attribut data-repo="proprietaire/repo" devient interactif : un clic l'ajoute aux favoris
// ou l'en retire, garde le choix dans le navigateur (src/lib/favoris.ts) et prévient avec une notification.
// Il suit aussi les boutons ajoutés plus tard à la page (cartes de résultats, fiche repo) et les autres onglets ouverts.
import { CLE_FAVORIS, basculerFavori, couleurStar, ecrireFavoris, lireFavoris, libelleStar } from '../lib/favoris.ts';
import { afficherToast } from './toasts.ts';

const SELECTEUR = 'button[data-repo]';

// Le stockage peut manquer ou lever une erreur (navigation privée) : on garde alors les favoris en mémoire pour la visite
function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

let favoris = lireFavoris(stockage());

// Met un bouton dans l'état qui correspond aux favoris : texte, couleur et état annoncé aux lecteurs d'écran
function appliquer(bouton: HTMLElement) {
	const nom = bouton.dataset.repo;
	if (!nom) return;
	const actif = nom in favoris;
	bouton.setAttribute('aria-pressed', String(actif));
	// Le nom accessible commence par le texte visible (« Star ») et dit de quel repo il s'agit
	bouton.setAttribute('aria-label', `Star ${nom}`);
	const texte = libelleStar(actif);
	if (bouton.textContent !== texte) bouton.textContent = texte;
	for (const actifOuNon of [true, false]) {
		for (const classe of couleurStar(actifOuNon).split(' ')) bouton.classList.toggle(classe, actifOuNon === actif);
	}
}

function appliquerTous() {
	document.querySelectorAll<HTMLElement>(SELECTEUR).forEach(appliquer);
}

function basculer(nom: string) {
	const ajout = !(nom in favoris);
	favoris = basculerFavori(favoris, nom);
	const enregistre = ecrireFavoris(stockage(), favoris);
	// Tous les boutons du même repo changent ensemble (ex. la fiche et la carte d'un repo similaire)
	appliquerTous();
	if (enregistre) afficherToast(ajout ? 'Repo ajouté aux favoris' : 'Repo retiré des favoris');
	else afficherToast('Favori non enregistré : ton navigateur bloque le stockage.', 'erreur');
}

document.addEventListener('click', (evenement) => {
	const bouton = (evenement.target as Element).closest<HTMLElement>(SELECTEUR);
	if (bouton?.dataset.repo) basculer(bouton.dataset.repo);
});

// Les cartes de la Recherche et la fiche repo se remplissent après le chargement de la page
new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		if (mutation.type === 'attributes') {
			appliquer(mutation.target as HTMLElement);
			continue;
		}
		mutation.addedNodes.forEach((noeud) => {
			if (!(noeud instanceof Element)) return;
			if (noeud.matches(SELECTEUR)) appliquer(noeud as HTMLElement);
			noeud.querySelectorAll<HTMLElement>(SELECTEUR).forEach(appliquer);
		});
	}
}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-repo'] });

// Un favori changé dans un autre onglet : on s'aligne
window.addEventListener('storage', (evenement) => {
	if (evenement.key !== CLE_FAVORIS) return;
	favoris = lireFavoris(stockage());
	appliquerTous();
});

appliquerTous();
