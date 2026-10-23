// Page Profil créateur : lit l'adresse (?pseudo=…), interroge l'API de GitHub (avec cache) et remplit la page.
// Les modèles HTML (<template>) viennent de src/pages/profil.astro.
// Le profil se charge d'abord ; ses repos et son activité se chargent ensuite : si l'un échoue, le reste s'affiche.
import {
	ErreurGithub,
	recupererEvenementsRecents,
	recupererProfil,
	recupererReposUtilisateur,
} from '../lib/github.ts';
import type { EvenementGithub, RepoGithub } from '../lib/github.ts';
import { EVENEMENTS_MAX, grilleActivite, semainesCouvertes, versProfilCreateur } from '../lib/conversion.ts';
import type { ProfilCreateur } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { hrefContacter } from '../lib/adresses.ts';
import { NIVEAUX_GRILLE, TAILLES_GRILLE } from '../lib/grille.ts';
import { hrefRecherche, lirePseudo } from '../lib/recherche.ts';
import { $, creerCarteRepo, depuisModele, messageErreur, montrer } from './commun.ts';

const ZONES = ['chargement', 'contenu', 'introuvable', 'erreur'];
const NB_REPOS = 6;
const NB_SEMAINES = 13;

function afficherProfil(profil: ProfilCreateur) {
	document.title = `${profil.nom} · Repolink`;
	$('titre-page').textContent = profil.nom;
	$('avatar-profil').replaceChildren(depuisModele('modele-avatar', { src: profil.avatar }));
	$('nom').textContent = profil.nom;
	const bio = $('bio');
	bio.textContent = profil.bio;
	bio.hidden = !profil.bio;
	$<HTMLAnchorElement>('lien-contact').href = hrefContacter(profil.pseudo);
}

// Lignes d'information de la carte de gauche : seules celles qu'on a pu remplir sont affichées
function afficherInfos(profil: ProfilCreateur, evenements: number | null) {
	const lignes: { label: string; href: string }[] = [];
	if (profil.langages.length > 0) {
		lignes.push({ label: `Langages : ${profil.langages.join(', ')}`, href: hrefRecherche({ langage: profil.langages[0] }) });
	}
	if (profil.competences.length > 0) {
		lignes.push({ label: `Compétences : ${profil.competences.join(', ')}`, href: hrefRecherche({ topic: profil.competences[0] }) });
	}
	// Pas de ligne quand il n'y a rien à dire (ex. une organisation n'a pas d'événements publics à son nom)
	if (evenements) lignes.push({ label: `Activité récente : ${evenements} événement${evenements > 1 ? 's' : ''}`, href: '#activite' });
	lignes.push({ label: profil.lienGithub, href: profil.urlGithub });

	$('infos').replaceChildren(...lignes.map((ligne) => depuisModele('modele-info', ligne)));
}

function afficherRepos(repos: RepoGithub[]) {
	const liste = $('liste-repos');
	const vide = $('repos-vide');
	// Les forks sont des copies de repos d'autres personnes : ce ne sont pas ses créations. Les plus étoilés d'abord.
	const siens = repos.filter((repo) => !repo.fork).sort((a, b) => b.stargazers_count - a.stargazers_count);
	if (siens.length === 0) {
		vide.textContent = 'Aucun repo public pour le moment.';
		vide.hidden = false;
		return siens;
	}
	liste.replaceChildren(
		...siens.slice(0, NB_REPOS).map((repo) => {
			const item = document.createElement('li');
			item.append(creerCarteRepo(repo));
			return item;
		}),
	);
	return siens;
}

// Dessine la grille d'activité (mêmes classes que le composant GrilleContributions, voir src/lib/grille.ts)
function afficherGrille(evenements: EvenementGithub[]) {
	const nbSemaines = semainesCouvertes(evenements, NB_SEMAINES);
	const { semaines, total } = grilleActivite(evenements, nbSemaines);
	const { grille, cellule, ligne } = TAILLES_GRILLE.grande;

	const conteneur = document.createElement('div');
	conteneur.setAttribute('role', 'img');
	conteneur.setAttribute('aria-label', nbSemaines > 1 ? `Activité des ${nbSemaines} dernières semaines` : 'Activité de la dernière semaine');
	conteneur.className = `${grille} w-max`;
	conteneur.style.gridTemplateRows = `repeat(7, ${ligne})`;
	for (const semaine of semaines) {
		for (const niveau of semaine) {
			const jour = document.createElement('span');
			jour.className = `${cellule} ${NIVEAUX_GRILLE[niveau] ?? NIVEAUX_GRILLE[0]}`;
			conteneur.append(jour);
		}
	}
	$('grille').replaceChildren(conteneur);

	const pluriel = total > 1 ? 's' : '';
	let resume: string;
	if (total === 0) {
		resume = 'Aucun événement public sur GitHub ces 90 derniers jours.';
	} else if (evenements.length >= EVENEMENTS_MAX) {
		// Très actif : GitHub ne donne que les 300 derniers événements
		const depuis = new Date(Math.min(...evenements.map((e) => new Date(e.created_at).getTime())));
		const date = depuis.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
		resume = `Les ${total} derniers événements publics sur GitHub, depuis le ${date} (GitHub n’en garde pas plus).`;
	} else {
		resume = `${total} événement${pluriel} public${pluriel} sur GitHub ces 90 derniers jours.`;
	}
	$('resume-activite').textContent = `${resume} Une colonne par semaine, du lundi au dimanche.`;
	return total;
}

async function charger() {
	purgerCache();
	const pseudo = lirePseudo(new URLSearchParams(location.search));
	if (!pseudo) {
		montrer(ZONES, 'introuvable');
		return;
	}
	montrer(ZONES, 'chargement');

	let utilisateur;
	try {
		utilisateur = await recupererProfil(pseudo);
	} catch (erreur) {
		if (erreur instanceof ErreurGithub && erreur.type === 'introuvable') {
			montrer(ZONES, 'introuvable');
		} else {
			document.querySelector('#erreur p')!.textContent = messageErreur(erreur);
			montrer(ZONES, 'erreur');
		}
		return;
	}

	// Les repos et l'activité se chargent en parallèle ; l'un peut échouer sans gêner l'autre
	const [repos, evenements] = await Promise.allSettled([
		recupererReposUtilisateur(pseudo, 30),
		recupererEvenementsRecents(pseudo),
	]);

	const listeRepos = repos.status === 'fulfilled' ? repos.value : [];
	const profil = versProfilCreateur(
		utilisateur,
		listeRepos.filter((repo) => !repo.fork),
	);
	afficherProfil(profil);
	montrer(ZONES, 'contenu');

	if (repos.status === 'fulfilled') {
		afficherRepos(listeRepos);
	} else {
		$('repos-vide').textContent = `Repos indisponibles : ${messageErreur(repos.reason)}`;
		$('repos-vide').hidden = false;
	}

	if (evenements.status === 'fulfilled') {
		afficherInfos(profil, afficherGrille(evenements.value));
	} else {
		$('resume-activite').textContent = `Activité indisponible : ${messageErreur(evenements.reason)}`;
		afficherInfos(profil, null);
	}
}

$('reessayer').addEventListener('click', () => location.reload());
charger();
