// Données de la page Explorer : les catégories de explorer-categories.ts avec leurs vrais nombres de repos.
// Les nombres viennent de src/data/explorer.json, écrit par « npm run donnees » et ignoré par git.
// Quand le fichier manque (premier clone, pas de token), les nombres d'exemple servent de secours.
import { langages as langagesParDefaut, topics as topicsParDefaut } from './explorer-categories.ts';
import type { Categorie } from './explorer-categories.ts';

export type { Categorie };

type DonneesExplorer = {
	genereLe: string;
	langages: Record<string, number>;
	topics: Record<string, number>;
};

// import.meta.glob ne plante pas quand le fichier est absent : il renvoie simplement une liste vide
const fichiers = import.meta.glob<{ default: DonneesExplorer }>('./explorer.json', { eager: true });
const donnees = Object.values(fichiers)[0]?.default;

const avecNombres = (categories: Categorie[], nombres: Record<string, number> | undefined): Categorie[] =>
	categories.map((categorie) => ({ ...categorie, nombre: nombres?.[categorie.nom] ?? categorie.nombre }));

export const langagesExplorer = avecNombres(langagesParDefaut, donnees?.langages);
export const topicsExplorer = avecNombres(topicsParDefaut, donnees?.topics);

// Adresses de la page Recherche (étape 6.3) : le langage ou le topic arrive dans l'adresse
export const hrefLangage = (nom: string) => `/recherche?langage=${encodeURIComponent(nom)}`;
export const hrefTopic = (nom: string) => `/recherche?topic=${encodeURIComponent(nom)}`;

export { formaterRepos } from '../lib/conversion.ts';
