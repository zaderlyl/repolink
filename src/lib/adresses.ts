// Adresses des pages d'un repo et d'un profil.
// Le site est statique : on ne peut pas construire une page par repo de GitHub. Il y a donc une seule page
// « repo » et une seule page « profil », qui lisent dans l'adresse quel repo ou quel profil afficher.
// Dans lib/ pour servir aux pages Astro comme aux scripts du navigateur.

export type OngletRepo = 'apercu' | 'issues' | 'contributeurs' | 'similaires';

// Le nom d'un repo ne contient que des lettres, chiffres et - _ . / : il s'écrit tel quel dans l'adresse.
// L'onglet « Aperçu » est celui par défaut : il n'est pas écrit.
export const hrefRepo = (nom: string, onglet: OngletRepo = 'apercu') =>
	`/repo?nom=${nom}${onglet === 'apercu' ? '' : `&onglet=${onglet}`}`;

export const hrefProfil = (pseudo: string) => `/profil?pseudo=${pseudo}`;

// Page « Contacter un créateur » (étape 7.5)
export const hrefContacter = (pseudo: string) => `/contacter?pseudo=${pseudo}`;
