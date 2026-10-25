// Token GitHub personnel et facultatif : il vit uniquement dans le navigateur de la personne (page Paramètres)
// et sert à demander plus de requêtes à GitHub (5000 par heure au lieu de 60). Il n'est envoyé qu'à api.github.com.
// Le stockage est passé en paramètre, ce qui permet de tester ces fonctions seules.
import type { Stockage } from './favoris.ts';

export const CLE_TOKEN = 'repolink:token';

// Les formes courantes : « github_pat_… » (fine-grained), « ghp_… » (classique) et « gho_… » (connexion avec GitHub),
// lettres, chiffres et _ seulement
const FORME_TOKEN = /^(github_pat_|ghp_|gho_)[A-Za-z0-9_]{20,255}$/;

export const nettoyerToken = (texte: string) => texte.trim();
export const estTokenValide = (texte: string) => FORME_TOKEN.test(texte);

// « …a1b2 » : de quoi reconnaître son token sans l'afficher en entier
export const finDeToken = (token: string) => `…${token.slice(-4)}`;

// Lecture prudente : un contenu absent ou de mauvaise forme donne null, jamais une erreur
export function lireToken(stockage: Pick<Storage, 'getItem'> | null): string | null {
	try {
		const brut = stockage?.getItem(CLE_TOKEN);
		return brut && estTokenValide(brut) ? brut : null;
	} catch {
		return null;
	}
}

// Renvoie false si le navigateur refuse d'écrire (navigation privée, stockage plein ou bloqué)
export function ecrireToken(stockage: Pick<Storage, 'setItem'> | null, token: string): boolean {
	try {
		if (!stockage) return false;
		stockage.setItem(CLE_TOKEN, token);
		return true;
	} catch {
		return false;
	}
}

export function effacerToken(stockage: Pick<Storage, 'removeItem'> | null): boolean {
	try {
		if (!stockage) return false;
		stockage.removeItem(CLE_TOKEN);
		return true;
	} catch {
		return false;
	}
}


