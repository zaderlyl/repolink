// Validation des formulaires : affiche les erreurs sous les champs, avec le style du composant, à la place des bulles du navigateur.
// Utilisation : validerFormulaire(formulaire, () => { …le formulaire est valide… });
// Le formulaire doit avoir l'attribut `novalidate` (sinon le navigateur afficherait sa bulle avant nous).
// Les règles viennent des attributs des champs : required, type="email", minlength.
import { CLASSE_MESSAGE_ERREUR, messageDuChamp } from '../lib/champs.ts';

type Champ = HTMLInputElement | HTMLTextAreaElement;

// Les champs à vérifier : les saisies et zones de texte (une liste déroulante a toujours une valeur)
const champsDe = (formulaire: HTMLFormElement) =>
	[...formulaire.elements].filter(
		(element): element is Champ => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement,
	);

function message(champ: Champ): string {
	return messageDuChamp({
		valeur: champ.value,
		obligatoire: champ.required,
		type: champ.type,
		longueurMin: champ.minLength > 0 ? champ.minLength : 0,
		// Le contrôle d'e-mail du navigateur : « typeMismatch » vaut true si ce n'est pas une adresse
		emailValide: !champ.validity.typeMismatch,
	});
}

// Montre ou retire l'erreur d'un champ : aria-invalid (contour rouge), message relié au champ par aria-describedby
export function afficherErreur(champ: Champ, texte: string) {
	const idMessage = `${champ.id}-erreur`;
	let element = document.getElementById(idMessage);

	if (!texte) {
		champ.removeAttribute('aria-invalid');
		champ.removeAttribute('aria-describedby');
		element?.remove();
		return;
	}
	if (!element) {
		element = document.createElement('p');
		element.id = idMessage;
		element.className = CLASSE_MESSAGE_ERREUR;
		champ.after(element);
	}
	element.textContent = texte;
	champ.setAttribute('aria-invalid', 'true');
	champ.setAttribute('aria-describedby', idMessage);
}

export function validerFormulaire(formulaire: HTMLFormElement, quandValide: () => void) {
	const champs = champsDe(formulaire);

	formulaire.addEventListener('submit', (evenement) => {
		evenement.preventDefault();
		let premierEnErreur: Champ | null = null;
		for (const champ of champs) {
			const texte = message(champ);
			afficherErreur(champ, texte);
			if (texte && !premierEnErreur) premierEnErreur = champ;
		}
		// Le focus va au premier champ en erreur : un lecteur d'écran lit alors son message
		if (premierEnErreur) premierEnErreur.focus();
		else quandValide();
	});

	// Une fois une erreur affichée, elle se met à jour pendant la frappe : elle disparaît dès que le champ est correct.
	// (On n'en affiche pas de nouvelle pendant la frappe : ce serait agressif avant la fin de la saisie.)
	for (const champ of champs) {
		champ.addEventListener('input', () => {
			if (champ.getAttribute('aria-invalid') === 'true') afficherErreur(champ, message(champ));
		});
	}
}
