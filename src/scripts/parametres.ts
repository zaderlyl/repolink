// Page Paramètres : trois sections (?section=preferences | compte | theme) et des réglages gardés dans le navigateur.
//   - Préférences : langages favoris, niveau, projets actifs, repos archivés (src/lib/preferences.ts), enregistrés à chaque changement ;
//   - Compte : pseudo de la connexion, déconnexion, suppression de toutes les données locales, token GitHub facultatif ;
//   - Thème : seul « Sombre » existe pour l'instant.
import { CONTOUR, CONTOUR_COURANT } from '../lib/menu.ts';
import { ecrirePreferences, lirePreferences, resumeLangages } from '../lib/preferences.ts';
import type { Niveau, Preferences } from '../lib/preferences.ts';
import { effacerToutesLesDonnees } from '../lib/donnees.ts';
import { lireSession } from '../lib/session.ts';
import { ecrireToken, effacerToken, estTokenValide, finDeToken, lireToken, nettoyerToken } from '../lib/token.ts';
import { afficherErreur } from './formulaire.ts';
import { $ } from './modeles.ts';
import { afficherToast } from './toasts.ts';

type Section = 'preferences' | 'compte' | 'theme';
const SECTIONS: Section[] = ['preferences', 'compte', 'theme'];

function stockage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

// --- Sections et menu ---

function lireSection(): Section {
	const section = new URLSearchParams(location.search).get('section');
	return SECTIONS.find((s) => s === section) ?? 'preferences';
}

function afficherSection(courante: Section) {
	for (const section of SECTIONS) $(`section-${section}`).hidden = section !== courante;
	for (const lien of document.querySelectorAll<HTMLElement>('#menu a')) {
		const actif = lien.dataset.section === courante;
		lien.toggleAttribute('aria-current', actif);
		if (actif) lien.setAttribute('aria-current', 'page');
		for (const classe of CONTOUR.split(' ')) lien.classList.toggle(classe, !actif);
		for (const classe of CONTOUR_COURANT.split(' ')) lien.classList.toggle(classe, actif);
	}
}

// --- Préférences ---

let preferences: Preferences = lirePreferences(stockage());

const casesLangages = () => [...document.querySelectorAll<HTMLInputElement>('input[data-langage]')];

function remplirPreferences() {
	for (const case_ of casesLangages()) case_.checked = preferences.langages.includes(case_.value);
	$('resume-langages').textContent = resumeLangages(preferences.langages);
	$<HTMLSelectElement>('preference-niveau').value = preferences.niveau;
	$<HTMLInputElement>('preference-actifs').checked = preferences.projetsActifs;
	$<HTMLInputElement>('preference-archives').checked = preferences.masquerArchives;
}

// Lit les champs, enregistre, et prévient
function enregistrerPreferences() {
	preferences = {
		...preferences,
		langages: casesLangages().filter((c) => c.checked).map((c) => c.value),
		niveau: $<HTMLSelectElement>('preference-niveau').value as Niveau,
		projetsActifs: $<HTMLInputElement>('preference-actifs').checked,
		masquerArchives: $<HTMLInputElement>('preference-archives').checked,
	};
	$('resume-langages').textContent = resumeLangages(preferences.langages);
	if (ecrirePreferences(stockage(), preferences)) afficherToast('Préférences enregistrées');
	else afficherToast('Préférences non enregistrées : ton navigateur bloque le stockage.', 'erreur');
}

function brancherPreferences() {
	for (const champ of [...casesLangages(), $('preference-niveau'), $('preference-actifs'), $('preference-archives')]) {
		champ.addEventListener('change', enregistrerPreferences);
	}

	// La liste de langages se ferme avec Échap (le focus revient sur son bouton) et quand on clique ailleurs
	const menu = $<HTMLDetailsElement>('menu-langages');
	menu.addEventListener('keydown', (evenement) => {
		if (evenement.key === 'Escape' && menu.open) {
			menu.open = false;
			menu.querySelector('summary')?.focus();
		}
	});
	document.addEventListener('click', (evenement) => {
		if (menu.open && !menu.contains(evenement.target as Node)) menu.open = false;
	});
}

