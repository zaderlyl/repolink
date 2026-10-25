// Page Mise en relation : cherche sur GitHub des personnes à contacter (mentors ou débutants, ?type=…),
// les affiche en cartes et filtre par texte. Les langages favoris des Paramètres orientent la recherche.
import { rechercherRepos } from '../lib/github.ts';
import type { RepoGithub } from '../lib/github.ts';
import { hrefContacter } from '../lib/adresses.ts';
import { purgerCache } from '../lib/cache.ts';
import { correspond } from '../lib/favoris.ts';
import {
	construireRequeteMise,
	extrairePersonnes,
	langagesAInterroger,
	lireType,
	TYPES_MISE_EN_RELATION,
} from '../lib/mise-en-relation.ts';
import { lirePreferences } from '../lib/preferences.ts';
import { lireSession } from '../lib/session.ts';
import { $, afficherErreurPage, depuisModele, montrer } from './commun.ts';
import { lien } from '../lib/adresses.ts';

const ZONES = ['chargement', 'contenu', 'vide', 'erreur'];
const type = lireType(new URLSearchParams(location.search).get('type'));

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function afficherPastilles() {
	$('types').replaceChildren(
		...TYPES_MISE_EN_RELATION.map(({ id, texte }) =>
			depuisModele(id === type ? 'modele-chip-actif' : 'modele-chip', {
				texte,
				href: lien(id === 'mentors' ? '/mise-en-relation' : `/mise-en-relation?type=${id}`),
			}),
		),
	);
}

// Le filtre cache les cartes qui ne correspondent pas ; une phrase prend le relais si plus rien ne reste
function filtrer() {
	const recherche = $<HTMLInputElement>('filtre-personnes').value;
	let visibles = 0;
	const items = document.querySelectorAll<HTMLElement>('#liste-personnes > li');
	for (const item of items) {
		const garde = correspond(item.dataset.texte ?? '', recherche);
		item.hidden = !garde;
		if (garde) visibles++;
	}
	const message = $('aucun-resultat');
	message.hidden = items.length === 0 || visibles > 0;
	message.textContent = `Personne ne correspond à « ${recherche.trim()} ».`;
}

async function charger() {
	purgerCache();
	montrer(ZONES, 'chargement');
	try {
		const preferences = lirePreferences(stockage());
		const listes: RepoGithub[][] = [];
		// Une recherche à la fois : GitHub accepte 10 recherches par minute sans token
		for (const langage of langagesAInterroger(preferences.langages)) {
			const resultat = await rechercherRepos(construireRequeteMise(type, langage), {
				tri: type === 'mentors' ? 'stars' : 'updated',
				ordre: 'desc',
				parPage: 50,
			});
			listes.push(resultat.items);
		}
		const personnes = extrairePersonnes(listes, type, lireSession(stockage())?.pseudo ?? '');
		if (personnes.length === 0) {
			montrer(ZONES, 'vide');
			return;
		}
		$('liste-personnes').replaceChildren(
			...personnes.map((p) => {
				const item = document.createElement('li');
				item.dataset.texte = `${p.pseudo} ${p.langage}`;
				item.append(
					depuisModele('modele-personne', {
						nom: p.pseudo,
						href: hrefContacter(p.pseudo),
						avatar: p.avatar,
						langage: p.langage,
						role: p.role,
					}),
				);
				return item;
			}),
		);
		montrer(ZONES, 'contenu');
		filtrer();
	} catch (erreur) {
		afficherErreurPage(erreur);
		montrer(ZONES, 'erreur');
	}
}

$('note').textContent =
	type === 'mentors'
		? 'Des personnes qui ont un projet populaire avec des issues pour débutants. Sélection indicative faite à partir de GitHub.'
		: 'Des personnes qui viennent de publier leurs premiers projets. Sélection indicative faite à partir de GitHub.';
afficherPastilles();
$<HTMLFormElement>('formulaire-filtre').addEventListener('submit', (evenement) => evenement.preventDefault());
$('filtre-personnes').addEventListener('input', filtrer);
$('reessayer').addEventListener('click', charger);
void charger();
