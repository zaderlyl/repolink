// « Pépites à soutenir » de l'accueil : des petits projets récents qui ont besoin de contributeurs.
// La sélection (requête puis tri) est ici, sans appel réseau, pour pouvoir être testée ; scripts/preparer-donnees.ts l'utilise.
import { ETOILES_PETIT_MAX, ETOILES_PETIT_MIN, TAILLE_MIN_PETIT } from './recherche.ts';
import type { RepoGithub } from './github.ts';

export const NB_PEPITES = 4;
// Un projet « récent » a été créé ces 12 derniers mois, et « actif » modifié ces 30 derniers jours
const MOIS_RECENT = 12;
const JOURS_ACTIF = 30;

const jour = (date: Date) => date.toISOString().slice(0, 10);

// Requête GitHub : peu d'étoiles, pas vide, récent, actif, avec au moins une good first issue
export function construireRequetePepites(maintenant: Date): string {
	const creeAvant = new Date(maintenant);
	creeAvant.setUTCMonth(creeAvant.getUTCMonth() - MOIS_RECENT);
	const actifDepuis = new Date(maintenant.getTime() - JOURS_ACTIF * 24 * 3600 * 1000);
	return [
		'good-first-issues:>0',
		`stars:${ETOILES_PETIT_MIN}..${ETOILES_PETIT_MAX}`,
		`size:>${TAILLE_MIN_PETIT}`,
		`created:>${jour(creeAvant)}`,
		`pushed:>${jour(actifDepuis)}`,
		'archived:false',
		'fork:false',
	].join(' ');
}

// Choisit les pépites parmi les résultats (déjà triés par GitHub) : les repos de personnes passent avant ceux des
// organisations, un seul repo par auteur pour varier, et jamais un repo privé, archivé ou forké.
export function choisirPepites(repos: RepoGithub[], nombre = NB_PEPITES): RepoGithub[] {
	const valides = repos.filter((repo) => !repo.private && !repo.fork);
	const estPersonne = (repo: RepoGithub) => repo.owner.type === 'User';
	const ordonnes = [...valides.filter(estPersonne), ...valides.filter((repo) => !estPersonne(repo))];

	const auteurs = new Set<string>();
	const choisis: RepoGithub[] = [];
	for (const repo of ordonnes) {
		const auteur = repo.owner.login.toLowerCase();
		if (auteurs.has(auteur)) continue;
		auteurs.add(auteur);
		choisis.push(repo);
		if (choisis.length === nombre) break;
	}
	return choisis;
}
