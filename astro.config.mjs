// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://minzhenzh.github.io',
  // Old standalone pages, now sections of the home page.
  redirects: {
    '/research': '/#research',
    '/projects': '/#research',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
