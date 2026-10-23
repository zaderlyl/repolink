// Classes de la grille d'activité, partagées par le composant GrilleContributions (rendu à la construction)
// et par les pages qui dessinent la grille dans le navigateur (profil créateur).

// Du niveau 0 (rien) au niveau 4 (beaucoup)
export const NIVEAUX_GRILLE = ['bg-fond-panneau', 'bg-contribution-1', 'bg-contribution-2', 'bg-contribution-3', 'bg-contribution-4'];

export type TailleGrille = 'petite' | 'grande';

export const TAILLES_GRILLE: Record<TailleGrille, { grille: string; cellule: string; ligne: string }> = {
	// Petite : sur les cartes de profil. Grande : sur la page du profil.
	petite: { grille: 'grid auto-cols-[12px] grid-flow-col gap-x-[5px] gap-y-[3px]', cellule: 'h-[10px] w-3 rounded-xs', ligne: '10px' },
	grande: { grille: 'grid auto-cols-[20px] grid-flow-col gap-x-[13px] gap-y-[6px]', cellule: 'size-5 rounded-[3px]', ligne: '20px' },
};
