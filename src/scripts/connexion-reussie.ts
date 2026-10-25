// Page Connexion réussie : au retour de GitHub, vérifie le `state`, échange le code contre un token (Worker Cloudflare),
// lit le profil de la personne avec ce token, ouvre la session puis affiche la confirmation (src/lib/oauth.ts).
import { recupererMoi } from '../lib/github.ts';
import { versProfil } from '../lib/conversion.ts';
import { lien } from '../lib/adresses.ts';
import { echangerCode, ErreurConnexion, etatValide, lireRetour, reprendreEtat } from '../lib/oauth.ts';
import { ecrireSession, lireSession } from '../lib/session.ts';
import { ecrireToken } from '../lib/token.ts';
import { $, messageErreur, montrer } from './commun.ts';

const ZONES = ['en-cours', 'message-connexion', 'erreur-connexion'];

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function stockageSession(): Storage | null {
	try {
		return globalThis.sessionStorage ?? null;
	} catch {
		return null;
	}
}

function echec(message: string) {
	$('texte-erreur').textContent = message;
	montrer(ZONES, 'erreur-connexion');
}

function confirmer(pseudo: string) {
	const texte = document.querySelector('#message-connexion p');
	if (texte) texte.textContent = `Tu es connecté en tant que @${pseudo}.`;
	montrer(ZONES, 'message-connexion');
}

async function terminerConnexion(code: string) {
	try {
		const token = await echangerCode(code);
		const utilisateur = await recupererMoi(token);
		const profil = versProfil(utilisateur);
		const session = { pseudo: profil.pseudo, nom: profil.nom, avatar: utilisateur.avatar_url };
		if (!ecrireToken(stockage(), token) || !ecrireSession(stockage(), session)) {
			echec('Ton navigateur bloque le stockage : impossible de garder ta connexion.');
			return;
		}
		confirmer(session.pseudo);
	} catch (erreur) {
		echec(erreur instanceof ErreurConnexion ? erreur.message : messageErreur(erreur));
	}
}

function demarrer() {
	const retour = lireRetour(new URLSearchParams(location.search));

	if (retour.type === 'code') {
		// Le code et le state sortent de la barre d'adresse : un rechargement ne rejoue pas la connexion
		history.replaceState(null, '', lien('/connexion-reussie'));
		if (!etatValide(retour.etat, reprendreEtat(stockageSession()))) {
			echec('Le retour de GitHub ne correspond à aucune demande de ta part. Recommence depuis la page de connexion.');
			return;
		}
		void terminerConnexion(retour.code);
		return;
	}
	if (retour.type === 'refus') {
		history.replaceState(null, '', lien('/connexion-reussie'));
		echec('Tu as annulé la connexion chez GitHub.');
		return;
	}

	// Page ouverte directement : déjà connecté, on confirme ; sinon on va se connecter
	const session = lireSession(stockage());
	if (session) confirmer(session.pseudo);
	else window.location.replace(lien('/connexion'));
}

demarrer();
