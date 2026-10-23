// Page Fiche repo : lit l'adresse (?nom=proprietaire/repo&onglet=…), interroge l'API de GitHub (avec cache)
// et remplit la page. Les modèles HTML (<template>) viennent de src/pages/repo.astro.
// Le repo se charge d'abord ; ses blocs (langages, créateur, issues, similaires) se chargent ensuite chacun de leur côté :
// si l'un échoue, les autres s'affichent quand même.
import {
	ErreurGithub,
	rechercherIssues,
	rechercherRepos,
	recupererContributeurs,
	recupererLangages,
	recupererProfil,
	recupererRepo,
} from '../lib/github.ts';
import type { IssueGithub } from '../lib/github.ts';
import {
	ilYA,
	nomRepoDepuisUrl,
	versContributeur,
	versFicheRepo,
	versProfil,
	versRepartition,
} from '../lib/conversion.ts';
import type { FicheRepo } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { hrefProfil, hrefRepo } from '../lib/adresses.ts';
import type { OngletRepo } from '../lib/adresses.ts';
import {
	construireRequeteIssuesRepo,
	construireRequeteSimilaires,
	lireFiltres,
	lireNomRepo,
	lireOnglet,
	nombrePages,
	RESULTATS_PAR_PAGE,
} from '../lib/recherche.ts';
import { $, afficherPagination, creerCarteRepo, depuisModele, messageErreur, montrer } from './commun.ts';

const ZONES = ['chargement', 'contenu', 'introuvable', 'erreur'];
const ONGLETS: { id: OngletRepo; texte: string }[] = [
	{ id: 'apercu', texte: 'Aperçu' },
	{ id: 'issues', texte: 'Issues' },
	{ id: 'contributeurs', texte: 'Contributeurs' },
	{ id: 'similaires', texte: 'Similaires' },
];
const NB_ISSUES = 4; // dans l'Aperçu
const NB_SIMILAIRES = 2; // dans l'Aperçu
const MAX_CONTRIBUTEURS = 30; // l'API en donne 30 par page : on affiche les 30 premiers

function afficherOnglets(nom: string, onglet: OngletRepo) {
	const barre = $('onglets');
	barre.replaceChildren();
	for (const { id, texte } of ONGLETS) {
		barre.append(depuisModele(id === onglet ? 'modele-onglet-actif' : 'modele-onglet', { texte, href: hrefRepo(nom, id) }));
	}
}

function afficherEntete(fiche: FicheRepo) {
	document.title = `${fiche.nom} · Repolink`;
	$('titre-page').textContent = fiche.nom;

	$('avatar-repo').replaceChildren(depuisModele('modele-avatar', { src: fiche.avatar }));
	const proprietaire = $<HTMLAnchorElement>('lien-proprietaire');
	proprietaire.textContent = fiche.proprietaire;
	proprietaire.href = hrefProfil(fiche.proprietaire);
	const repo = $<HTMLAnchorElement>('lien-repo');
	repo.textContent = fiche.nomCourt;
	repo.href = hrefRepo(fiche.nom);

	// Le bouton Star devient interactif dès qu'il sait de quel repo il s'agit (src/scripts/favoris.ts le repère)
	$('star-repo').dataset.repo = fiche.nom;

	$('visibilite').textContent = fiche.publique ? 'Public' : 'Privé';
	$<HTMLAnchorElement>('lien-github').href = fiche.urlGithub;
	$<HTMLAnchorElement>('lien-fork').href = `${fiche.urlGithub}/fork`;
}

function afficherApropos(fiche: FicheRepo) {
	$('description').textContent = fiche.description || 'Pas de description.';
	const topics = $('topics');
	topics.replaceChildren(...fiche.topics.map((texte) => depuisModele('modele-topic', { texte })));
	topics.hidden = fiche.topics.length === 0;
	$('etoiles').textContent = fiche.etoiles;
	$('forks').textContent = fiche.forks;
	$('watchers').textContent = fiche.watchers;
}

// La ligne mène à l'issue sur GitHub : c'est là qu'on la prend en charge
function creerLigneIssue(issue: IssueGithub) {
	return depuisModele('modele-issue', {
		titre: issue.title,
		href: issue.html_url,
		repo: nomRepoDepuisUrl(issue.repository_url),
		ouverte: ilYA(issue.created_at),
	});
}

// --- Blocs chargés séparément (Aperçu) ---

