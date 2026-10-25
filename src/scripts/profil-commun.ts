// Remplissage d'une page de profil, partagé par « Profil créateur » (src/scripts/profil.ts) et « Mon profil » (src/scripts/mon-profil.ts).
// Le profil se charge d'abord ; ses repos et son activité se chargent ensuite : si l'un échoue, le reste s'affiche.
// Les modèles HTML (<template>) viennent de src/components/profil-vue.astro.
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
import { hrefRecherche } from '../lib/recherche.ts';
import { NIVEAUX_GRILLE, TAILLES_GRILLE } from '../lib/grille.ts';
import { $, afficherErreurPage, creerCarteRepo, depuisModele, messageErreur, montrer } from './commun.ts';
import { lien } from '../lib/adresses.ts';

const ZONES = ['chargement', 'contenu', 'introuvable', 'erreur'];
const NB_REPOS = 6;
const NB_SEMAINES = 13;

// Une ligne de la carte de gauche : un texte et la page où elle mène
export type LigneProfil = { label: string; href: string };

export type OptionsProfil = {
	pseudo: string;
	// Titre de la page (onglet du navigateur et lecteurs d'écran) ; le nom de la personne par défaut
	titrePage?: string;
	// Les lignes de la carte de gauche, selon le profil et le nombre d'événements récents (null si inconnu)
	lignes: (profil: ProfilCreateur, evenements: number | null) => LigneProfil[];
};

function afficherProfil(profil: ProfilCreateur, titrePage: string) {
	document.title = `${titrePage} · Repolink`;
	$('titre-page').textContent = titrePage;
	$('avatar-profil').replaceChildren(depuisModele('modele-avatar', { src: profil.avatar }));
	$('nom').textContent = profil.nom;
	const bio = $('bio');
	bio.textContent = profil.bio;
	bio.hidden = !profil.bio;
	// Pas de bouton « Mise en relation » sur sa propre page
	const contact = document.getElementById('lien-contact') as HTMLAnchorElement | null;
	if (contact) contact.href = hrefContacter(profil.pseudo);
}

// Les lignes du profil d'un créateur : seules celles qu'on a pu remplir sont affichées
export function lignesCreateur(profil: ProfilCreateur, evenements: number | null): LigneProfil[] {
	const lignes: LigneProfil[] = [];
	if (profil.langages.length > 0) {
		lignes.push({ label: `Langages : ${profil.langages.join(', ')}`, href: hrefRecherche({ langage: profil.langages[0] }) });
	}
	if (profil.competences.length > 0) {
		lignes.push({ label: `Compétences : ${profil.competences.join(', ')}`, href: hrefRecherche({ topic: profil.competences[0] }) });
	}
	// Pas de ligne quand il n'y a rien à dire (ex. une organisation n'a pas d'événements publics à son nom)
	if (evenements) lignes.push({ label: `Activité récente : ${evenements} événement${evenements > 1 ? 's' : ''}`, href: '#activite' });
	lignes.push({ label: profil.lienGithub, href: profil.urlGithub });
	return lignes;
}

// Les lignes de « Mon profil » : langages, compétences, puis les pages de son compte
export function lignesMoi(favoris: number): (profil: ProfilCreateur) => LigneProfil[] {
	return (profil) => {
		const lignes: LigneProfil[] = [];
		if (profil.langages.length > 0) {
			lignes.push({ label: `Langages : ${profil.langages.join(', ')}`, href: hrefRecherche({ langage: profil.langages[0] }) });
		}
		if (profil.competences.length > 0) {
			lignes.push({ label: `Compétences : ${profil.competences.join(', ')}`, href: hrefRecherche({ topic: profil.competences[0] }) });
		}
		lignes.push({ label: `Favoris (${favoris})`, href: lien('/favoris') });
		lignes.push({ label: 'Paramètres du compte', href: lien('/parametres') });
		return lignes;
	};
}

function afficherLignes(lignes: LigneProfil[]) {
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

export function afficherIntrouvable() {
	montrer(ZONES, 'introuvable');
}

export async function chargerProfil(options: OptionsProfil) {
	purgerCache();
	const { pseudo, lignes } = options;
	montrer(ZONES, 'chargement');

	let utilisateur;
	try {
		utilisateur = await recupererProfil(pseudo);
	} catch (erreur) {
		if (erreur instanceof ErreurGithub && erreur.type === 'introuvable') {
			montrer(ZONES, 'introuvable');
		} else {
			afficherErreurPage(erreur);
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
	afficherProfil(profil, options.titrePage ?? profil.nom);
	montrer(ZONES, 'contenu');

	if (repos.status === 'fulfilled') {
		afficherRepos(listeRepos);
	} else {
		$('repos-vide').textContent = `Repos indisponibles : ${messageErreur(repos.reason)}`;
		$('repos-vide').hidden = false;
	}

	if (evenements.status === 'fulfilled') {
		afficherLignes(lignes(profil, afficherGrille(evenements.value)));
	} else {
		$('resume-activite').textContent = `Activité indisponible : ${messageErreur(evenements.reason)}`;
		afficherLignes(lignes(profil, null));
	}
}

document.getElementById('reessayer')?.addEventListener('click', () => location.reload());
