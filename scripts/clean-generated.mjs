import { rm } from 'node:fs/promises';

await Promise.all([
  rm('build', { recursive: true, force: true }),
  rm('dist', { recursive: true, force: true }),
  rm('restaurants', { recursive: true, force: true }),
  rm('recipes', { recursive: true, force: true }),
  rm('infos', { recursive: true, force: true }),
  rm('sitemap.xml', { force: true }),
  rm('robots.txt', { force: true })
]);
