// Adresses des pages d'un repo et d'un profil.
// Le site est statique : on ne peut pas construire une page par repo de GitHub. Il y a donc une seule page
// « repo » et une seule page « profil », qui lisent dans l'adresse quel repo ou quel profil afficher.
// Dans lib/ pour servir aux pages Astro comme aux scripts du navigateur.

// Dossier du site : « /repolink » sur GitHub Pages (`base` dans astro.config.mjs). `import.meta.env` n'existe pas
// dans les scripts lancés avec Node (npm run donnees) : on retombe alors sur « pas de dossier ».
const BASE = ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/').replace(/\/$/, '');

// Toute adresse interne du site passe par ici : lien('/recherche') donne « /repolink/recherche » en production.
export const lien = (chemin: string) => `${BASE}${chemin}`;

export type OngletRepo = 'apercu' | 'issues' | 'contributeurs' | 'similaires';

// Le nom d'un repo ne contient que des lettres, chiffres et - _ . / : il s'écrit tel quel dans l'adresse.
// L'onglet « Aperçu » et la page 1 sont ceux par défaut : ils ne sont pas écrits.
export const hrefRepo = (nom: string, onglet: OngletRepo = 'apercu', page = 1) =>
	lien(`/repo?nom=${nom}${onglet === 'apercu' ? '' : `&onglet=${onglet}`}${page > 1 ? `&page=${page}` : ''}`);

export const hrefProfil = (pseudo: string) => lien(`/profil?pseudo=${pseudo}`);

// Page « Contacter un créateur » (étape 7.5)
export const hrefContacter = (pseudo: string) => lien(`/contacter?pseudo=${pseudo}`);
