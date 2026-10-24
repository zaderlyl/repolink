// Page Mon profil : le profil de la personne connectée (src/lib/session.ts).
// Sans connexion on renvoie vers /connexion ; si la personne se déconnecte pendant qu'elle est sur la page, aussi.
// Les modèles HTML (<template>) viennent de src/components/profil-vue.astro.
import { CLE_CREATEURS, CLE_FAVORIS, lireFavoris } from '../lib/favoris.ts';
import { lireSession } from '../lib/session.ts';
import { chargerProfil, lignesMoi } from './profil-commun.ts';

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

const session = lireSession(stockage());
if (!session) {
	window.location.replace('/connexion');
} else {
	// « Favoris (N) » compte les repos étoilés et les créateurs suivis, comme la page Favoris
	const favoris = Object.keys(lireFavoris(stockage(), CLE_FAVORIS)).length + Object.keys(lireFavoris(stockage(), CLE_CREATEURS)).length;
	void chargerProfil({ pseudo: session.pseudo, titrePage: 'Mon profil', lignes: lignesMoi(favoris) });
	window.addEventListener('session-changee', () => window.location.replace('/connexion'));
}
