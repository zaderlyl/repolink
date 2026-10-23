// Catégories de la page Explorer : les langages et les topics proposés, dans l'ordre de la maquette.
// `nombre` : nombre de repos d'exemple, utilisé tant que « npm run donnees » n'a pas écrit les vrais
// nombres dans src/data/explorer.json (voir explorer.ts).
// Ce fichier est lu aussi par le script de données (Node) : il ne doit donc contenir que des données simples.

export type Categorie = {
	nom: string; // nom du langage, ou du topic tel qu'il existe sur GitHub
	couleur: string; // pastille de la carte
	nombre: number;
};

export const langages: Categorie[] = [
	{ nom: 'JavaScript', couleur: '#f1e05a', nombre: 48210 },
	{ nom: 'Python', couleur: '#3572a5', nombre: 41880 },
	{ nom: 'TypeScript', couleur: '#3178c6', nombre: 36450 },
	{ nom: 'CSS', couleur: '#563d7c', nombre: 22300 },
	{ nom: 'HTML', couleur: '#e34c26', nombre: 19740 },
	{ nom: 'Go', couleur: '#00add8', nombre: 12120 },
	{ nom: 'Rust', couleur: '#dea584', nombre: 9860 },
	{ nom: 'Java', couleur: '#b07219', nombre: 31500 },
	{ nom: 'PHP', couleur: '#4f5d95', nombre: 14230 },
	{ nom: 'Ruby', couleur: '#701516', nombre: 8400 },
	{ nom: 'Swift', couleur: '#f05138', nombre: 6770 },
	{ nom: 'Kotlin', couleur: '#a97bff', nombre: 7320 },
];

export const topics: Categorie[] = [
	{ nom: 'react', couleur: '#61dafb', nombre: 31200 },
	{ nom: 'api', couleur: '#3fb950', nombre: 24800 },
	{ nom: 'cli', couleur: '#8b949e', nombre: 18450 },
	{ nom: 'css', couleur: '#563d7c', nombre: 22300 },
	{ nom: 'accessibility', couleur: '#58a6ff', nombre: 9640 },
	{ nom: 'machine-learning', couleur: '#d45a9a', nombre: 27900 },
	{ nom: 'gamedev', couleur: '#fd8c73', nombre: 12700 },
	{ nom: 'docker', couleur: '#2496ed', nombre: 20100 },
	{ nom: 'typescript', couleur: '#3178c6', nombre: 36450 },
	{ nom: 'design-system', couleur: '#a371f7', nombre: 7380 },
	{ nom: 'testing', couleur: '#e3b341', nombre: 15600 },
	{ nom: 'documentation', couleur: '#00b8c8', nombre: 11900 },
];
