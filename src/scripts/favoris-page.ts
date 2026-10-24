// Page Favoris : lit les repos étoilés et les créateurs suivis dans le navigateur, va chercher leurs détails sur GitHub
// (avec le cache) et les affiche, avec un filtre par texte et trois vues : TOUT, Repos, Créateurs (?type=…).
// Un favori retiré depuis cette page reste affiché (bouton « Star » ou « Suivre » pour le remettre) jusqu'au rechargement.
import { ErreurGithub, recupererProfil, recupererRepo } from '../lib/github.ts';
import type { RepoGithub, UtilisateurGithub } from '../lib/github.ts';
import { CLE_CREATEURS, CLE_FAVORIS, correspond, lireFavoris, nomsRecents } from '../lib/favoris.ts';
import { hrefProfil, hrefRepo } from '../lib/adresses.ts';
import { formaterNombre } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { $, creerCarteRepo, depuisModele, messageErreur } from './commun.ts';

type Vue = 'tout' | 'repos' | 'createurs';
const VUES: { id: Vue; texte: string; href: string }[] = [
	{ id: 'tout', texte: 'TOUT', href: '/favoris' },
	{ id: 'repos', texte: 'Repos', href: '/favoris?type=repos' },
	{ id: 'createurs', texte: 'Créateurs', href: '/favoris?type=createurs' },
];
// Chaque favori coûte une requête à GitHub (60 par heure sans token) : on affiche les plus récents
const MAX_PAR_LISTE = 30;

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function lireVue(): Vue {
	const type = new URLSearchParams(location.search).get('type');
	return type === 'repos' || type === 'createurs' ? type : 'tout';
}

function afficherPastilles(vue: Vue) {
	const barre = $('types');
	barre.replaceChildren(
		...VUES.map(({ id, texte, href }) => depuisModele(id === vue ? 'modele-chip-actif' : 'modele-chip', { texte, href })),
	);
}

// Les détails d'un favori : on garde l'élément de la page et le texte dans lequel chercher
type Element = { noeud: HTMLElement; texte: string };

async function elementsRepos(noms: string[]): Promise<{ elements: Element[]; erreurs: unknown[] }> {
	const reponses = await Promise.allSettled(noms.map((nom) => recupererRepo(nom)));
	const erreurs: unknown[] = [];
	const elements = reponses.map((reponse, i): Element => {
		if (reponse.status === 'fulfilled') {
			const repo: RepoGithub = reponse.value;
			return { noeud: creerCarteRepo(repo), texte: `${repo.full_name} ${repo.description ?? ''} ${repo.language ?? ''}` };
		}
		erreurs.push(reponse.reason);
		return {
			noeud: depuisModele('modele-indisponible', { nom: noms[i], href: hrefRepo(noms[i]) }),
			texte: noms[i],
		};
	});
	return { elements, erreurs };
}

async function elementsCreateurs(pseudos: string[]): Promise<{ elements: Element[]; erreurs: unknown[] }> {
	const reponses = await Promise.allSettled(pseudos.map((pseudo) => recupererProfil(pseudo)));
	const erreurs: unknown[] = [];
	const elements = reponses.map((reponse, i): Element => {
		if (reponse.status === 'fulfilled') {
			const u: UtilisateurGithub = reponse.value;
			return {
				noeud: depuisModele('modele-createur', {
					nom: u.name ?? u.login,
					pseudo: u.login,
					abonnes: formaterNombre(u.followers),
					href: hrefProfil(u.login),
					avatar: u.avatar_url,
				}),
				texte: `${u.login} ${u.name ?? ''}`,
			};
		}
		erreurs.push(reponse.reason);
		return {
			// Sans réponse de GitHub, on n'a que le pseudo : ligne simple avec le bouton « Suivi » pour le retirer
			noeud: depuisModele('modele-createur', {
				nom: pseudos[i],
				pseudo: pseudos[i],
				abonnes: '—',
				href: hrefProfil(pseudos[i]),
				avatar: 'https://github.com/identicons/' + encodeURIComponent(pseudos[i]) + '.png',
			}),
			texte: pseudos[i],
		};
	});
	return { elements, erreurs };
}

