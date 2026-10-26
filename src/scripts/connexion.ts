// Page Connexion : « Se connecter avec GitHub » garde un `state` aléatoire puis envoie chez GitHub (src/lib/oauth.ts) ;
// le retour se fait sur « Connexion réussie ». Une personne déjà connectée voit un message à la place du bouton.
import { lireSession } from '../lib/session.ts';
import { adresseAutorisation, garderEtat, genererEtat } from '../lib/oauth.ts';
import { $ } from './commun.ts';
import { afficherToast } from './toasts.ts';

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

// Bouton GitHub ou message « déjà connecté », selon la session
function afficherEtat() {
	const session = lireSession(stockage());
	$('deja-connecte').hidden = !session;
	$('zone-connexion').hidden = !!session;
	if (session) $('pseudo-connecte').textContent = `@${session.pseudo}`;
}

$('bouton-github').addEventListener('click', () => {
	const etat = genererEtat();
	let stockageEtat: Storage | null = null;
	try {
		stockageEtat = globalThis.sessionStorage ?? null;
	} catch {
		stockageEtat = null;
	}
	if (!garderEtat(stockageEtat, etat)) {
		afficherToast('Connexion impossible : ton navigateur bloque le stockage.', 'erreur');
		return;
	}
	window.location.assign(adresseAutorisation(etat));
});

afficherEtat();
window.addEventListener('session-changee', afficherEtat);
