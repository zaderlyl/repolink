// Favoris gardés dans le navigateur, sans compte : une liste { "nom": "date d'ajout ISO" } par sorte d'élément.
//   - repos « starrés » : { "proprietaire/repo": … }  (clé CLE_FAVORIS)
//   - créateurs suivis  : { "pseudo": … }              (clé CLE_CREATEURS)
// Les pages Favoris de l'étape 9 reliront ces mêmes données. Ces fonctions ne touchent pas à la page :
// le stockage est passé en paramètre, ce qui permet de les tester seules.

export const CLE_FAVORIS = 'repolink:favoris';
export const CLE_CREATEURS = 'repolink:createurs';

export type Favoris = Record<string, string>;
export type Stockage = Pick<Storage, 'getItem' | 'setItem'>;

// Lecture prudente : un stockage absent, vide ou abîmé donne une liste vide, jamais une erreur
export function lireFavoris(stockage: Stockage | null, cle: string = CLE_FAVORIS): Favoris {
	try {
		const brut = stockage?.getItem(cle);
		if (!brut) return {};
		const donnees: unknown = JSON.parse(brut);
		if (!donnees || typeof donnees !== 'object' || Array.isArray(donnees)) return {};
		const favoris: Favoris = {};
		for (const [nom, date] of Object.entries(donnees)) {
			if (typeof date === 'string') favoris[nom] = date;
		}
		return favoris;
	} catch {
		return {};
	}
}

// Renvoie false si le navigateur refuse d'écrire (navigation privée, stockage plein ou bloqué)
export function ecrireFavoris(stockage: Stockage | null, favoris: Favoris, cle: string = CLE_FAVORIS): boolean {
	try {
		if (!stockage) return false;
		stockage.setItem(cle, JSON.stringify(favoris));
		return true;
	} catch {
		return false;
	}
}

// Ajoute l'élément s'il n'y est pas, le retire sinon. Renvoie la nouvelle liste (l'ancienne n'est pas modifiée).
export function basculerFavori(favoris: Favoris, nom: string, maintenant: Date = new Date()): Favoris {
	const suivant = { ...favoris };
	if (nom in suivant) delete suivant[nom];
	else suivant[nom] = maintenant.toISOString();
	return suivant;
}

// Textes et couleurs des boutons, partagés par les composants (rendu à la construction) et le script (clic)
export const libelleStar = (actif: boolean) => (actif ? '★ Starred' : '☆ Star');
export const COULEUR_STAR_ACTIF = 'text-accent-etoile';
export const COULEUR_STAR_INACTIF = 'text-texte-principal';
export const couleurStar = (actif: boolean) => (actif ? COULEUR_STAR_ACTIF : COULEUR_STAR_INACTIF);

export const libelleSuivre = (actif: boolean) => (actif ? 'Suivi' : 'Suivre');
// « Suivre » est un bouton primaire (vert), « Suivi » un bouton secondaire (gris) : voir src/lib/boutons.ts
export const varianteSuivre = (actif: boolean) => (actif ? 'secondaire' : 'primaire') as 'primaire' | 'secondaire';
