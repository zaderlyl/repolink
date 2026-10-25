// Accueil : « Tes favoris » montre les derniers repos étoilés (src/lib/favoris.ts) pour revenir dessus d'un clic.
// Chaque repo coûte une requête à GitHub : on en affiche peu, et un repo sans réponse est simplement laissé de côté.
import { recupererRepo } from '../lib/github.ts';
import type { RepoGithub } from '../lib/github.ts';
import { CLE_FAVORIS, lireFavoris, nomsRecents } from '../lib/favoris.ts';
import { $, creerCarteRepo } from './commun.ts';

const MAX_FAVORIS = 4;

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

async function afficherFavoris() {
	const noms = nomsRecents(lireFavoris(stockage(), CLE_FAVORIS)).slice(0, MAX_FAVORIS);
	if (noms.length === 0) return;

	const reponses = await Promise.allSettled(noms.map((nom) => recupererRepo(nom)));
	const repos = reponses.flatMap((r) => (r.status === 'fulfilled' ? [r.value as RepoGithub] : []));
	if (repos.length === 0) return;

	$('liste-favoris-accueil').replaceChildren(
		...repos.map((repo) => {
			const item = document.createElement('li');
			item.append(creerCarteRepo(repo));
			return item;
		}),
	);
	$('favoris-accueil').hidden = false;
}

void afficherFavoris();
