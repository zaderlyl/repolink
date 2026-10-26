// Session « connexion avec GitHub » gardée dans le navigateur, sans serveur ni mot de passe :
// on retient le pseudo GitHub (public) de la personne, son nom et sa photo pour la navbar et les pages « Pour toi », « Mon profil »…
// Une session n'existe qu'avec le token de la connexion : une ancienne session sans token (connexion par pseudo) compte comme déconnectée.
// Ces fonctions ne touchent pas à la page : le stockage est passé en paramètre, ce qui permet de les tester seules.
import { estPseudoValide } from './recherche.ts';
import { lireToken } from './token.ts';

export const CLE_SESSION = 'repolink:session';

export type Session = {
	pseudo: string; // sans le @
	nom: string;
	avatar: string; // adresse https de la photo GitHub
};

export type StockageSession = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Lecture prudente : un stockage absent, vide ou abîmé donne « pas connecté », jamais une erreur.
// La photo doit être une adresse https (elle sert de src d'image : on n'accepte pas n'importe quoi).
export function lireSession(stockage: StockageSession | null): Session | null {
	try {
		const brut = stockage?.getItem(CLE_SESSION);
		if (!brut || !lireToken(stockage)) return null;
		const donnees: unknown = JSON.parse(brut);
		if (!donnees || typeof donnees !== 'object') return null;
		const { pseudo, nom, avatar } = donnees as Record<string, unknown>;
		if (typeof pseudo !== 'string' || !estPseudoValide(pseudo)) return null;
		if (typeof nom !== 'string' || typeof avatar !== 'string' || !avatar.startsWith('https://')) return null;
		return { pseudo, nom, avatar };
	} catch {
		return null;
	}
}

// Renvoie false si le navigateur refuse d'écrire (navigation privée, stockage plein ou bloqué)
export function ecrireSession(stockage: StockageSession | null, session: Session): boolean {
	try {
		if (!stockage) return false;
		stockage.setItem(CLE_SESSION, JSON.stringify(session));
		return true;
	} catch {
		return false;
	}
}

export function effacerSession(stockage: StockageSession | null): boolean {
	try {
		if (!stockage) return false;
		stockage.removeItem(CLE_SESSION);
		return true;
	} catch {
		return false;
	}
}

// Ce que l'utilisateur tape : « @Torvalds  » devient « Torvalds »
export const nettoyerPseudo = (saisie: string) => saisie.trim().replace(/^@/, '');
