// Cache des réponses de l'API : GitHub limite à 60 requêtes par heure sans token,
// donc une même requête ne doit partir qu'une fois pendant `DUREE_PAR_DEFAUT`.
// Les réponses sont gardées dans le localStorage du navigateur (elles survivent au rechargement)
// et en mémoire (utile quand le localStorage est indisponible : navigation privée, build Node…).

export const DUREE_PAR_DEFAUT = 60 * 60 * 1000; // 1 heure : la limite de GitHub se compte par heure

const PREFIXE = 'repolink:cache:';

type Entree = { expire: number; valeur: unknown };

const memoire = new Map<string, Entree>();
// Requêtes en cours : deux appels identiques en même temps ne font qu'une requête
const enCours = new Map<string, Promise<unknown>>();

// Le localStorage peut manquer ou lever une erreur : le cache doit alors se taire, pas casser la page
function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function lire(cle: string): Entree | null {
	const enMemoire = memoire.get(cle);
	if (enMemoire) return enMemoire;
	try {
		const brut = stockage()?.getItem(PREFIXE + cle);
		return brut ? (JSON.parse(brut) as Entree) : null;
	} catch {
		return null;
	}
}

function ecrire(cle: string, entree: Entree) {
	memoire.set(cle, entree);
	try {
		stockage()?.setItem(PREFIXE + cle, JSON.stringify(entree));
	} catch {
		// Stockage plein ou refusé : on garde seulement la version en mémoire
	}
}

// Supprime les entrées du cache dont la durée est passée (à appeler de temps en temps)
export function purgerCache() {
	const maintenant = Date.now();
	for (const [cle, entree] of memoire) {
		if (entree.expire <= maintenant) memoire.delete(cle);
	}
	const stock = stockage();
	if (!stock) return;
	try {
		for (const cle of Object.keys(stock)) {
			if (!cle.startsWith(PREFIXE)) continue;
			const entree = JSON.parse(stock.getItem(cle) ?? 'null') as Entree | null;
			if (!entree || entree.expire <= maintenant) stock.removeItem(cle);
		}
	} catch {
		// Rien à purger si le stockage est inaccessible
	}
}

// Renvoie la valeur en cache si elle est encore fraîche, sinon appelle `charger` et la garde.
// Une erreur n'est jamais mise en cache : le prochain appel réessaie.
export async function avecCache<T>(cle: string, charger: () => Promise<T>, duree = DUREE_PAR_DEFAUT): Promise<T> {
	const entree = lire(cle);
	if (entree && entree.expire > Date.now()) return entree.valeur as T;

	const demande = enCours.get(cle);
	if (demande) return demande as Promise<T>;

	const nouvelle = charger()
		.then((valeur) => {
			ecrire(cle, { expire: Date.now() + duree, valeur });
			return valeur;
		})
		.finally(() => enCours.delete(cle));
	enCours.set(cle, nouvelle);
	return nouvelle;
}