function remplirListe(idListe: string, elements: Element[]) {
	$(idListe).replaceChildren(
		...elements.map(({ noeud, texte }) => {
			const item = document.createElement('li');
			item.dataset.texte = texte;
			item.append(noeud);
			return item;
		}),
	);
}

// Le filtre cache les éléments qui ne correspondent pas ; une phrase prend le relais si plus rien ne reste
function filtrer() {
	const recherche = $<HTMLInputElement>('filtre-favoris').value;
	let visibles = 0;
	let total = 0;
	for (const item of document.querySelectorAll<HTMLElement>('#liste-repos > li, #liste-createurs > li')) {
		const garde = correspond(item.dataset.texte ?? '', recherche);
		item.hidden = !garde;
		total++;
		if (garde) visibles++;
	}
	const message = $('aucun-resultat');
	message.hidden = total === 0 || visibles > 0;
	message.textContent = `Aucun favori ne correspond à « ${recherche.trim()} ».`;
}

function montrerVide(vue: Vue) {
	const vide = $('vide');
	vide.querySelector('h2')!.textContent = 'Rien pour l’instant';
	vide.querySelector('p')!.textContent =
		vue === 'createurs'
			? 'Suis des créateurs pour les retrouver ici.'
			: vue === 'repos'
				? 'Ajoute des repos à tes favoris pour les retrouver ici.'
				: 'Ajoute des repos à tes favoris et suis des créateurs pour les retrouver ici.';
	$('chargement').hidden = true;
	$('contenu').hidden = true;
	vide.hidden = false;
}

async function charger() {
	purgerCache();
	const vue = lireVue();
	afficherPastilles(vue);

	const repos = vue === 'createurs' ? [] : nomsRecents(lireFavoris(stockage(), CLE_FAVORIS));
	const createurs = vue === 'repos' ? [] : nomsRecents(lireFavoris(stockage(), CLE_CREATEURS));
	if (repos.length === 0 && createurs.length === 0) {
		montrerVide(vue);
		return;
	}

	const notes: string[] = [];
	const [resultatRepos, resultatCreateurs] = await Promise.all([
		elementsRepos(repos.slice(0, MAX_PAR_LISTE)),
		elementsCreateurs(createurs.slice(0, MAX_PAR_LISTE)),
	]);
	if (repos.length > MAX_PAR_LISTE) notes.push(`Seuls tes ${MAX_PAR_LISTE} derniers repos favoris sont affichés.`);
	if (createurs.length > MAX_PAR_LISTE) notes.push(`Seuls tes ${MAX_PAR_LISTE} derniers créateurs suivis sont affichés.`);

	// Quelques favoris sans réponse de GitHub : on le dit une fois, avec l'heure si c'est la limite de requêtes
	const erreurs = [...resultatRepos.erreurs, ...resultatCreateurs.erreurs];
	if (erreurs.length > 0) {
		const limite = erreurs.find((e) => e instanceof ErreurGithub && e.type === 'limite');
		notes.push(
			limite
				? `${messageErreur(limite)} Certains détails manquent.`
				: `${erreurs.length} favori${erreurs.length > 1 ? 's' : ''} sans détails : GitHub n'a pas répondu.`,
		);
	}
	const note = $('note');
	note.hidden = notes.length === 0;
	note.textContent = notes.join(' ');

	if (resultatRepos.elements.length > 0) {
		remplirListe('liste-repos', resultatRepos.elements);
		$('section-repos').hidden = false;
	}
	if (resultatCreateurs.elements.length > 0) {
		remplirListe('liste-createurs', resultatCreateurs.elements);
		$('section-createurs').hidden = false;
	}
	// Une seule liste à l'écran : le titre de section est redondant avec la pastille, on le garde pour les lecteurs d'écran
	for (const id of ['titre-repos', 'titre-createurs']) $(id).classList.toggle('sr-only', vue !== 'tout');

	$('chargement').hidden = true;
	$('contenu').hidden = false;
	filtrer();
}

$<HTMLFormElement>('formulaire-filtre').addEventListener('submit', (evenement) => evenement.preventDefault());
$('filtre-favoris').addEventListener('input', filtrer);
charger();
