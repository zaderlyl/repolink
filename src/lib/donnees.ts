// Toutes les données que Repolink garde dans le navigateur de la personne : connexion, favoris, créateurs suivis, préférences.
// Il n'y a pas de compte sur un serveur : « supprimer mon compte » efface ces données-là.
import { CLE_CREATEURS, CLE_FAVORIS } from './favoris.ts';
import { CLE_PREFERENCES } from './preferences.ts';
import { CLE_SESSION } from './session.ts';

export const CLES_DONNEES = [CLE_SESSION, CLE_FAVORIS, CLE_CREATEURS, CLE_PREFERENCES];

type StockageEffacable = { removeItem: (cle: string) => void };

// Renvoie false si le navigateur refuse (stockage bloqué) ; chaque clé est tentée même si l'une échoue
export function effacerToutesLesDonnees(stockage: StockageEffacable | null): boolean {
	if (!stockage) return false;
	let tout = true;
	for (const cle of CLES_DONNEES) {
		try {
			stockage.removeItem(cle);
		} catch {
			tout = false;
		}
	}
	return tout;
}
