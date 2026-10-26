// Les langages qui ont leur propre page « Good first issues » (/good-first-issues/<slug>/).
// `nom` est le nom du langage sur GitHub (celui du filtre `language:`), `slug` sert dans l'adresse de la page.
// Ce fichier ne contient que des données simples : il est lu par le script « npm run donnees » (Node) comme par les pages.

export type PageLangage = {
	nom: string;
	slug: string;
};

export const pagesLangages: PageLangage[] = [
	{ nom: 'JavaScript', slug: 'javascript' },
	{ nom: 'TypeScript', slug: 'typescript' },
	{ nom: 'Python', slug: 'python' },
	{ nom: 'Java', slug: 'java' },
	{ nom: 'C', slug: 'c' },
	{ nom: 'C++', slug: 'cpp' },
	{ nom: 'C#', slug: 'csharp' },
	{ nom: 'Go', slug: 'go' },
	{ nom: 'Rust', slug: 'rust' },
	{ nom: 'PHP', slug: 'php' },
	{ nom: 'Ruby', slug: 'ruby' },
	{ nom: 'Swift', slug: 'swift' },
	{ nom: 'Kotlin', slug: 'kotlin' },
	{ nom: 'Dart', slug: 'dart' },
	{ nom: 'HTML', slug: 'html' },
	{ nom: 'CSS', slug: 'css' },
	{ nom: 'Shell', slug: 'shell' },
	{ nom: 'Lua', slug: 'lua' },
	{ nom: 'Vue', slug: 'vue' },
	{ nom: 'R', slug: 'r' },
];
