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
	const menuAvatar = document.getElementById('menu-avatar');
	if (!lienConnexion || !boutonDeconnexion || !boutonMenu || !avatar || !menuAvatar) return;

	for (const lien of document.querySelectorAll<HTMLElement>('[data-connecte]')) lien.hidden = !session;
	for (const lien of document.querySelectorAll<HTMLElement>('[data-deconnecte]')) lien.hidden = !!session;
	lienConnexion.hidden = !!session;
	// Sans connexion, pas d'avatar : « Connexion » suffit
	menuAvatar.hidden = !session;
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

// Les menus dépliants (avatar, menu des petits écrans) se ferment avec Échap ou en cliquant ailleurs
const menus = () => [...document.querySelectorAll<HTMLDetailsElement>('details[data-menu]')];

document.addEventListener('click', (evenement) => {
	const cible = evenement.target as Element;
	if (cible.closest('[data-deconnexion]')) deconnecter();
	for (const menu of menus()) if (menu.open && !menu.contains(cible)) menu.open = false;
});

document.addEventListener('keydown', (evenement) => {
	if (evenement.key !== 'Escape') return;
	for (const menu of menus()) {
		if (!menu.open) continue;
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
