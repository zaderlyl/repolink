// Messages d'erreur des champs de formulaire, partagés par les composants (rendu à la construction)
// et par le script de validation (src/scripts/formulaire.ts). Le texte de chaque message est choisi
// par `messageDuChamp`, qui ne touche pas à la page : il se teste seul.

// Style du message sous le champ (le contour rouge vient de la variante aria-invalid des composants)
export const CLASSE_MESSAGE_ERREUR = 'text-xs text-accent-danger';

// Ce que `messageDuChamp` a besoin de savoir d'un champ
export type ChampAVerifier = {
	valeur: string;
	obligatoire: boolean;
	type: string; // « email », « text », « textarea »…
	longueurMin: number; // 0 : pas de minimum
	emailValide: boolean; // résultat du contrôle du navigateur (ignoré si le champ n'est pas un e-mail)
};

// Renvoie le message à afficher, ou une chaîne vide si le champ est correct.
// Les espaces seuls comptent pour « vide » (le navigateur, lui, les accepterait).
export function messageDuChamp(champ: ChampAVerifier): string {
	const texte = champ.valeur.trim();
	if (texte === '') return champ.obligatoire ? 'Ce champ est obligatoire.' : '';
	if (champ.type === 'email' && !champ.emailValide) {
		return 'Saisis une adresse e-mail valide, par exemple toi@exemple.fr.';
	}
	if (champ.longueurMin > 0 && texte.length < champ.longueurMin) {
		return `Écris au moins ${champ.longueurMin} caractères (tu en as ${texte.length}).`;
	}
	return '';
}
