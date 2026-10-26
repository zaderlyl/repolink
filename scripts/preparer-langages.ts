// Prépare les issues des pages « Good first issues » par langage et les écrit dans src/data/langages.json.
// Lancé par « npm run donnees » (token GITHUB_TOKEN, comme preparer-donnees.ts). Une recherche par langage :
// la recherche de GitHub est limitée à 30 requêtes par minute, on espace donc les appels.
// Le fichier n'est écrit que si tout a réussi : en cas d'erreur, l'ancienne version reste en place.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { rechercherIssues, ErreurGithub } from '../src/lib/github.ts';
import { pagesLangages } from '../src/data/pages-langages.ts';
import type { IssueLangage } from '../src/data/langages.ts';

const SORTIE = 'src/data/langages.json';
const NB_ISSUES = 10;
const PAUSE_MS = 2500;

const token = process.env.GITHUB_TOKEN;
if (!token) {
	console.error('GITHUB_TOKEN est absent : ajoute-le dans le fichier .env (voir README).');
	process.exit(1);
}

const attendre = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

try {
	const langages: Record<string, { total: number; issues: IssueLangage[] }> = {};
	for (const { nom, slug } of pagesLangages) {
		// Repos archivés exclus : on ne peut plus y contribuer
		const q = `label:"good first issue" state:open is:issue archived:false language:"${nom}"`;
		const resultat = await rechercherIssues(q, { tri: 'updated', ordre: 'desc', parPage: NB_ISSUES, token });
		if (resultat.items.length === 0) throw new Error(`Aucune issue trouvée pour ${nom}.`);
		langages[slug] = {
			total: resultat.total_count,
			issues: resultat.items.map((issue) => ({
				titre: issue.title,
				repo: issue.repository_url.replace('https://api.github.com/repos/', ''),
				url: issue.html_url,
				creeeLe: issue.created_at,
			})),
		};
		console.log(`${nom} : ${resultat.total_count} issues ouvertes.`);
		await attendre(PAUSE_MS);
	}

	await mkdir(dirname(SORTIE), { recursive: true });
	await writeFile(SORTIE, JSON.stringify({ genereLe: new Date().toISOString(), langages }, null, '\t') + '\n');
	console.log(`${SORTIE} écrit : ${Object.keys(langages).length} langages.`);
} catch (erreur) {
	// Message seul : jamais d'objet complet, pour ne pas afficher d'en-têtes ni de token dans les journaux
	const message = erreur instanceof ErreurGithub || erreur instanceof Error ? erreur.message : String(erreur);
	console.error(`Échec de la préparation des langages : ${message}`);
	process.exit(1);
}
