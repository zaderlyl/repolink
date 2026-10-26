import { lien } from '../lib/adresses.ts';
// Articles du blog (données factices : le blog n'a pas d'API, les articles sont écrits ici).
// Les types décrivent la forme que les pages /blog et /blog/[slug] attendent.

// Un morceau de contenu dans une section. Le texte d'un paragraphe ou d'un élément de liste peut contenir du HTML simple
// (<code>, <strong>, <a>) : il est écrit ici, pas par les visiteurs. Un lien interne s'écrit href="{base}/recherche".
export type Bloc =
	| { type: 'p'; texte: string }
	| { type: 'liste'; items: string[]; ordonnee?: boolean }
	| { type: 'code'; code: string };

// `texte` : un seul paragraphe simple ; `blocs` : paragraphes, listes et commandes, affichés après `texte`
export type SectionArticle = {
	id: string;
	titre: string;
	texte?: string;
	blocs?: Bloc[];
};

export type Article = {
	slug: string;
	titre: string;
	resume: string;
	tag: string;
	auteur: string;
	date: string; // texte affiché, par exemple « 12 oct. 2026 »
	dateIso: string; // même date au format AAAA-MM-JJ, pour les moteurs de recherche
	lecture: string;
	intro: string;
	sections: SectionArticle[];
};

export const hrefArticle = (slug: string) => lien(`/blog/${slug}`);

// « 12 oct. 2026 · 5 min de lecture », affiché sous les titres
export const infosArticle = (article: Article) => `${article.date} · ${article.lecture}`;

