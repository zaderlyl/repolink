// Préférences gardées dans le navigateur (page Paramètres) : langages favoris, niveau, filtres et thème.
// Elles s'appliquent à la Recherche et à « Pour toi ». Ces fonctions ne touchent pas à la page :
// le stockage est passé en paramètre, ce qui permet de les tester seules.
import type { Stockage } from './favoris.ts';

export const CLE_PREFERENCES = 'repolink:preferences';

export type Niveau = 'debutant' | 'intermediaire' | 'avance';
export type Theme = 'sombre' | 'clair' | 'auto';

export type Preferences = {
	langages: string[]; // langages favoris
	niveau: Niveau;
	projetsActifs: boolean; // ne montrer que les repos mis à jour récemment
	masquerArchives: boolean; // cacher les repos archivés (on ne peut plus y contribuer)
	theme: Theme;
};

export const NIVEAUX: { id: Niveau; texte: string }[] = [
	{ id: 'debutant', texte: 'Débutant' },
	{ id: 'intermediaire', texte: 'Intermédiaire' },
	{ id: 'avance', texte: 'Avancé' },
];

// Les valeurs de départ : celles de la maquette, sauf les repos archivés, masqués par défaut (on ne peut pas y contribuer)
export const PREFERENCES_PAR_DEFAUT: Preferences = {
	langages: [],
	niveau: 'debutant',
	projetsActifs: true,
	masquerArchives: true,
	theme: 'sombre',
};

const MAX_LANGAGES = 12;
const NOM_LANGAGE = /^[\p{L}\p{N}+#._ -]{1,40}$/u;

const estNiveau = (valeur: unknown): valeur is Niveau => NIVEAUX.some((n) => n.id === valeur);
const estTheme = (valeur: unknown): valeur is Theme => valeur === 'sombre' || valeur === 'clair' || valeur === 'auto';

// Lecture prudente : tout ce qui est absent ou abîmé retombe sur la valeur par défaut, jamais une erreur
export function lirePreferences(stockage: Stockage | null): Preferences {
	const defaut = { ...PREFERENCES_PAR_DEFAUT, langages: [] as string[] };
	try {
		const brut = stockage?.getItem(CLE_PREFERENCES);
		if (!brut) return defaut;
		const donnees: unknown = JSON.parse(brut);
		if (!donnees || typeof donnees !== 'object' || Array.isArray(donnees)) return defaut;
		const d = donnees as Record<string, unknown>;
		const langages = Array.isArray(d.langages)
			? [...new Set(d.langages.filter((l): l is string => typeof l === 'string' && NOM_LANGAGE.test(l)))].slice(0, MAX_LANGAGES)
			: defaut.langages;
		return {
			langages,
			niveau: estNiveau(d.niveau) ? d.niveau : defaut.niveau,
			projetsActifs: typeof d.projetsActifs === 'boolean' ? d.projetsActifs : defaut.projetsActifs,
			masquerArchives: typeof d.masquerArchives === 'boolean' ? d.masquerArchives : defaut.masquerArchives,
			theme: estTheme(d.theme) ? d.theme : defaut.theme,
		};
	} catch {
		return defaut;
	}
}

// Renvoie false si le navigateur refuse d'écrire (navigation privée, stockage plein ou bloqué)
export function ecrirePreferences(stockage: Stockage | null, preferences: Preferences): boolean {
	try {
		if (!stockage) return false;
		stockage.setItem(CLE_PREFERENCES, JSON.stringify(preferences));
		return true;
	} catch {
		return false;
	}
}

// « JavaScript, Python » ou « Aucun » : le texte du sélecteur de langages
export const resumeLangages = (langages: string[]) => (langages.length > 0 ? langages.join(', ') : 'Aucun');

// Un repo « actif » a reçu un commit dans les 90 derniers jours
export const JOURS_ACTIF = 90;
export function dateLimiteActif(maintenant: Date = new Date()): string {
	return new Date(maintenant.getTime() - JOURS_ACTIF * 24 * 3600 * 1000).toISOString().slice(0, 10);
}
