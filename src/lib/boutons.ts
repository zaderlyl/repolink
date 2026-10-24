// Classes des variantes du composant Bouton, partagées avec les scripts qui en changent l'apparence au clic
// (par exemple « Suivre » qui devient « Suivi », voir src/scripts/favoris.ts).
export const VARIANTES_BOUTON = {
	primaire: 'border-bouton-primaire-bordure bg-bouton-primaire text-blanc hover:bg-bouton-primaire-survol',
	secondaire: 'border-bordure-defaut bg-fond-champ text-texte-principal hover:bg-bordure-defaut',
	danger: 'border-bordure-defaut bg-fond-champ text-accent-danger hover:bg-bouton-danger-survol hover:text-blanc',
};

export type VarianteBouton = keyof typeof VARIANTES_BOUTON;
