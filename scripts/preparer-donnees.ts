// Prépare les données de l'accueil avec l'API de GitHub et les écrit dans src/data/accueil.json.
// À lancer avec « npm run donnees » : le token vient de la variable GITHUB_TOKEN (fichier .env en local,
// secret du workflow sur GitHub). Avec un token, la limite passe de 60 à 5000 requêtes par heure.
// Le fichier n'est écrit que si tout a réussi : en cas d'erreur, l'ancienne version reste en place.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { rechercherIssues, rechercherRepos, recupererProfil, ErreurGithub } from '../src/lib/github.ts';
import type { RepoGithub } from '../src/lib/github.ts';
import { versIssue, versProfil, versRepo } from '../src/lib/conversion.ts';
import { choisirPepites, construireRequetePepites } from '../src/lib/pepites.ts';

const SORTIE = 'src/data/accueil.json';
const NB_REPOS = 4;
const NB_ISSUES = 4;
const NB_PROFILS = 3;

const token = process.env.GITHUB_TOKEN;
if (!token) {
	console.error('GITHUB_TOKEN est absent : ajoute-le dans le fichier .env (voir README).');
	process.exit(1);
}

// Repos à la une : actifs ce dernier mois, déjà connus mais pas géants, avec des issues pour débutants
const ilYA30Jours = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const requeteRepos = `good-first-issues:>2 stars:50..2000 pushed:>${ilYA30Jours} archived:false`;

// Nombre d'issues « good first issue » ouvertes d'un repo (non fourni dans la réponse d'un repo)
async function compterGoodFirstIssues(nomRepo: string) {
	const resultat = await rechercherIssues(`repo:${nomRepo} label:"good first issue" state:open is:issue`, {
		parPage: 1,
		token,
	});
	return resultat.total_count;
}

try {
	// On prend large (100 repos) : Repolink met en avant les petits créateurs, donc les repos de personnes
	// passent avant ceux des organisations (le tri est stable : l'ordre « mis à jour récemment » est gardé).
	const recherche = await rechercherRepos(requeteRepos, { tri: 'updated', ordre: 'desc', parPage: 100, token });
	const estPersonne = (repo: RepoGithub) => repo.owner.type === 'User';
	const reposGithub: RepoGithub[] = [...recherche.items.filter(estPersonne), ...recherche.items.filter((r) => !estPersonne(r))];
	if (reposGithub.length < NB_REPOS) throw new Error(`Seulement ${reposGithub.length} repos trouvés.`);
	const aLaUne = reposGithub.slice(0, NB_REPOS);

	const repos = [];
	for (const repo of aLaUne) {
		repos.push(versRepo(repo, await compterGoodFirstIssues(repo.full_name)));
	}

	// Pépites à soutenir : petits projets récents avec une good first issue. Il peut n'y en avoir aucune : la section
	// de l'accueil disparaît alors, sans faire échouer la préparation des données.
	const recherchePepites = await rechercherRepos(construireRequetePepites(new Date()), { tri: 'updated', ordre: 'desc', parPage: 100, token });
	const pepites = [];
	for (const repo of choisirPepites(recherchePepites.items)) {
		pepites.push(versRepo(repo, await compterGoodFirstIssues(repo.full_name)));
	}

	// Issues : récentes, choisies parmi les repos à la une pour que les liens de l'accueil restent cohérents
	const filtreRepos = aLaUne.map((repo) => `repo:${repo.full_name}`).join(' ');
	const issuesGithub = await rechercherIssues(`${filtreRepos} label:"good first issue" state:open is:issue`, {
		tri: 'updated',
		ordre: 'desc',
		parPage: NB_ISSUES,
		token,
	});
	const issues = issuesGithub.items.map(versIssue);

	// Profils : auteurs (personnes, pas organisations) des repos trouvés, sans doublon
	const pseudos = [...new Set(reposGithub.filter(estPersonne).map((r) => r.owner.login))];
	const profils = [];
	for (const pseudo of pseudos.slice(0, NB_PROFILS)) {
		profils.push(versProfil(await recupererProfil(pseudo, token)));
	}
	if (profils.length < NB_PROFILS) throw new Error(`Seulement ${profils.length} profils trouvés.`);

	await mkdir(dirname(SORTIE), { recursive: true });
	await writeFile(SORTIE, JSON.stringify({ genereLe: new Date().toISOString(), repos, issues, profils, pepites }, null, '\t') + '\n');
	console.log(`${SORTIE} écrit : ${repos.length} repos, ${issues.length} issues, ${profils.length} profils, ${pepites.length} pépites.`);
} catch (erreur) {
	// Message seul : jamais d'objet complet, pour ne pas afficher d'en-têtes ni de token dans les journaux
	const message = erreur instanceof ErreurGithub || erreur instanceof Error ? erreur.message : String(erreur);
	console.error(`Échec de la préparation des données : ${message}`);
	process.exit(1);
}
