// Page Pour toi : analyse les repos d'un pseudo GitHub, détecte ses langages et recommande des repos pour débutants.
// Le pseudo vient de l'adresse (?pseudo=…), sinon de la personne connectée (src/lib/session.ts), sinon de la saisie.
import { ErreurGithub, rechercherRepos, recupererReposUtilisateur } from '../lib/github.ts';
import type { RepoGithub } from '../lib/github.ts';
import { couleurLangage } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { construireRequeteRecommandation, langagesPrincipaux, melanger, NB_PAR_LANGAGE } from '../lib/recommandations.ts';
import { estPseudoValide, hrefRecherche, lirePseudo } from '../lib/recherche.ts';
import { lireSession, nettoyerPseudo } from '../lib/session.ts';
import { $, creerCarteRepo, depuisModele, messageErreur, montrer } from './commun.ts';
import { afficherErreur, validerFormulaire } from './formulaire.ts';

const ZONES = ['accueil', 'chargement', 'resultats', 'erreur'];
const formulaire = $<HTMLFormElement>('formulaire-pour-toi');
const champ = $<HTMLInputElement>('pour-toi-pseudo');
const bouton = $<HTMLButtonElement>('bouton-analyser');

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function afficherCompetences(langages: string[], pseudo: string) {
	const liste = $('competences');
	const vide = $('competences-vide');
	liste.replaceChildren(
		...langages.map((langage) =>
			depuisModele('modele-competence', { texte: langage, couleur: couleurLangage(langage), href: hrefRecherche({ langage }) }),
		),
	);
	vide.hidden = langages.length > 0;
	if (langages.length === 0) vide.textContent = `On n'a trouvé aucun langage dans les repos publics de @${pseudo}.`;
}

function afficherRecommandations(repos: RepoGithub[], deuxEtapes: boolean) {
	const liste = $('liste-reco');
	const vide = $('reco-vide');
	liste.replaceChildren(
		...repos.map((repo) => {
			const item = document.createElement('li');
			item.append(creerCarteRepo(repo));
			return item;
		}),
	);
	vide.hidden = repos.length > 0;
	if (repos.length === 0) {
		vide.textContent = deuxEtapes
			? 'Aucun repo pour débutants trouvé dans tes langages pour le moment.'
			: 'Sans langage détecté, on ne peut pas te proposer de repos. Essaie plutôt la recherche.';
	}
}

async function analyser(pseudo: string) {
	purgerCache();
	montrer(ZONES, 'chargement');
	bouton.disabled = true;
	bouton.textContent = 'Analyse…';
	try {
		const repos = await recupererReposUtilisateur(pseudo, 100);
		const langages = langagesPrincipaux(repos);
		afficherCompetences(langages, pseudo);

		// Une recherche par langage (3 au plus) : GitHub accepte 10 recherches par minute sans token
		const listes: RepoGithub[][] = [];
		for (const langage of langages) {
			const resultat = await rechercherRepos(construireRequeteRecommandation(langage, pseudo), {
				tri: 'updated',
				ordre: 'desc',
				parPage: NB_PAR_LANGAGE + 2, // un peu de marge si un repo est déjà pris par un autre langage
			});
			listes.push(resultat.items);
		}
		afficherRecommandations(melanger(listes), langages.length > 0);
		montrer(ZONES, 'resultats');
		// L'adresse garde le pseudo : on peut recharger ou partager la page
		history.replaceState(null, '', `/pour-toi?pseudo=${pseudo}`);
	} catch (erreur) {
		if (erreur instanceof ErreurGithub && erreur.type === 'introuvable') {
			montrer(ZONES, 'accueil');
			afficherErreur(champ, 'Ce pseudo n’existe pas sur GitHub.');
			champ.focus();
		} else {
			document.querySelector('#erreur p')!.textContent = messageErreur(erreur);
			montrer(ZONES, 'erreur');
		}
	} finally {
		bouton.disabled = false;
		bouton.textContent = 'Analyser';
	}
}

function lancer() {
	const pseudo = nettoyerPseudo(champ.value);
	if (!estPseudoValide(pseudo)) {
		afficherErreur(champ, 'Un pseudo GitHub ne contient que des lettres, des chiffres et des tirets (39 au plus).');
		champ.focus();
		return;
	}
	void analyser(pseudo);
}

validerFormulaire(formulaire, lancer);
$('reessayer').addEventListener('click', lancer);

// Départ : pseudo de l'adresse, sinon de la session. Dans les deux cas l'analyse part toute seule.
const depart = lirePseudo(new URLSearchParams(location.search)) || lireSession(stockage())?.pseudo || '';
if (depart) {
	champ.value = depart;
	lancer();
}
