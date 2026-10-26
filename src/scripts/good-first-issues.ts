// Page Good first issues : lit l'adresse (?langage=…&page=…), interroge l'API de GitHub (avec cache)
// et remplit la liste. Les modèles HTML (<template>) viennent de src/pages/good-first-issues.astro.
import { rechercherIssues } from '../lib/github.ts';
import type { IssueGithub, ResultatRecherche } from '../lib/github.ts';
import { versIssue } from '../lib/conversion.ts';
import { purgerCache } from '../lib/cache.ts';
import { hrefRepo } from '../lib/adresses.ts';
import { construireOptionsIssues, construireRequeteIssues, hrefIssues, lireFiltres, nombrePages } from '../lib/recherche.ts';
import { $, afficherErreurPage, afficherPagination, afficherPastilles, depuisModele, montrer } from './commun.ts';

const LANGAGES_RAPIDES = ['JavaScript', 'Python', 'CSS'];
const ZONES = ['liste', 'chargement', 'vide', 'erreur'];

const nombre = new Intl.NumberFormat('fr-FR');
const titrePanneau = () => document.querySelector('#entete-panneau h2') as HTMLElement;

function afficherIssues(issues: IssueGithub[]) {
	const liste = $('liste');
	liste.replaceChildren();
	for (const issueGithub of issues) {
		const issue = versIssue(issueGithub);
		liste.append(
			depuisModele('modele-issue', {
				titre: issue.titre,
				href: hrefRepo(issue.repo),
				repo: issue.repo,
				ouverte: issue.ouverte,
			}),
		);
	}
}

async function charger() {
	purgerCache();
	const filtres = lireFiltres(new URLSearchParams(location.search));
	afficherPastilles($('filtres'), {
		langagesRapides: LANGAGES_RAPIDES,
		langage: filtres.langages[0] ?? '',
		hrefLangage: (langage) => hrefIssues({ langages: langage ? [langage] : [] }),
	});
	montrer(ZONES, 'chargement');

	let resultat: ResultatRecherche<IssueGithub>;
	try {
		resultat = await rechercherIssues(construireRequeteIssues(filtres), construireOptionsIssues(filtres));
	} catch (erreur) {
		titrePanneau().textContent = 'Issues ouvertes';
		afficherErreurPage(erreur);
		$('panneau').hidden = true;
		montrer(ZONES, 'erreur');
		return;
	}

	// Page trop loin (adresse tapée à la main) : on va à la dernière page qui existe
	const pages = nombrePages(resultat.total_count);
	if (filtres.page > pages) {
		location.replace(hrefIssues({ ...filtres, page: pages }));
		return;
	}

	if (resultat.items.length === 0) {
		$('panneau').hidden = true;
		montrer(ZONES, 'vide');
		return;
	}
	$('panneau').hidden = false;
	titrePanneau().textContent = `Issues ouvertes · ${nombre.format(resultat.total_count)}`;
	afficherIssues(resultat.items);
	afficherPagination($('pagination'), filtres.page, resultat.total_count, (page) => hrefIssues({ ...filtres, page }));
	montrer(ZONES, 'liste');
}

$('reessayer').addEventListener('click', () => location.reload());
charger();
