// Données de la page d'accueil.
// Les vraies données viennent de src/data/accueil.json, écrit par « npm run donnees » (API GitHub).
// Ce fichier est ignoré par git : quand il manque (premier clone, pas de token), les données factices
// ci-dessous servent de secours pour que le site se construise quand même.

export type Repo = {
	nom: string; // « proprietaire/repo »
	description: string;
	langage: string;
	couleurLangage: string;
	etoiles: string;
	topics: string[];
	goodFirstIssues: number;
	miseAJour: string;
};

export type Issue = {
	titre: string;
	repo: string;
	ouverte: string;
};

export type Langage = {
	nom: string;
	couleur: string;
};

export type Profil = {
	nom: string;
	pseudo: string; // sans le @
	abonnes: string;
	bio: string;
};

// Adresses des pages (elles seront créées aux étapes 6 et 7)
export { hrefRepo, hrefProfil } from '../lib/adresses.ts';

const reposFactices: Repo[] = [
	{
		nom: 'lunaris/pixel-kit',
		description: 'Kit de composants UI minimaliste en CSS pur, sans dépendance.',
		langage: 'JavaScript',
		couleurLangage: '#f1e05a',
		etoiles: '1.2k',
		topics: ['css', 'ui-kit'],
		goodFirstIssues: 3,
		miseAJour: 'il y a 2 jours',
	},
	{
		nom: 'ada-dev/study-planner',
		description: 'Planificateur de révisions en Python avec export vers ton calendrier.',
		langage: 'Python',
		couleurLangage: '#3572a5',
		etoiles: '842',
		topics: ['python', 'cli'],
		goodFirstIssues: 2,
		miseAJour: 'il y a 2 jours',
	},
	{
		nom: 'nomad/api-starter',
		description: "Squelette d'API REST typé, avec tests et documentation prêts à l'emploi.",
		langage: 'TypeScript',
		couleurLangage: '#3178c6',
		etoiles: '3.4k',
		topics: ['typescript', 'api'],
		goodFirstIssues: 4,
		miseAJour: 'il y a 2 jours',
	},
	{
		nom: 'kiwi/css-grid-lab',
		description: 'Exercices progressifs pour maîtriser CSS Grid, avec corrections.',
		langage: 'CSS',
		couleurLangage: '#563d7c',
		etoiles: '615',
		topics: ['css', 'grid'],
		goodFirstIssues: 5,
		miseAJour: 'il y a 2 jours',
	},
];

const issuesFactices: Issue[] = [
	{ titre: "Corriger l'alignement du menu sur mobile", repo: 'lunaris/pixel-kit', ouverte: 'il y a 2 jours' },
	{ titre: 'Ajouter des tests pour le parseur de dates', repo: 'ada-dev/study-planner', ouverte: 'il y a 3 jours' },
	{ titre: 'Traduire le README en français', repo: 'nomad/api-starter', ouverte: 'il y a 5 jours' },
	{ titre: "Documenter l'installation sous Windows", repo: 'kiwi/css-grid-lab', ouverte: 'il y a 1 semaine' },
];

export const langages: Langage[] = [
	{ nom: 'JavaScript', couleur: '#f1e05a' },
	{ nom: 'Python', couleur: '#3572a5' },
	{ nom: 'TypeScript', couleur: '#3178c6' },
	{ nom: 'CSS', couleur: '#563d7c' },
	{ nom: 'HTML', couleur: '#e34c26' },
	{ nom: 'Go', couleur: '#00add8' },
];

const profilsFactices: Profil[] = [
	{
		nom: 'Camille Durand',
		pseudo: 'camille-d',
		abonnes: '128',
		bio: "Dev front passionnée d'accessibilité. Je cherche des contributeurs pour mes outils CSS.",
	},
	{
		nom: 'Yanis Moreau',
		pseudo: 'yanis-m',
		abonnes: '342',
		bio: 'Backend Python. Mentor open source, je réponds aux débutants chaque semaine.',
	},
	{
		nom: 'Inès Garcia',
		pseudo: 'ines-g',
		abonnes: '89',
		bio: "Étudiante en MMI, je documente mes projets JavaScript et j'apprends en public.",
	},
];

type DonneesAccueil = { genereLe: string; repos: Repo[]; issues: Issue[]; profils: Profil[]; pepites?: Repo[] };

// import.meta.glob ne plante pas quand le fichier est absent : il renvoie simplement une liste vide
const fichiers = import.meta.glob<{ default: DonneesAccueil }>('./accueil.json', { eager: true });
const donnees = Object.values(fichiers)[0]?.default;

// Une liste vide ou absente dans le JSON retombe sur les données factices
export const repos: Repo[] = donnees?.repos?.length ? donnees.repos : reposFactices;
export const issues: Issue[] = donnees?.issues?.length ? donnees.issues : issuesFactices;
export const profils: Profil[] = donnees?.profils?.length ? donnees.profils : profilsFactices;
// Les pépites n'ont pas de données factices : sans vraies données, la section de l'accueil n'est pas affichée
export const pepites: Repo[] = donnees?.pepites ?? [];

// Activité d'exemple : 24 semaines de 5 jours, niveaux de 0 à 4.
// La `graine` change le dessin d'un profil à l'autre. Ce sera remplacé par les vraies contributions.
export const activite = (graine: number): number[][] =>
	Array.from({ length: 24 }, (_, semaine) =>
		Array.from({ length: 5 }, (_, jour) => ((semaine * 7 + jour * 13 + graine * 5) % 11) % 5),
	);
