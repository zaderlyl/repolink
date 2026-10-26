// Issues des pages « Good first issues » par langage. Les données sont dans langages.json, écrit par « npm run donnees ».
// Ce fichier n'est pas dans git : sans lui (première installation), les pages s'affichent sans liste d'issues.

export type IssueLangage = {
	titre: string;
	repo: string; // « proprietaire/repo »
	url: string; // page de l'issue sur GitHub
	creeeLe: string; // date ISO
};

export type DonneesLangage = {
	total: number; // issues ouvertes sur tout GitHub
	issues: IssueLangage[]; // les plus récemment mises à jour
};

type FichierLangages = { genereLe: string; langages: Record<string, DonneesLangage> };

// import.meta.glob ne plante pas quand le fichier est absent : il renvoie simplement une liste vide
const fichiers = import.meta.glob<{ default: FichierLangages }>('./langages.json', { eager: true });
const donnees = Object.values(fichiers)[0]?.default;

export const issuesParLangage: Record<string, DonneesLangage> = donnees?.langages ?? {};
export const genereLe: string | null = donnees?.genereLe || null;
