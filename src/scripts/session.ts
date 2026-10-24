// État de connexion : chargé sur toutes les pages (src/layouts/layout.astro).
// Quand quelqu'un est connecté (src/lib/session.ts), la navbar change : « Connexion » devient « Déconnexion »
// et l'avatar prend sa photo GitHub ; « Pour toi » et « Favoris » n'apparaissent que connecté. Tout bouton avec l'attribut data-deconnexion déconnecte.
// Les pages qui dépendent de la connexion écoutent l'événement « session-changee » (déclenché ici).
import { effacerSession, lireSession } from '../lib/session.ts';
import { afficherToast } from './toasts.ts';

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function rafraichirNavbar() {
	const session = lireSession(stockage());
	const lienConnexion = document.getElementById('lien-connexion');
	const boutonDeconnexion = document.getElementById('bouton-deconnexion');
	const boutonMenu = document.getElementById('bouton-menu-avatar');
	const avatar = document.getElementById('avatar-navbar') as HTMLImageElement | null;
	if (!lienConnexion || !boutonDeconnexion || !boutonMenu || !avatar) return;

	for (const lien of document.querySelectorAll<HTMLElement>('[data-connecte]')) lien.hidden = !session;
	lienConnexion.hidden = !!session;
	boutonDeconnexion.hidden = !session;
	if (session) {
		avatar.src = session.avatar;
		avatar.hidden = false;
		boutonMenu.setAttribute('aria-label', `Mon compte (${session.pseudo})`);
	} else {
		avatar.hidden = true;
		avatar.removeAttribute('src');
		boutonMenu.setAttribute('aria-label', 'Mon compte');
	}
}

function deconnecter() {
	if (!effacerSession(stockage())) {
		afficherToast('Déconnexion impossible : ton navigateur bloque le stockage.', 'erreur');
		return;
	}
	rafraichirNavbar();
	window.dispatchEvent(new CustomEvent('session-changee'));
	afficherToast('Déconnexion réussie');
}

document.addEventListener('click', (evenement) => {
	const cible = evenement.target as Element;
	if (cible.closest('[data-deconnexion]')) deconnecter();
	// Le menu de l'avatar se ferme quand on clique ailleurs
	const menu = document.getElementById('menu-avatar') as HTMLDetailsElement | null;
	if (menu?.open && !menu.contains(cible)) menu.open = false;
});

document.addEventListener('keydown', (evenement) => {
	const menu = document.getElementById('menu-avatar') as HTMLDetailsElement | null;
	if (evenement.key === 'Escape' && menu?.open) {
		menu.open = false;
		menu.querySelector('summary')?.focus();
	}
});

// Une déconnexion ou une suppression de données venue d'ailleurs sur la même page (page Paramètres) : on s'aligne
window.addEventListener('session-changee', rafraichirNavbar);

// Connexion ou déconnexion dans un autre onglet : on s'aligne
window.addEventListener('storage', (evenement) => {
	if (evenement.key !== 'repolink:session') return;
	rafraichirNavbar();
	window.dispatchEvent(new CustomEvent('session-changee'));
});

rafraichirNavbar();
