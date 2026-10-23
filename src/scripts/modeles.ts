// Remplissage des modèles HTML (<template>) des pages. Petit fichier à part, sans dépendance :
// il est utilisé jusque dans les scripts chargés sur toutes les pages (notifications).

export const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const echapper = (texte: string) =>
	texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// Remplit un modèle : chaque __cle__ est remplacé par la valeur (échappée) en une seule passe,
// donc un texte venu de GitHub qui contiendrait « __nom__ » ne peut pas être réinterprété.
export function depuisModele(id: string, valeurs: Record<string, string>): HTMLElement {
	const html = $<HTMLTemplateElement>(id).innerHTML.replace(/__(\w+?)__/g, (morceau, cle: string) =>
		cle in valeurs ? echapper(valeurs[cle]) : morceau,
	);
	const conteneur = document.createElement('template');
	conteneur.innerHTML = html;
	return conteneur.content.firstElementChild as HTMLElement;
}
