// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Le site est servi par GitHub Pages sous https://zaderlyl.github.io/repolink/ : tout se trouve sous « /repolink ».
  // Les liens internes passent par lien() (src/lib/adresses.ts).
  site: 'https://zaderlyl.github.io',
  base: '/repolink',
  vite: {
    plugins: [tailwindcss()]
  }
});