// État de connexion : chargé sur toutes les pages (src/layouts/layout.astro).
// Quand quelqu'un est connecté (src/lib/session.ts), la navbar change : « Connexion » devient « Déconnexion »
// et l'avatar prend sa photo GitHub. Tout bouton avec l'attribut data-deconnexion déconnecte.
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
	const lienProfil = document.getElementById('lien-mon-profil');
	const avatar = document.getElementById('avatar-navbar') as HTMLImageElement | null;
	if (!lienConnexion || !boutonDeconnexion || !lienProfil || !avatar) return;

	lienConnexion.hidden = !!session;
	boutonDeconnexion.hidden = !session;
	if (session) {
		avatar.src = session.avatar;
		avatar.hidden = false;
		lienProfil.setAttribute('aria-label', `Mon profil (${session.pseudo})`);
	} else {
		avatar.hidden = true;
		avatar.removeAttribute('src');
		lienProfil.setAttribute('aria-label', 'Mon profil');
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
	if ((evenement.target as Element).closest('[data-deconnexion]')) deconnecter();
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
