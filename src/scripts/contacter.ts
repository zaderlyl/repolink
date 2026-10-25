// Page Contacter un créateur : lit le pseudo dans l'adresse (?pseudo=…), va chercher son nom sur GitHub,
// et envoie vers la page « Message envoyé » quand le formulaire est valide (rien n'est réellement envoyé).
import { ErreurGithub, recupererProfil } from '../lib/github.ts';
import { versProfil } from '../lib/conversion.ts';
import { lirePseudo } from '../lib/recherche.ts';
import { $ } from './commun.ts';
import { validerFormulaire } from './formulaire.ts';
import { lien } from '../lib/adresses.ts';

const formulaire = $<HTMLFormElement>('formulaire-createur');
const message = $<HTMLTextAreaElement>('contacter-message');

async function charger() {
	const pseudo = lirePseudo(new URLSearchParams(location.search));
	if (!pseudo) {
		montrerIntrouvable();
		return;
	}
	// Le temps de la réponse, on montre déjà le pseudo ; le nom complet le remplace s'il arrive
	$('nom-createur').textContent = pseudo;

	try {
		const profil = versProfil(await recupererProfil(pseudo));
		$('nom-createur').textContent = profil.nom;
		document.title = `Écrire à ${profil.nom} · Repolink`;
		const prenom = profil.nom.split(' ')[0];
		message.placeholder = `Bonjour ${prenom}, j’ai découvert ton projet et…`;
	} catch (erreur) {
		// Un profil qui n'existe pas : rien à contacter. Toute autre erreur (réseau, limite) ne bloque pas le formulaire.
		if (erreur instanceof ErreurGithub && erreur.type === 'introuvable') montrerIntrouvable();
	}
}

function montrerIntrouvable() {
	// Le titre de la page change mais reste caché à l'écran : l'écran « Créateur introuvable » a déjà le sien
	const titre = $('titre-contacter');
	titre.textContent = 'Créateur introuvable';
	titre.classList.add('sr-only');
	$('formulaire-zone').hidden = true;
	$('introuvable').hidden = false;
}

// Les champs sont vérifiés avant d'arriver ici. Pas d'envoi réel ni de données dans l'adresse :
// on affiche simplement la page de confirmation.
validerFormulaire(formulaire, () => window.location.assign(lien('/message-envoye')));

charger();