async function chargerLangages(nom: string) {
	const barre = $('barre-langages');
	const legende = $('legende-langages');
	try {
		const parts = versRepartition(await recupererLangages(nom));
		if (parts.length === 0) {
			barre.hidden = true;
			legende.textContent = 'Aucun code détecté.';
			return;
		}
		barre.replaceChildren(
			...parts.map((part) => {
				const segment = document.createElement('span');
				segment.style.width = `${part.pourcentage}%`;
				segment.style.backgroundColor = part.couleur;
				return segment;
			}),
		);
		legende.replaceChildren(
			...parts.map((part) => {
				const ligne = document.createElement('li');
				ligne.className = 'inline-flex items-center gap-2';
				const pastille = document.createElement('span');
				pastille.setAttribute('aria-hidden', 'true');
				pastille.className = 'size-2.5 rounded-full';
				pastille.style.backgroundColor = part.couleur;
				ligne.append(pastille, `${part.nom} ${part.pourcentage} %`);
				return ligne;
			}),
		);
	} catch {
		barre.hidden = true;
		legende.textContent = 'Langages indisponibles pour le moment.';
	}
}

async function chargerCreateur(fiche: FicheRepo) {
	const zone = $('createur');
	const message = $('createur-vide');
	try {
		const profil = versProfil(await recupererProfil(fiche.proprietaire));
		const ligne = depuisModele('modele-createur', {
			nom: profil.nom,
			pseudo: `@${profil.pseudo}`,
			abonnes: profil.abonnes,
			href: hrefProfil(profil.pseudo),
			avatar: fiche.avatar,
		});
		zone.replaceChildren(ligne);
	} catch {
		message.textContent = 'Créateur indisponible pour le moment.';
		message.hidden = false;
	}
}

async function chargerIssues(fiche: FicheRepo) {
	const liste = $('liste-issues');
	const vide = $('issues-vide');
	$('entete-issues').querySelector('a')!.setAttribute('href', hrefRepo(fiche.nom, 'issues'));
	try {
		const resultat = await rechercherIssues(construireRequeteIssuesRepo(fiche.nom), {
			tri: 'updated',
			ordre: 'desc',
			parPage: NB_ISSUES,
		});
		if (resultat.items.length === 0) {
			vide.textContent = 'Aucune good first issue ouverte pour l’instant.';
			vide.hidden = false;
			return;
		}
		liste.replaceChildren(...resultat.items.map(creerLigneIssue));
	} catch (erreur) {
		vide.textContent = `Issues indisponibles : ${messageErreur(erreur)}`;
		vide.hidden = false;
	}
}

async function chargerSimilaires(fiche: FicheRepo) {
	const liste = $('liste-similaires');
	const vide = $('similaires-vide');
	const requete = construireRequeteSimilaires(fiche);
	if (!requete) {
		vide.textContent = 'Pas assez d’informations pour trouver des repos similaires.';
		vide.hidden = false;
		return;
	}
	try {
		const resultat = await rechercherRepos(requete, { tri: 'stars', ordre: 'desc', parPage: NB_SIMILAIRES });
		if (resultat.items.length === 0) {
			vide.textContent = 'Aucun repo similaire trouvé.';
			vide.hidden = false;
			return;
		}
		liste.replaceChildren(
			...resultat.items.map((repo) => {
				const item = document.createElement('li');
				item.append(creerCarteRepo(repo));
				return item;
			}),
		);
	} catch (erreur) {
		vide.textContent = `Repos similaires indisponibles : ${messageErreur(erreur)}`;
		vide.hidden = false;
	}
}

// --- Onglets Issues, Contributeurs et Similaires ---

// Page demandée au-delà de la dernière (adresse tapée à la main) : on va à la dernière page qui existe
function allerALaDerniere(page: number, total: number, href: (page: number) => string) {
	const pages = nombrePages(total);
	if (page <= pages) return false;
	location.replace(href(pages));
	return true;
}

async function chargerOngletIssues(fiche: FicheRepo, page: number) {
	const liste = $('toutes-issues');
	const vide = $('toutes-issues-vide');
	const attente = $('chargement-issues');
	const href = (p: number) => hrefRepo(fiche.nom, 'issues', p);
	try {
		const resultat = await rechercherIssues(construireRequeteIssuesRepo(fiche.nom), {
			tri: 'updated',
			ordre: 'desc',
			page,
			parPage: RESULTATS_PAR_PAGE,
		});
		if (allerALaDerniere(page, resultat.total_count, href)) return;
		attente.hidden = true;
		$('entete-toutes-issues').querySelector('h2')!.textContent = `Issues ouvertes · ${new Intl.NumberFormat('fr-FR').format(resultat.total_count)}`;
		if (resultat.items.length === 0) {
			vide.textContent = 'Aucune good first issue ouverte pour l’instant.';
			vide.hidden = false;
			return;
		}
		liste.replaceChildren(...resultat.items.map(creerLigneIssue));
		afficherPagination($('pagination'), page, resultat.total_count, href);
	} catch (erreur) {
		attente.hidden = true;
		vide.textContent = `Issues indisponibles : ${messageErreur(erreur)}`;
		vide.hidden = false;
	}
}

