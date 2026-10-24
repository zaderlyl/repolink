// Mise en relation : on repère des personnes à contacter à partir des repos de GitHub (pas de recherche de personnes :
// elle ne donne ni langage ni activité). Ces fonctions ne font aucun appel réseau.
//   - Mentors : propriétaires de repos populaires qui ont des issues pour débutants (ils savent accueillir) ;
//   - Débutants : propriétaires de repos tout récents et encore petits (ils commencent).
// C'est une approximation : GitHub ne dit pas qui est mentor ou débutant.
import type { RepoGithub } from './github.ts';
import { dateLimiteActif } from './preferences.ts';

export type TypeMiseEnRelation = 'mentors' | 'debutants';

export const TYPES_MISE_EN_RELATION: { id: TypeMiseEnRelation; texte: string; role: string }[] = [
	{ id: 'mentors', texte: 'Mentors', role: 'Mentor' },
	{ id: 'debutants', texte: 'Débutants', role: 'Débutant' },
];

export const MAX_PERSONNES = 12;
export const MAX_LANGAGES = 3; // une recherche par langage favori : GitHub accepte 10 recherches par minute sans token
const JOURS_RECENT = 180;

export type Personne = { pseudo: string; avatar: string; langage: string; role: string };

const entre = (texte: string) => (/^[\w+#.-]+$/.test(texte) ? texte : `"${texte}"`);

// Le type vient de l'adresse (?type=…) : tout ce qui n'est pas « debutants » donne les mentors
export const lireType = (valeur: string | null): TypeMiseEnRelation => (valeur === 'debutants' ? 'debutants' : 'mentors');

// `langage` vide : tous les langages
export function construireRequeteMise(type: TypeMiseEnRelation, langage: string, maintenant: Date = new Date()): string {
	const morceaux: string[] = [];
	if (langage) morceaux.push(`language:${entre(langage)}`);
	if (type === 'mentors') {
		// Au-delà de 3000 étoiles, presque tous les repos appartiennent à des organisations, pas à des personnes
		morceaux.push('good-first-issues:>0', 'stars:50..3000', 'archived:false', `pushed:>${dateLimiteActif(maintenant)}`);
	} else {
		const limite = new Date(maintenant.getTime() - JOURS_RECENT * 24 * 3600 * 1000).toISOString().slice(0, 10);
		morceaux.push(`created:>${limite}`, 'stars:0..5', 'size:>50');
	}
	return morceaux.join(' ');
}

// Les langages à interroger : les favoris des Paramètres (3 au plus), sinon « tous » (une seule recherche)
export const langagesAInterroger = (favoris: string[]): string[] => (favoris.length > 0 ? favoris.slice(0, MAX_LANGAGES) : ['']);

// Les propriétaires des repos, un par personne : on saute les organisations, la personne connectée et les repos sans langage.
// Les listes (une par langage) sont prises à tour de rôle pour que chaque langage soit représenté.
export function extrairePersonnes(listes: RepoGithub[][], type: TypeMiseEnRelation, exclu = '', max = MAX_PERSONNES): Personne[] {
	const role = TYPES_MISE_EN_RELATION.find((t) => t.id === type)!.role;
	const vus = new Set<string>([exclu.toLowerCase()]);
	const personnes: Personne[] = [];
	const suites = listes.map((liste) => liste.slice(0));
	while (personnes.length < max && suites.some((s) => s.length > 0)) {
		for (const suite of suites) {
			const repo = suite.shift();
			if (!repo || personnes.length >= max) continue;
			const { login, avatar_url, type: genre } = repo.owner;
			if (genre !== 'User' || !repo.language || vus.has(login.toLowerCase())) continue;
			vus.add(login.toLowerCase());
			personnes.push({ pseudo: login, avatar: avatar_url, langage: repo.language, role });
		}
	}
	return personnes;
}
