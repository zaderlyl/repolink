// Notifications (maquette Figma : « Toast »). Utilisation : afficherToast('Repo ajouté aux favoris').
// La zone et les modèles HTML sont dans src/layouts/layout.astro, donc disponibles sur toutes les pages.
import { depuisModele } from './modeles.ts';

export type VarianteToast = 'succes' | 'erreur';

const DUREE_MS = { succes: 4000, erreur: 6000 }; // une erreur reste plus longtemps
const TRANSITION_MS = 200;
const MAX_TOASTS = 3;

// Affiche un toast qui disparaît seul. Il se met en pause quand on le survole, et un clic dessus le ferme.
// Sans mouvement (prefers-reduced-motion), il apparaît et disparaît sans animation.
export function afficherToast(message: string, variante: VarianteToast = 'succes') {
	const zone = document.getElementById('zone-toasts');
	if (!zone) return;

	// Trop de toasts d'un coup : on retire le plus ancien
	while (zone.children.length >= MAX_TOASTS) zone.firstElementChild?.remove();

	const toast = depuisModele(`modele-toast-${variante}`, { message });
	const enveloppe = document.createElement('div');
	enveloppe.className =
		'pointer-events-auto cursor-pointer opacity-0 translate-x-4 transition-all duration-200 motion-reduce:translate-x-0 motion-reduce:transition-none';
	enveloppe.append(toast);
	zone.append(enveloppe);
	// On force le navigateur à calculer la mise en page avant de retirer les classes : la transition d'apparition se joue
	// (requestAnimationFrame ne convient pas : il est suspendu quand l'onglet n'est pas affiché)
	enveloppe.getBoundingClientRect();
	enveloppe.classList.remove('opacity-0', 'translate-x-4');

	let minuterie: ReturnType<typeof setTimeout>;
	const fermer = () => {
		clearTimeout(minuterie);
		enveloppe.classList.add('opacity-0', 'translate-x-4');
		setTimeout(() => enveloppe.remove(), TRANSITION_MS);
	};
	const armer = () => {
		clearTimeout(minuterie);
		minuterie = setTimeout(fermer, DUREE_MS[variante]);
	};

	enveloppe.addEventListener('click', fermer);
	enveloppe.addEventListener('mouseenter', () => clearTimeout(minuterie));
	enveloppe.addEventListener('mouseleave', armer);
	armer();
}
