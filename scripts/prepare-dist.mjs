import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('dist/assets', { recursive: true });

const sourceHtml = await readFile('index.html', 'utf8');
const productionHtml = sourceHtml.replace(
  /<script>\s*\(function loadAppScript\(\) \{[\s\S]*?\}\)\(\);\s*<\/script>/,
  '<script type="module" src="/assets/app.js"></script>'
);

await Promise.all([
  writeFile('dist/index.html', productionHtml),
  cp('styles.css', 'dist/styles.css'),
  cp('nav-top.css', 'dist/nav-top.css'),
  cp('data/luxembourg-areas.json', 'dist/data/luxembourg-areas.json'),
  cp('data/masks', 'dist/data/masks', { recursive: true }),
  cp('data/test-assets', 'dist/data/test-assets', { recursive: true }),
  cp('images', 'dist/images', { recursive: true })
]);