// Le premier article est celui de la bannière « À la une » du blog.
// Les articles sont écrits par l'équipe : `auteur` reste « Équipe Repolink » tant qu'aucune personne n'a signé un article.
export const articles: Article[] = [
	{
		slug: 'premiere-contribution-open-source',
		titre: 'Comment faire sa première contribution open source',
		resume: 'Un guide pas à pas pour passer de « je n’ose pas » à une première pull request acceptée : choisir un projet, une issue, et envoyer ton travail.',
		tag: 'Guide',
		auteur: 'Équipe Repolink',
		date: '26 oct. 2026',
		dateIso: '2026-10-26',
		lecture: '7 min de lecture',
		intro: 'Contribuer à un projet open source semble réservé aux experts. C’est faux : une faute corrigée dans une documentation ou un petit bug réglé comptent autant qu’une grosse fonctionnalité. Voici la marche à suivre, de A à Z.',
		sections: [
			{
				id: 'choisir-un-projet',
				titre: 'Choisir un projet à ta portée',
				blocs: [
					{ type: 'p', texte: 'Le bon premier projet n’est pas le plus célèbre, c’est celui où tu te sentiras accueilli. Quelques signes qui ne trompent pas :' },
					{
						type: 'liste',
						items: [
							'<strong>Il est actif</strong> : des changements récents, des issues et des pull requests qui reçoivent une réponse.',
							'<strong>Il explique comment contribuer</strong> : un fichier <code>CONTRIBUTING.md</code> ou une section dédiée dans le README.',
							'<strong>Il est de taille raisonnable</strong> : un petit projet se lit plus vite et les mainteneurs ont plus de temps pour toi.',
							'<strong>Tu l’utilises ou tu le comprends</strong> : tu sauras plus facilement ce qui manque.',
						],
					},
					{ type: 'p', texte: 'Sur Repolink, le filtre « Petits projets » de la <a href="{base}/recherche?taille=petits">recherche</a> met en avant des créateurs moins connus, souvent très heureux d’avoir de l’aide.' },
				],
			},
			{
				id: 'trouver-une-issue',
				titre: 'Trouver une issue pour débuter',
				blocs: [
					{ type: 'p', texte: 'Une issue est une tâche ou un problème signalé sur le projet. Les mainteneurs marquent les plus accessibles avec le label <code>good first issue</code>. Tu peux les parcourir sur la page <a href="{base}/good-first-issues/">Good first issues</a>, par langage si tu préfères.' },
					{ type: 'p', texte: 'Avant de te lancer, vérifie que personne n’est déjà dessus, puis écris un commentaire court : « Je voudrais m’en occuper, est-ce toujours disponible ? ». Attends la réponse du mainteneur : ça évite de travailler pour rien.' },
				],
			},
			{
				id: 'copier-le-projet',
				titre: 'Faire ta copie du projet',
				blocs: [
					{ type: 'p', texte: 'Tu n’as pas le droit de modifier directement le dépôt d’un autre. Tu en fais donc une copie à ton nom, un <strong>fork</strong>, avec le bouton « Fork » en haut de la page du projet. Puis tu la télécharges sur ton ordinateur, c’est le <strong>clone</strong> :' },
					{ type: 'code', code: 'git clone https://github.com/TON-PSEUDO/le-projet.git\ncd le-projet' },
				],
			},
			{
				id: 'modifier',
				titre: 'Créer une branche et faire ta modification',
				blocs: [
					{ type: 'p', texte: 'Travaille toujours sur une branche à part : le travail de la branche principale reste intact et ta contribution est facile à relire. Donne-lui un nom qui dit ce qu’elle fait.' },
					{ type: 'code', code: 'git switch -c fix/faute-dans-le-readme' },
					{ type: 'p', texte: 'Fais ta modification, en restant strictement dans ce que demande l’issue : un petit changement bien fait est accepté plus vite qu’un gros. Relis les règles du projet, par exemple le format des messages de commit. Puis enregistre et envoie ton travail :' },
					{
						type: 'code',
						code: 'git add .\ngit commit -m "docs: Corrige une faute dans le README"\ngit push origin fix/faute-dans-le-readme',
					},
				],
			},
			{
				id: 'pull-request',
				titre: 'Ouvrir ta pull request',
				blocs: [
					{ type: 'p', texte: 'Sur GitHub, un bandeau te propose « Compare &amp; pull request » : c’est la demande de fusion de ta branche dans le projet. Rédige-la comme tu aimerais la lire :' },
					{
						type: 'liste',
						items: [
							'un titre précis, par exemple « Corrige une faute dans le README » ;',
							'quelques lignes qui expliquent ce que tu as changé et pourquoi ;',
							'la mention <code>Closes #12</code> (avec le numéro de l’issue) : GitHub fermera l’issue quand ta pull request sera acceptée.',
						],
					},
				],
			},
			{
				id: 'apres',
				titre: 'Et après ?',
				blocs: [
					{ type: 'p', texte: 'Un mainteneur relira ton travail et te demandera peut-être des changements : c’est normal et ça ne veut pas dire que c’est raté. Réponds poliment, corrige sur la même branche, et ta pull request se met à jour toute seule. Selon le projet, la réponse peut prendre quelques heures ou plusieurs semaines : sois patient et ne relance pas tous les jours.' },
					{ type: 'p', texte: 'Quand ta pull request est fusionnée, tu es officiellement contributeur. Tu peux alors choisir une deuxième issue, un peu plus ambitieuse : la première marche est franchie.' },
				],
			},
		],
	},
	{
		slug: 'good-first-issue-trouver-une-premiere-issue',
		titre: 'Qu’est-ce qu’une good first issue, et comment en trouver une ?',
		resume: 'Le label que les mainteneurs collent sur les tâches accessibles aux débutants : ce qu’il veut dire, où les chercher et comment choisir la bonne.',
		tag: 'Guide',
		auteur: 'Équipe Repolink',
		date: '26 oct. 2026',
		dateIso: '2026-10-26',
		lecture: '5 min de lecture',
		intro: 'Tu veux contribuer à l’open source mais tu ne sais pas par où commencer ? Les « good first issues » ont été inventées pour ça : des tâches choisies par les mainteneurs eux-mêmes parce qu’elles conviennent à une première contribution.',
		sections: [
			{
				id: 'definition',
				titre: 'Ce que ça veut dire',
				blocs: [
					{ type: 'p', texte: 'Une <strong>issue</strong> est une fiche sur un projet GitHub : un bug à corriger, une amélioration à faire, une question à traiter. Quand les mainteneurs estiment qu’une issue est faisable sans connaître tout le projet, ils lui ajoutent le label <code>good first issue</code> (« bonne première issue »). Ce label fait partie de ceux que GitHub propose par défaut sur un nouveau dépôt.' },
					{ type: 'p', texte: 'Typiquement, ce sont des tâches courtes et bien décrites : corriger une faute dans la documentation, ajouter un test, changer un message d’erreur, traduire un texte. Un autre label voisin, <code>help wanted</code>, signale que les mainteneurs cherchent de l’aide, avec une difficulté variable.' },
				],
			},
			{
				id: 'ou-chercher',
				titre: 'Où en trouver',
				blocs: [
					{ type: 'p', texte: 'La façon la plus simple est de passer par un outil qui rassemble les issues de plusieurs projets. Sur Repolink, la page <a href="{base}/good-first-issues/">Good first issues</a> les liste, avec un filtre par langage. Tu peux aussi aller directement à la page de ton langage :' },
					{
						type: 'liste',
						items: [
							'<a href="{base}/good-first-issues/javascript/">Good first issues JavaScript</a> et <a href="{base}/good-first-issues/typescript/">TypeScript</a>',
							'<a href="{base}/good-first-issues/python/">Good first issues Python</a>',
							'<a href="{base}/good-first-issues/java/">Good first issues Java</a> et <a href="{base}/good-first-issues/csharp/">C#</a>',
							'<a href="{base}/good-first-issues/go/">Good first issues Go</a> et <a href="{base}/good-first-issues/rust/">Rust</a>',
						],
					},
					{ type: 'p', texte: 'Tu peux aussi chercher directement sur GitHub, avec la recherche d’issues : tape <code>label:"good first issue" state:open</code> et ajoute <code>language:python</code> pour limiter à un langage. Et si tu as déjà un projet que tu aimes, regarde l’onglet « Issues » de son dépôt et filtre par ce label.' },
				],
			},
			{
				id: 'bien-choisir',
				titre: 'Comment choisir la bonne',
				blocs: [
					{ type: 'p', texte: 'Toutes les good first issues ne se valent pas. Avant de t’y lancer, vérifie ces points :' },
					{
						type: 'liste',
						items: [
							'<strong>Elle est libre</strong> : personne n’y est assigné et aucun commentaire récent ne dit « je m’en occupe ».',
							'<strong>Elle est claire</strong> : tu comprends ce qu’il faut faire et comment savoir que c’est terminé.',
							'<strong>Le projet répond</strong> : les dernières issues ont reçu une réponse en quelques jours ou semaines, pas en plusieurs mois.',
							'<strong>Elle est dans ton niveau</strong> : tu reconnais le langage et tu as une idée de par où commencer.',
						],
					},
					{ type: 'p', texte: 'Au moindre doute, passe ton chemin : il y en a beaucoup d’autres. Une issue ouverte depuis très longtemps sans réponse est souvent le signe d’un projet qui n’est plus suivi.' },
				],
			},
			{
				id: 'se-lancer',
				titre: 'Te lancer',
				blocs: [
					{ type: 'p', texte: 'Une fois ton issue choisie, laisse un commentaire pour dire que tu t’en occupes, et attends la réponse d’un mainteneur. Il peut te donner des conseils, ou te dire qu’elle n’est plus disponible : ce n’est pas grave. Ensuite, tu peux suivre le guide <a href="{base}/blog/premiere-contribution-open-source/">Comment faire sa première contribution open source</a> pour la suite, du fork jusqu’à la pull request.' },
				],
			},
		],
	},
];