// --- Compte ---

function afficherCompte() {
	const session = lireSession(stockage());
	$<HTMLInputElement>('compte-pseudo').value = session ? `@${session.pseudo}` : '';
	$('compte-non-connecte').hidden = !!session;
	$('bouton-deconnecter').hidden = !session;
}

function brancherCompte() {
	const supprimer = $('bouton-supprimer');
	const confirmation = $('confirmation');
	const montrer = (visible: boolean) => {
		confirmation.hidden = !visible;
		supprimer.setAttribute('aria-expanded', String(visible));
		if (visible) $('bouton-annuler').focus();
	};
	supprimer.addEventListener('click', () => montrer(Boolean(confirmation.hidden)));
	$('bouton-annuler').addEventListener('click', () => {
		montrer(false);
		supprimer.focus();
	});
	$('bouton-confirmer').addEventListener('click', () => {
		if (!effacerToutesLesDonnees(stockage())) {
			afficherToast('Suppression incomplète : ton navigateur bloque le stockage.', 'erreur');
			return;
		}
		preferences = lirePreferences(stockage());
		remplirPreferences();
		afficherCompte();
		montrer(false);
		// La navbar et les autres pages relisent l'état de connexion
		window.dispatchEvent(new CustomEvent('session-changee'));
		afficherToast('Données supprimées de ce navigateur');
	});
	// Déconnexion faite avec le bouton de la page ou celui de la navbar
	window.addEventListener('session-changee', afficherCompte);
}

// --- Token GitHub ---

function afficherEtatToken() {
	const token = lireToken(stockage());
	$('etat-token').textContent = token
		? `Token enregistré (${finDeToken(token)}) : tes requêtes utilisent ton quota de 5000 par heure.`
		: 'Aucun token : tu utilises le quota partagé de 60 requêtes par heure.';
	$('bouton-retirer-token').hidden = !token;
}

function brancherToken() {
	const champ = $<HTMLInputElement>('compte-token');
	$<HTMLFormElement>('formulaire-token').addEventListener('submit', (evenement) => {
		evenement.preventDefault();
		const token = nettoyerToken(champ.value);
		if (!estTokenValide(token)) {
			afficherErreur(champ, 'Ce n’est pas un token GitHub : il commence par « github_pat_ » ou « ghp_ ».');
			champ.focus();
			return;
		}
		afficherErreur(champ, '');
		if (!ecrireToken(stockage(), token)) {
			afficherToast('Token non enregistré : ton navigateur bloque le stockage.', 'erreur');
			return;
		}
		champ.value = '';
		afficherEtatToken();
		afficherToast('Token enregistré');
	});
	champ.addEventListener('input', () => afficherErreur(champ, ''));
	$('bouton-retirer-token').addEventListener('click', () => {
		if (!effacerToken(stockage())) {
			afficherToast('Token non retiré : ton navigateur bloque le stockage.', 'erreur');
			return;
		}
		afficherEtatToken();
		afficherToast('Token retiré');
	});
	// La suppression des données (bouton « Supprimer mon compte ») efface aussi le token
	window.addEventListener('session-changee', afficherEtatToken);
}

// --- Thème ---

// Un seul thème existe : « Sombre » reste allumé même si on clique dessus (comme une liste de boutons radio)
function brancherTheme() {
	const sombre = $<HTMLInputElement>('theme-sombre');
	sombre.addEventListener('change', () => {
		sombre.checked = true;
	});
}

afficherSection(lireSection());
remplirPreferences();
brancherPreferences();
afficherCompte();
brancherCompte();
brancherToken();
afficherEtatToken();
brancherTheme();
