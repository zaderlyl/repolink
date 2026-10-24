// Recommandations « Pour toi » : on regarde les langages des repos d'une personne puis on cherche, dans ces langages,
// des repos qui accueillent les débutants. Ces fonctions ne font aucun appel réseau.
import type { RepoGithub } from './github.ts';

export const NB_LANGAGES = 3; // les « compétences détectées »
export const NB_PAR_LANGAGE = 2; // repos recommandés pour chaque langage

// Les langages les plus utilisés dans les repos de la personne, du plus au moins fréquent.
// Les forks sont des copies de repos d'autres personnes : ils ne disent rien de ses compétences.
// À égalité, le langage du repo le plus récent passe devant (les repos arrivent du plus récent au plus ancien).
export function langagesPrincipaux(repos: RepoGithub[], max = NB_LANGAGES): string[] {
	const compte = new Map<string, number>();
	for (const repo of repos) {
		if (repo.fork || !repo.language) continue;
		compte.set(repo.language, (compte.get(repo.language) ?? 0) + 1);
	}
	return [...compte.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, max)
		.map(([langage]) => langage);
}

const entre = (texte: string) => (/^[\w+#.-]+$/.test(texte) ? texte : `"${texte}"`);

// Un repo qui a des issues pour débutants, ni géant ni inconnu (10 à 5000 étoiles), actif et pas à la personne elle-même
export function construireRequeteRecommandation(langage: string, pseudo: string): string {
	return `language:${entre(langage)} good-first-issues:>0 stars:10..5000 archived:false -user:${pseudo}`;
}

// Mélange les listes une à une (un repo du 1er langage, un du 2e, un du 3e, puis on recommence), sans doublon,
// pour que chaque langage soit représenté. `parLangage` limite le nombre de repos pris dans chaque liste.
export function melanger(listes: RepoGithub[][], parLangage = NB_PAR_LANGAGE): RepoGithub[] {
	const dejaVus = new Set<string>();
	const resultat: RepoGithub[] = [];
	const suites = listes.map((liste) => liste.slice(0));
	for (let tour = 0; tour < parLangage; tour++) {
		for (const suite of suites) {
			// On saute les repos déjà pris par un autre langage (un repo a un seul langage principal, mais on reste prudent)
			while (suite.length > 0 && dejaVus.has(suite[0].full_name)) suite.shift();
			const repo = suite.shift();
			if (!repo) continue;
			dejaVus.add(repo.full_name);
			resultat.push(repo);
		}
	}
	return resultat;
}
