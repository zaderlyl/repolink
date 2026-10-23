// Adresses des pages d'un repo et d'un profil (elles seront créées aux étapes 6 et 7).
// Dans lib/ pour servir aux pages Astro comme aux scripts du navigateur.
export const hrefRepo = (nom: string) => `/repo/${nom}`;
export const hrefProfil = (pseudo: string) => `/profil/${pseudo}`;
