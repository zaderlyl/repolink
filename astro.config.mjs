// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages privées, personnelles ou techniques : elles ne vont ni dans le sitemap ni dans les moteurs de recherche (voir aussi public/robots.txt)
const PAGES_PRIVEES = [
  'connexion', 'connexion-reussie', 'favoris', 'mon-profil', 'parametres', 'pour-toi', 'profil',
  'repo', 'message-envoye', 'mise-en-relation', 'contacter', 'composants',
];

// https://astro.build/config
export default defineConfig({
  // Le site est servi par GitHub Pages sous https://zaderlyl.github.io/repolink/ : tout se trouve sous « /repolink ».
  // Les liens internes passent par lien() (src/lib/adresses.ts).
  site: 'https://zaderlyl.github.io',
  base: '/repolink',
  integrations: [
    sitemap({
      filter: (page) => !PAGES_PRIVEES.some((nom) => page.includes(`/repolink/${nom}/`)),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});