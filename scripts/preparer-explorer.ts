// Compte les repos de chaque langage et topic de la page Explorer et écrit src/data/explorer.json.
// Lancé par « npm run donnees », après preparer-donnees.ts. Même token (GITHUB_TOKEN).
// GitHub accepte 30 recherches par minute avec un token : on attend un peu entre deux requêtes.
// Le fichier n'est écrit que si tout a réussi : en cas d'erreur, l'ancienne version reste en place.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { rechercherRepos, ErreurGithub } from '../src/lib/github.ts';
import { langages, topics } from '../src/data/explorer-categories.ts';

const SORTIE = 'src/data/explorer.json';
const PAUSE_MS = 2200;

const token = process.env.GITHUB_TOKEN;
if (!token) {
	console.error('GITHUB_TOKEN est absent : ajoute-le dans le fichier .env (voir README).');
	process.exit(1);
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// total_count donne le nombre de résultats sans qu'on ait besoin de les lire : 1 seul repo demandé
async function compter(requete: string) {
	const resultat = await rechercherRepos(requete, { parPage: 1, token });
	await pause(PAUSE_MS);
	return resultat.total_count;
}

try {
	const nombresLangages: Record<string, number> = {};
	for (const langage of langages) {
		nombresLangages[langage.nom] = await compter(`language:${langage.nom}`);
	}
	const nombresTopics: Record<string, number> = {};
	for (const topic of topics) {
		nombresTopics[topic.nom] = await compter(`topic:${topic.nom}`);
	}

	await mkdir(dirname(SORTIE), { recursive: true });
	await writeFile(SORTIE, JSON.stringify({ genereLe: new Date().toISOString(), langages: nombresLangages, topics: nombresTopics }, null, '\t') + '\n');
	console.log(`${SORTIE} écrit : ${langages.length} langages, ${topics.length} topics.`);
} catch (erreur) {
	// Message seul : jamais d'objet complet, pour ne pas afficher d'en-têtes ni de token dans les journaux
	const message = erreur instanceof ErreurGithub || erreur instanceof Error ? erreur.message : String(erreur);
	console.error(`Échec du comptage de l'Explorer : ${message}`);
	process.exit(1);
}
