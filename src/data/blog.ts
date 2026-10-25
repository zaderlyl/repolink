import { lien } from '../lib/adresses.ts';
// Articles du blog (données factices : le blog n'a pas d'API, les articles sont écrits ici).
// Les types décrivent la forme que les pages /blog et /blog/[slug] attendent.

export type SectionArticle = {
	id: string;
	titre: string;
	texte: string;
};

export type Article = {
	slug: string;
	titre: string;
	resume: string;
	tag: string;
	auteur: string;
	date: string;
	lecture: string;
	intro: string;
	sections: SectionArticle[];
};

export const hrefArticle = (slug: string) => lien(`/blog/${slug}`);

// « 12 oct. 2026 · 5 min de lecture », affiché sous les titres
export const infosArticle = (article: Article) => `${article.date} · ${article.lecture}`;

// Premier article : celui de la bannière « À la une » du blog
export const articles: Article[] = [
	{
		slug: 'premiere-pull-request',
		titre: 'Comment j’ai fait ma première pull request',
		resume: 'Il y a un mois, je n’avais jamais contribué à l’open source. Voici ce que j’ai appris en corrigeant ma première issue.',
		tag: 'Témoignage',
		auteur: 'Camille Durand',
		date: '12 oct. 2026',
		lecture: '5 min de lecture',
		intro: 'Il y a un mois, je n’avais jamais contribué à un projet open source. Voici ce que j’ai appris en corrigeant ma première issue.',
		sections: [
			{
				id: 'choix-du-projet',
				titre: 'Le choix du projet',
				texte: 'J’ai commencé par un petit kit d’interface en CSS, très bien documenté. La section « good first issue » m’a donné plusieurs idées par où démarrer.',
			},
			{
				id: 'erreurs-du-debut',
				titre: 'Les erreurs du début',
				texte: 'Mon premier commit ne respectait pas le format demandé. Le mainteneur m’a expliqué la règle en deux lignes, et j’ai corrigé en dix minutes.',
			},
			{
				id: 'ce-que-je-retiens',
				titre: 'Ce que je retiens',
				texte: 'Poser une question n’a rien de gênant. Les mainteneurs préfèrent une question claire à une pull request qui s’éloigne de ce qu’ils attendent.',
			},
		],
	},
	{
		slug: 'choisir-sa-premiere-good-first-issue',
		titre: 'Choisir sa première good first issue',
		resume: 'Trois critères simples pour ne pas se tromper de projet quand on débute.',
		tag: 'Guide',
		auteur: 'Yanis Moreau',
		date: '12 oct. 2026',
		lecture: '5 min de lecture',
		intro: 'Toutes les good first issues ne se valent pas. Voici trois critères pour choisir celle qui te fera vraiment progresser.',
		sections: [
			{
				id: 'projet-actif',
				titre: 'Un projet actif',
				texte: 'Regarde la date des derniers commits et le temps de réponse aux issues. Un projet qui répond en quelques jours te laissera moins bloqué.',
			},
			{
				id: 'issue-claire',
				titre: 'Une issue claire',
				texte: 'Une bonne issue décrit le problème et le résultat attendu. Si tu ne comprends pas ce qu’il faut faire, passe à la suivante.',
			},
			{
				id: 'taille-raisonnable',
				titre: 'Une taille raisonnable',
				texte: 'Vise un changement de quelques lignes. Ta première contribution n’a pas besoin d’être spectaculaire pour être utile.',
			},
		],
	},
	{
		slug: 'apprendre-git-sans-stress',
		titre: 'Apprendre Git sans stress',
		resume: 'Les cinq commandes qui suffisent pour contribuer à un projet.',
		tag: 'Tutoriel',
		auteur: 'Inès Garcia',
		date: '12 oct. 2026',
		lecture: '5 min de lecture',
		intro: 'Git semble immense au début, mais cinq commandes couvrent presque tout ce qu’il faut pour contribuer.',
		sections: [
			{
				id: 'cloner-et-brancher',
				titre: 'Cloner et créer une branche',
				texte: 'git clone récupère le projet, puis git switch -c crée ta branche. Ne travaille jamais directement sur la branche principale.',
			},
			{
				id: 'enregistrer',
				titre: 'Enregistrer ton travail',
				texte: 'git add prépare tes fichiers et git commit les enregistre avec un message court qui dit ce que tu as changé.',
			},
			{
				id: 'envoyer',
				titre: 'Envoyer tes changements',
				texte: 'git push envoie ta branche sur GitHub, d’où tu pourras ouvrir ta pull request.',
			},
		],
	},
	{
		slug: 'ouvrir-une-issue-qui-donne-envie-de-repondre',
		titre: 'Ouvrir une issue qui donne envie de répondre',
		resume: 'Comment décrire un bug pour que les mainteneurs le comprennent vite.',
		tag: 'Conseils',
		auteur: 'Camille Durand',
		date: '12 oct. 2026',
		lecture: '5 min de lecture',
		intro: 'Une issue bien écrite reçoit une réponse plus vite. Voici comment décrire un bug pour qu’on le comprenne du premier coup.',
		sections: [
			{
				id: 'titre-precis',
				titre: 'Un titre précis',
				texte: '« Ça ne marche pas » ne dit rien. Écris ce qui échoue et où : « Le menu se ferme au clic sur mobile ».',
			},
			{
				id: 'etapes',
				titre: 'Les étapes pour reproduire',
				texte: 'Liste ce que tu as fait, ce que tu attendais et ce qui s’est passé. Ajoute ton navigateur ou ta version si c’est utile.',
			},
		],
	},
	{
		slug: 'trouver-un-mentor-open-source',
		titre: 'Trouver un mentor open source',
		resume: 'Où chercher, quoi demander, et comment remercier.',
		tag: 'Mentorat',
		auteur: 'Yanis Moreau',
		date: '12 oct. 2026',
		lecture: '5 min de lecture',
		intro: 'Un mentor te fait gagner des semaines. Voici comment le trouver sans le déranger.',
		sections: [
			{
				id: 'ou-chercher',
				titre: 'Où chercher',
				texte: 'Commence par les mainteneurs des projets où tu as déjà contribué, ou par les créateurs de profils sur Repolink.',
			},
			{
				id: 'quoi-demander',
				titre: 'Quoi demander',
				texte: 'Une question précise vaut mieux qu’un « peux-tu m’aider ? ». Dis ce que tu as essayé et où tu bloques.',
			},
			{
				id: 'remercier',
				titre: 'Comment remercier',
				texte: 'Un retour sur ce qui a marché, ou une pull request qui améliore la documentation, fait toujours plaisir.',
			},
		],
	},
	{
		slug: 'documenter-son-projet-en-30-minutes',
		titre: 'Documenter son projet en 30 minutes',
		resume: 'Un README clair attire plus de contributeurs que du code parfait.',
		tag: 'Documentation',
		auteur: 'Inès Garcia',
		date: '12 oct. 2026',
		lecture: '5 min de lecture',
		intro: 'Un bon README tient en une page. Voici de quoi l’écrire en une demi-heure.',
		sections: [
			{
				id: 'presentation',
				titre: 'Dire à quoi sert le projet',
				texte: 'Une phrase pour le but, une capture ou un exemple, puis les commandes pour l’installer et le lancer.',
			},
			{
				id: 'contribuer',
				titre: 'Expliquer comment contribuer',
				texte: 'Ajoute un fichier CONTRIBUTING court et marque quelques issues « good first issue » pour accueillir les débutants.',
			},
		],
	},
	{
		slug: 'publier-son-projet-sur-github-pages',
		titre: 'Publier son projet sur GitHub Pages',
		resume: 'En dix minutes, mets ton site en ligne gratuitement et partage le lien.',
		tag: 'Tutoriel',
		auteur: 'Camille Durand',
		date: '12 oct. 2026',
		lecture: '5 min de lecture',
		intro: 'GitHub Pages héberge gratuitement un site statique. Voici comment mettre le tien en ligne.',
		sections: [
			{
				id: 'activer-pages',
				titre: 'Activer GitHub Pages',
				texte: 'Dans les paramètres du dépôt, choisis la branche à publier. GitHub construit et héberge le site pour toi.',
			},
			{
				id: 'partager',
				titre: 'Partager le lien',
				texte: 'L’adresse apparaît après quelques minutes. Ajoute-la à la description du dépôt pour que chacun la trouve.',
			},
		],
	},
];
