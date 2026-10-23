// Boutons Star et Suivre : chargé sur toutes les pages (src/layouts/layout.astro).
//   - un bouton avec data-repo="proprietaire/repo" est un bouton Star (repos en favoris) ;
//   - un bouton avec data-createur="pseudo" est un bouton Suivre (créateurs suivis).
// Un clic ajoute ou retire l'élément, garde le choix dans le navigateur (src/lib/favoris.ts) et prévient par une notification.
// Le script suit aussi les boutons ajoutés plus tard à la page (cartes de résultats, fiche repo) et les autres onglets ouverts.
import { VARIANTES_BOUTON } from '../lib/boutons.ts';
import {
	CLE_CREATEURS,
	CLE_FAVORIS,
	basculerFavori,
	couleurStar,
	ecrireFavoris,
	libelleStar,
	libelleSuivre,
	lireFavoris,
	varianteSuivre,
} from '../lib/favoris.ts';
import type { Favoris } from '../lib/favoris.ts';
import { afficherToast } from './toasts.ts';

// Les classes d'une variante, sous forme de liste (pour les retirer et les remettre une à une)
const classes = (texte: string) => texte.split(' ');

type Sorte = {
	selecteur: string;
	donnee: 'repo' | 'createur';
	cle: string;
	favoris: Favoris;
	// Met le bouton dans l'état voulu (texte, couleurs, nom accessible)
	appliquer: (bouton: HTMLElement, nom: string, actif: boolean) => void;
	messages: { ajout: string; retrait: string };
};

// Le stockage peut manquer ou lever une erreur (navigation privée) : on garde alors les listes en mémoire pour la visite
function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function changerTexte(bouton: HTMLElement, texte: string) {
	if (bouton.textContent !== texte) bouton.textContent = texte;
}

const SORTES: Sorte[] = [
	{
		selecteur: 'button[data-repo]',
		donnee: 'repo',
		cle: CLE_FAVORIS,
		favoris: lireFavoris(stockage(), CLE_FAVORIS),
		appliquer(bouton, nom, actif) {
			// Le nom accessible commence par le texte visible (« Star ») et dit de quel repo il s'agit
			bouton.setAttribute('aria-label', `Star ${nom}`);
			changerTexte(bouton, libelleStar(actif));
			for (const etat of [true, false]) {
				for (const classe of classes(couleurStar(etat))) bouton.classList.toggle(classe, etat === actif);
			}
		},
		messages: { ajout: 'Repo ajouté aux favoris', retrait: 'Repo retiré des favoris' },
	},
	{
		selecteur: 'button[data-createur]',
		donnee: 'createur',
		cle: CLE_CREATEURS,
		favoris: lireFavoris(stockage(), CLE_CREATEURS),
		appliquer(bouton, nom, actif) {
			bouton.setAttribute('aria-label', `Suivre ${nom}`);
			changerTexte(bouton, libelleSuivre(actif));
			// « Suivre » est vert (primaire), « Suivi » est gris (secondaire)
			const voulue = varianteSuivre(actif);
			const autre = voulue === 'primaire' ? 'secondaire' : 'primaire';
			for (const classe of classes(VARIANTES_BOUTON[autre])) bouton.classList.remove(classe);
			for (const classe of classes(VARIANTES_BOUTON[voulue])) bouton.classList.add(classe);
		},
		messages: { ajout: 'Tu suis ce créateur', retrait: 'Tu ne suis plus ce créateur' },
	},
];

function appliquer(sorte: Sorte, bouton: HTMLElement) {
	const nom = bouton.dataset[sorte.donnee];
	if (!nom) return;
	const actif = nom in sorte.favoris;
	bouton.setAttribute('aria-pressed', String(actif));
	sorte.appliquer(bouton, nom, actif);
}

function appliquerTous(sorte: Sorte) {
	document.querySelectorAll<HTMLElement>(sorte.selecteur).forEach((bouton) => appliquer(sorte, bouton));
}

function basculer(sorte: Sorte, nom: string) {
	const ajout = !(nom in sorte.favoris);
	sorte.favoris = basculerFavori(sorte.favoris, nom);
	const enregistre = ecrireFavoris(stockage(), sorte.favoris, sorte.cle);
	// Tous les boutons du même élément changent ensemble (ex. la fiche et la carte d'un repo similaire)
	appliquerTous(sorte);
	if (enregistre) afficherToast(ajout ? sorte.messages.ajout : sorte.messages.retrait);
	else afficherToast('Choix non enregistré : ton navigateur bloque le stockage.', 'erreur');
}

document.addEventListener('click', (evenement) => {
	const cible = evenement.target as Element;
	for (const sorte of SORTES) {
		const bouton = cible.closest<HTMLElement>(sorte.selecteur);
		const nom = bouton?.dataset[sorte.donnee];
		if (nom) basculer(sorte, nom);
	}
});

// Les cartes de la Recherche, la fiche repo et ses onglets se remplissent après le chargement de la page
new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const sorte of SORTES) {
			if (mutation.type === 'attributes') {
				if (mutation.target instanceof HTMLElement && mutation.target.matches(sorte.selecteur)) appliquer(sorte, mutation.target);
				continue;
			}
			mutation.addedNodes.forEach((noeud) => {
				if (!(noeud instanceof Element)) return;
				if (noeud.matches(sorte.selecteur)) appliquer(sorte, noeud as HTMLElement);
				noeud.querySelectorAll<HTMLElement>(sorte.selecteur).forEach((bouton) => appliquer(sorte, bouton));
			});
		}
	}
}).observe(document.body, {
	childList: true,
	subtree: true,
	attributes: true,
	attributeFilter: ['data-repo', 'data-createur'],
});

// Un choix fait dans un autre onglet : on s'aligne
window.addEventListener('storage', (evenement) => {
	for (const sorte of SORTES) {
		if (evenement.key !== sorte.cle) continue;
		sorte.favoris = lireFavoris(stockage(), sorte.cle);
		appliquerTous(sorte);
	}
});

for (const sorte of SORTES) appliquerTous(sorte);
