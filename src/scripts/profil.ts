// Page Profil créateur : lit l'adresse (?pseudo=…) puis laisse src/scripts/profil-commun.ts remplir la page.
// Les modèles HTML (<template>) viennent de src/components/profil-vue.astro.
import { lirePseudo } from '../lib/recherche.ts';
import { afficherIntrouvable, chargerProfil, lignesCreateur } from './profil-commun.ts';

const pseudo = lirePseudo(new URLSearchParams(location.search));
if (pseudo) void chargerProfil({ pseudo, lignes: lignesCreateur });
else afficherIntrouvable();
