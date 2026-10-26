// Langages, frameworks et topics proposés dans les filtres de la Recherche.
// Les langages portent le nom que GitHub leur donne (liste « linguist »), les topics celui qu'ils ont sur GitHub : chaque topic
// ci-dessous a été contrôlé (au moins 2 000 repos). Les frameworks sont des topics, ils sont donc rangés avec les autres.
// Ce fichier ne contient que des données simples : il pourra aussi être lu par un script Node.

export type Langage = {
	nom: string; // nom du langage sur GitHub, par exemple « C++ » ou « Jupyter Notebook »
	couleur: string; // pastille, celle de GitHub
};

export const langagesRecherche: Langage[] = [
	{ nom: 'JavaScript', couleur: '#f1e05a' },
	{ nom: 'TypeScript', couleur: '#3178c6' },
	{ nom: 'Python', couleur: '#3572a5' },
	{ nom: 'Java', couleur: '#b07219' },
	{ nom: 'C', couleur: '#555555' },
	{ nom: 'C++', couleur: '#f34b7d' },
	{ nom: 'C#', couleur: '#178600' },
	{ nom: 'Go', couleur: '#00add8' },
	{ nom: 'Rust', couleur: '#dea584' },
	{ nom: 'PHP', couleur: '#4f5d95' },
	{ nom: 'Ruby', couleur: '#701516' },
	{ nom: 'Swift', couleur: '#f05138' },
	{ nom: 'Kotlin', couleur: '#a97bff' },
	{ nom: 'Dart', couleur: '#00b4ab' },
	{ nom: 'Scala', couleur: '#c22d40' },
	{ nom: 'R', couleur: '#198ce7' },
	{ nom: 'Lua', couleur: '#000080' },
	{ nom: 'Shell', couleur: '#89e051' },
	{ nom: 'PowerShell', couleur: '#012456' },
	{ nom: 'Perl', couleur: '#0298c3' },
	{ nom: 'Haskell', couleur: '#5e5086' },
	{ nom: 'Elixir', couleur: '#8847b9' },
	{ nom: 'Clojure', couleur: '#db5855' },
	{ nom: 'Julia', couleur: '#a270ba' },
	{ nom: 'Objective-C', couleur: '#438eff' },
	{ nom: 'Zig', couleur: '#ec915c' },
	{ nom: 'Solidity', couleur: '#aa6746' },
	{ nom: 'Jupyter Notebook', couleur: '#da5b0b' },
	{ nom: 'HTML', couleur: '#e34c26' },
	{ nom: 'CSS', couleur: '#563d7c' },
	{ nom: 'SCSS', couleur: '#c6538c' },
	{ nom: 'Vue', couleur: '#41b883' },
	{ nom: 'Svelte', couleur: '#ff3e00' },
	{ nom: 'Astro', couleur: '#ff5a03' },
	{ nom: 'MATLAB', couleur: '#e16737' },
	{ nom: 'Assembly', couleur: '#6e4c13' },
	{ nom: 'Nim', couleur: '#ffc200' },
	{ nom: 'Erlang', couleur: '#b83998' },
	{ nom: 'Groovy', couleur: '#4298b8' },
	{ nom: 'F#', couleur: '#b845fc' },
	{ nom: 'OCaml', couleur: '#ef7a08' },
	{ nom: 'GDScript', couleur: '#355570' },
	{ nom: 'Fortran', couleur: '#4d41b1' },
	{ nom: 'Elm', couleur: '#60b5cc' },
	{ nom: 'V', couleur: '#4f87c4' },
	{ nom: 'Mojo', couleur: '#ff4c1f' },
];

export type GroupeTopics = {
	titre: string;
	topics: string[];
};

export const groupesTopics: GroupeTopics[] = [
	{
		titre: 'Frameworks et bibliothèques',
		topics: [
			'react', 'vue', 'angular', 'svelte', 'solidjs', 'nextjs', 'nuxt', 'astro', 'vite', 'webpack', 'tailwindcss', 'bootstrap',
			'jquery', 'nodejs', 'deno', 'bun', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'laravel', 'symfony',
			'ruby-on-rails', 'spring-boot', 'dotnet', 'electron', 'tauri',
		],
	},
	{
		titre: 'Web',
		topics: ['api', 'rest-api', 'graphql', 'frontend', 'backend', 'website', 'portfolio', 'pwa', 'web-components', 'seo'],
	},
	{
		titre: 'Outils et automatisation',
		topics: [
			'cli', 'vscode-extension', 'automation', 'productivity', 'bot', 'discord-bot', 'web-scraping', 'linter', 'boilerplate',
			'template', 'starter', 'markdown',
		],
	},
	{
		titre: 'DevOps et hébergement',
		topics: ['docker', 'kubernetes', 'ci-cd', 'github-actions', 'devops', 'terraform', 'self-hosted', 'homelab', 'home-assistant'],
	},
	{
		titre: 'Données et IA',
		topics: [
			'machine-learning', 'deep-learning', 'data-science', 'llm', 'chatbot', 'nlp', 'computer-vision', 'data-visualization',
			'artificial-intelligence', 'pytorch', 'tensorflow', 'pandas', 'numpy',
		],
	},
	{
		titre: 'Jeux et création',
		topics: ['gamedev', 'game', 'game-engine', '2d-game', 'pygame', 'minecraft', 'unity', 'godot', 'unreal-engine', 'animation', 'music'],
	},
	{
		titre: 'Mobile',
		topics: ['android', 'ios', 'mobile', 'flutter', 'react-native'],
	},
	{
		titre: 'Sécurité et vie privée',
		topics: ['security', 'cryptography', 'privacy', 'ctf'],
	},
	{
		titre: 'Apprendre et contribuer',
		topics: [
			'beginner-friendly', 'good-first-issue', 'hacktoberfest', 'learning', 'tutorial', 'education', 'awesome', 'algorithms',
			'data-structures', 'interview', 'open-source',
		],
	},
	{
		titre: 'Design et accessibilité',
		topics: ['css', 'accessibility', 'design-system', 'ui', 'dark-mode'],
	},
	{
		titre: 'Qualité',
		topics: ['testing', 'documentation'],
	},
	{
		titre: 'Matériel et autres',
		topics: ['iot', 'raspberry-pi', 'arduino', 'embedded', 'linux', 'blockchain'],
	},
];

// Tous les topics à la suite, sans doublon
export const topicsRecherche: string[] = [...new Set(groupesTopics.flatMap((groupe) => groupe.topics))];
