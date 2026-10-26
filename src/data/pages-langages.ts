// Les langages qui ont leur propre page « Good first issues » (/good-first-issues/<slug>/).
// `nom` est le nom du langage sur GitHub (celui du filtre `language:`), `slug` sert dans l'adresse de la page.
// Ce fichier ne contient que des données simples : il est lu par le script « npm run donnees » (Node) comme par les pages.

export type PageLangage = {
	nom: string;
	slug: string;
	intro: string; // présentation du langage, pour la page et pour les moteurs de recherche
};

export const pagesLangages: PageLangage[] = [
	{ nom: 'JavaScript', slug: 'javascript', intro:
		"JavaScript est le langage du web : il fait vivre les sites dans le navigateur et, avec Node.js, les serveurs. Les projets sont très nombreux, il est donc facile d'y trouver une première contribution à ta portée." },
	{ nom: 'TypeScript', slug: 'typescript', intro:
		"TypeScript ajoute des types à JavaScript pour repérer les erreurs avant l'exécution. Il est très utilisé dans les projets web modernes : une bonne suite si tu connais déjà JavaScript." },
	{ nom: 'Python', slug: 'python', intro:
		"Python est réputé pour sa syntaxe lisible. On l'utilise pour le web, les scripts, les données et l'intelligence artificielle, et beaucoup de projets accueillent les débutants." },
	{ nom: 'Java', slug: 'java', intro:
		"Java fait tourner de grosses applications d'entreprise, des serveurs et des applications Android. Ses projets sont souvent bien structurés, ce qui aide à comprendre où intervenir." },
	{ nom: 'C', slug: 'c', intro:
		"C est un langage proche de la machine, à la base de nombreux systèmes et outils. Les contributions demandent de la rigueur, mais apprennent beaucoup sur le fonctionnement d'un ordinateur." },
	{ nom: 'C++', slug: 'cpp', intro:
		"C++ sert aux jeux vidéo, aux logiciels de bureau et aux applications où la performance compte. Commence par de petites corrections avant de t'attaquer aux parties les plus complexes." },
	{ nom: 'C#', slug: 'csharp', intro:
		"C# est le langage de l'écosystème .NET et du moteur de jeu Unity. On le retrouve dans les applications de bureau, les sites web et les jeux." },
	{ nom: 'Go', slug: 'go', intro:
		"Go est un langage simple et rapide, créé par Google, très utilisé pour les outils en ligne de commande et les services côté serveur. Sa petite taille le rend agréable à lire." },
	{ nom: 'Rust', slug: 'rust', intro:
		"Rust vise la performance et la sécurité de la mémoire. Sa communauté est connue pour bien accueillir les nouveaux contributeurs." },
	{ nom: 'PHP', slug: 'php', intro:
		"PHP fait tourner une grande partie du web, notamment avec WordPress et Laravel. Une correction de bug ou de documentation y est un bon point de départ." },
	{ nom: 'Ruby', slug: 'ruby', intro:
		"Ruby est un langage pensé pour être agréable à écrire, popularisé par le framework Ruby on Rails. Ses communautés sont réputées pour leur entraide." },
	{ nom: 'Swift', slug: 'swift', intro:
		"Swift est le langage d'Apple pour créer des applications iPhone, iPad et Mac. C'est un bon choix pour contribuer à des applications mobiles." },
	{ nom: 'Kotlin', slug: 'kotlin', intro:
		"Kotlin est le langage recommandé par Google pour développer des applications Android. Il s'utilise aussi côté serveur." },
	{ nom: 'Dart', slug: 'dart', intro:
		"Dart est le langage de Flutter, le framework qui permet de créer des applications mobiles et web avec un seul code." },
	{ nom: 'HTML', slug: 'html', intro:
		"HTML structure les pages web. Beaucoup d'issues pour débutants y portent sur la documentation, l'accessibilité ou de petites corrections de pages : une très bonne première contribution." },
	{ nom: 'CSS', slug: 'css', intro:
		"CSS gère l'apparence des sites : couleurs, mises en page, animations. Corriger un style ou une mise en page adaptée aux mobiles est un excellent premier pas." },
	{ nom: 'Shell', slug: 'shell', intro:
		"Les scripts Shell automatisent des tâches dans le terminal : installer, déployer ou tester un projet. C'est utile à connaître quel que soit ton langage." },
	{ nom: 'Lua', slug: 'lua', intro:
		"Lua est un langage léger, souvent intégré dans des jeux, des éditeurs de texte comme Neovim et des outils. Ses projets sont souvent de taille modeste, donc faciles à prendre en main." },
	{ nom: 'Vue', slug: 'vue', intro:
		"Vue est un framework pour construire des interfaces web. Il est apprécié pour sa prise en main douce : un bon terrain pour une première contribution côté front-end." },
	{ nom: 'R', slug: 'r', intro:
		"R est le langage des statistiques et de l'analyse de données. Ses projets sont ouverts à celles et ceux qui viennent des sciences, avec souvent de la documentation à améliorer." },
];
