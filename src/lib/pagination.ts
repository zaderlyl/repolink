// Logique et styles de la pagination, partagés par le composant Astro (rendu à la construction)
// et par les pages qui affichent leurs résultats dans le navigateur (Recherche, Good first issues).

export type ElementPagination = number | '…';

// Au-delà de 5 pages, on garde la première, la dernière et celles autour de la courante.
export function elementsPagination(courante: number, total: number): ElementPagination[] {
	const debut = Math.max(2, courante - 1);
	const fin = Math.min(total - 1, courante + 1);
	const autour = Array.from({ length: Math.max(0, fin - debut + 1) }, (_, i) => debut + i);
	if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
	return [1, ...(debut > 2 ? ['…' as const] : []), ...autour, ...(fin < total - 1 ? ['…' as const] : []), total];
}

export const CLASSES_PAGINATION = {
	page: 'inline-flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors',
	fleche: 'inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium transition-colors',
	survol: 'hover:bg-bordure-defaut',
	courante: 'bg-bouton-page-active text-blanc',
	desactive: 'text-texte-secondaire opacity-50',
	ellipse: 'text-texte-secondaire',
};