async function chargerOngletContributeurs(fiche: FicheRepo) {
	const liste = $('liste-contributeurs');
	const vide = $('contributeurs-vide');
	const attente = $('chargement-contributeurs');
	try {
		const tous = await recupererContributeurs(fiche.nom, MAX_CONTRIBUTEURS);
		attente.hidden = true;
		// Les robots (« xxx[bot] ») n'ont pas de profil : on ne les liste pas
		const contributeurs = tous.filter((c) => !c.login.endsWith('[bot]')).map(versContributeur);
		if (contributeurs.length === 0) {
			vide.textContent = 'Aucun contributeur trouvé.';
			vide.hidden = false;
			return;
		}
		const plusDeTrente = tous.length >= MAX_CONTRIBUTEURS;
		$('titre-contributeurs').textContent = plusDeTrente
			? 'Principaux contributeurs'
			: `${contributeurs.length} contributeur${contributeurs.length > 1 ? 's' : ''}`;
		liste.replaceChildren(
			...contributeurs.map((contributeur) => {
				const item = document.createElement('li');
				item.append(
					depuisModele('modele-contributeur', {
						nom: contributeur.pseudo,
						pseudo: `@${contributeur.pseudo}`,
						detail: contributeur.contributions,
						href: hrefProfil(contributeur.pseudo),
						avatar: contributeur.avatar,
					}),
				);
				return item;
			}),
		);
		if (plusDeTrente) {
			$('contributeurs-plus').hidden = false;
			$<HTMLAnchorElement>('contributeurs-github').href = `${fiche.urlGithub}/graphs/contributors`;
		}
	} catch (erreur) {
		attente.hidden = true;
		vide.textContent = `Contributeurs indisponibles : ${messageErreur(erreur)}`;
		vide.hidden = false;
	}
}

async function chargerOngletSimilaires(fiche: FicheRepo, page: number) {
	const liste = $('tous-similaires');
	const vide = $('tous-similaires-vide');
	const attente = $('chargement-similaires');
	const href = (p: number) => hrefRepo(fiche.nom, 'similaires', p);
	const requete = construireRequeteSimilaires(fiche);
	if (!requete) {
		attente.hidden = true;
		vide.textContent = 'Pas assez d’informations pour trouver des repos similaires.';
		vide.hidden = false;
		return;
	}
	try {
		const resultat = await rechercherRepos(requete, { tri: 'stars', ordre: 'desc', page, parPage: RESULTATS_PAR_PAGE });
		if (allerALaDerniere(page, resultat.total_count, href)) return;
		attente.hidden = true;
		if (resultat.items.length === 0) {
			vide.textContent = 'Aucun repo similaire trouvé.';
			vide.hidden = false;
			return;
		}
		liste.replaceChildren(
			...resultat.items.map((repo) => {
				const item = document.createElement('li');
				item.append(creerCarteRepo(repo));
				return item;
			}),
		);
		afficherPagination($('pagination'), page, resultat.total_count, href);
	} catch (erreur) {
		attente.hidden = true;
		vide.textContent = `Repos similaires indisponibles : ${messageErreur(erreur)}`;
		vide.hidden = false;
	}
}

// --- Page ---

async function charger() {
	purgerCache();
	const parametres = new URLSearchParams(location.search);
	const nom = lireNomRepo(parametres);
	const onglet = lireOnglet(parametres);
	const page = lireFiltres(parametres).page;
	if (!nom) {
		montrer(ZONES, 'introuvable');
		return;
	}
	montrer(ZONES, 'chargement');

	let fiche: FicheRepo;
	try {
		fiche = versFicheRepo(await recupererRepo(nom));
	} catch (erreur) {
		if (erreur instanceof ErreurGithub && erreur.type === 'introuvable') {
			montrer(ZONES, 'introuvable');
		} else {
			document.querySelector('#erreur p')!.textContent = messageErreur(erreur);
			montrer(ZONES, 'erreur');
		}
		return;
	}

	afficherOnglets(fiche.nom, onglet);
	afficherEntete(fiche);
	afficherApropos(fiche);
	for (const { id } of ONGLETS) $(`panneau-${id}`).hidden = id !== onglet;
	montrer(ZONES, 'contenu');

	if (onglet === 'apercu') {
		chargerLangages(fiche.nom);
		chargerCreateur(fiche);
		chargerIssues(fiche);
		chargerSimilaires(fiche);
	} else if (onglet === 'issues') {
		chargerOngletIssues(fiche, page);
	} else if (onglet === 'contributeurs') {
		chargerOngletContributeurs(fiche);
	} else {
		chargerOngletSimilaires(fiche, page);
	}
}

$('reessayer').addEventListener('click', () => location.reload());
charger();
