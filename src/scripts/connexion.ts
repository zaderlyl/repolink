// Page Connexion : vérifie que le pseudo existe sur GitHub, le garde dans le navigateur (src/lib/session.ts)
// puis va sur la page « Connexion réussie ». Une personne déjà connectée voit un message à la place du formulaire.
import { ErreurGithub, recupererProfil } from '../lib/github.ts';
import { versProfil } from '../lib/conversion.ts';
import { ecrireSession, lireSession, nettoyerPseudo } from '../lib/session.ts';
import { estPseudoValide } from '../lib/recherche.ts';
import { $, messageErreur } from './commun.ts';
import { afficherErreur, validerFormulaire } from './formulaire.ts';
import { afficherToast } from './toasts.ts';

const formulaire = $<HTMLFormElement>('formulaire-connexion');
const champ = $<HTMLInputElement>('connexion-pseudo');
const bouton = $<HTMLButtonElement>('bouton-continuer');

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

// Formulaire ou message « déjà connecté », selon la session
function afficherEtat() {
	const session = lireSession(stockage());
	$('deja-connecte').hidden = !session;
	$('zone-connexion').hidden = !!session;
	if (session) $('pseudo-connecte').textContent = `@${session.pseudo}`;
}

async function seConnecter() {
	const pseudo = nettoyerPseudo(champ.value);
	if (!estPseudoValide(pseudo)) {
		afficherErreur(champ, 'Un pseudo GitHub ne contient que des lettres, des chiffres et des tirets (39 au plus).');
		champ.focus();
		return;
	}

	bouton.disabled = true;
	bouton.textContent = 'Vérification…';
	try {
		const utilisateur = await recupererProfil(pseudo);
		const profil = versProfil(utilisateur);
		const enregistre = ecrireSession(stockage(), { pseudo: profil.pseudo, nom: profil.nom, avatar: utilisateur.avatar_url });
		if (!enregistre) {
			afficherToast('Connexion impossible : ton navigateur bloque le stockage.', 'erreur');
			return;
		}
		window.location.assign('/connexion-reussie');
	} catch (erreur) {
		if (erreur instanceof ErreurGithub && erreur.type === 'introuvable') {
			afficherErreur(champ, 'Ce pseudo n’existe pas sur GitHub.');
			champ.focus();
		} else {
			afficherToast(messageErreur(erreur), 'erreur');
		}
	} finally {
		bouton.disabled = false;
		bouton.textContent = 'Continuer';
	}
}

// La vérification du format et du champ vide est faite par validerFormulaire ; seConnecter fait le reste
validerFormulaire(formulaire, () => {
	void seConnecter();
});

afficherEtat();
window.addEventListener('session-changee', afficherEtat);
