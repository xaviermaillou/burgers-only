import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { infos } from '../data/infos.mjs';

const DEFAULT_SITE_URL = 'https://burgersonly.lu';
const FIRESTORE_API_ROOT = 'https://firestore.googleapis.com/v1';
const OUTPUT_DIR = 'dist';
const siteUrl = String(process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function truncate(value, length = 155) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, length - 1).trimEnd()}…`;
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in value) {
    return decodeFirestoreFields(value.mapValue.fields || {});
  }

  return null;
}

function decodeFirestoreFields(fields) {
  return Object.fromEntries(
    Object.entries(fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)])
  );
}

function documentId(documentName) {
  return String(documentName || '').split('/').pop() || '';
}

async function readFirebaseConfig() {
  const source = await readFile('services/firebase.config.js', 'utf8').catch(() => '');
  const readValue = (key) => source.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`))?.[1] || '';

  const projectId = process.env.FIREBASE_PROJECT_ID || readValue('projectId');
  const apiKey = process.env.FIREBASE_API_KEY || readValue('apiKey');
  if (!projectId || !apiKey) {
    throw new Error(
      'Configuration Firestore absente. Definissez FIREBASE_PROJECT_ID et FIREBASE_API_KEY.'
    );
  }

  return { projectId, apiKey };
}

async function fetchCollection(collectionName, firebaseConfig) {
  const documents = [];
  let pageToken = '';

  do {
    const endpoint = new URL(
      `${FIRESTORE_API_ROOT}/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}`
    );
    endpoint.searchParams.set('key', firebaseConfig.apiKey);
    endpoint.searchParams.set('pageSize', '300');
    if (pageToken) {
      endpoint.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Firestore ${collectionName}: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    documents.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return documents.map((document) => ({
    id: documentId(document.name),
    ...decodeFirestoreFields(document.fields)
  }));
}

function buildMetadata({ type, id, title, description, image, structuredData }) {
  const route = `/${type}/${encodeURIComponent(id)}/`;
  const canonicalUrl = `${siteUrl}${route}`;
  const absoluteImage = image ? new URL(image, `${siteUrl}/`).href : '';
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const tags = [
    '<base href="/" />',
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    '<meta property="og:type" content="article" />',
    `<meta property="og:site_name" content="BurgersOnly" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`
  ];

  if (absoluteImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(absoluteImage)}" />`);
  }

  if (structuredData) {
    tags.push(
      `<script type="application/ld+json">${escapeJson({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': organizationId,
            name: 'BurgersOnly',
            url: `${siteUrl}/`
          },
          {
            '@type': 'WebSite',
            '@id': websiteId,
            name: 'BurgersOnly',
            url: `${siteUrl}/`,
            publisher: {
              '@id': organizationId
            }
          },
          {
            ...structuredData,
            '@id': canonicalUrl,
            url: canonicalUrl,
            publisher: {
              '@id': organizationId
            },
            isPartOf: {
              '@id': websiteId
            }
          }
        ]
      })}</script>`
    );
  }

  return { route, tags: tags.join('\n  ') };
}

function renderPage(template, page) {
  const pageTitle = `${page.title} | BurgersOnly`;
  const metadata = buildMetadata({
    ...page,
    title: pageTitle
  });
  const noscriptContent = page.contentHtml
    ? `<noscript><main><article><h1>${escapeHtml(page.title)}</h1>${page.contentHtml}</article></main></noscript>`
    : '';

  return template
    .replace(/\s*<script id="homepage-structured-data"[\s\S]*?<\/script>/, '')
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeHtml(page.description)}" />`
    )
    .replace('<title>BurgersOnly</title>', `${metadata.tags}\n  <title>${escapeHtml(pageTitle)}</title>`)
    .replace('<body>', `<body>\n  ${noscriptContent}`);
}

async function writePage(route, html) {
  const outputPath = join(OUTPUT_DIR, route.replace(/^\/+|\/+$/g, ''), 'index.html');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

function recipeDescription(recipe, ingredientNames) {
  if (recipe.overview) {
    return truncate(recipe.overview);
  }

  if (ingredientNames.length) {
    return truncate(`Recette de ${recipe.name} avec ${ingredientNames.join(', ')}.`);
  }

  return truncate(`Decouvrez la recette ${recipe.name} sur BurgersOnly.`);
}

const firebaseConfig = await readFirebaseConfig();
const [restaurants, recipes, ingredients] = await Promise.all([
  fetchCollection('restaurants', firebaseConfig),
  fetchCollection('recipes', firebaseConfig),
  fetchCollection('ingredients', firebaseConfig)
]);
const ingredientNamesByReference = new Map(
  ingredients.map((ingredient) => [
    `projects/${firebaseConfig.projectId}/databases/(default)/documents/ingredients/${ingredient.id}`,
    ingredient.name || ''
  ])
);
const template = await readFile(join(OUTPUT_DIR, 'index.html'), 'utf8');
const pages = [];

for (const restaurant of restaurants) {
  const description = truncate(
    restaurant.area
      ? `${restaurant.name}, restaurant situe a ${restaurant.area}, Luxembourg.`
      : `Decouvrez ${restaurant.name} sur BurgersOnly.`
  );
  const image = `/images/items/restaurants/${restaurant.id}.webp`;
  pages.push({
    type: 'restaurants',
    id: restaurant.id,
    title: restaurant.name || 'Restaurant',
    description,
    image,
    contentHtml: `<p>${escapeHtml(description)}</p>`,
    structuredData: {
      '@type': 'Restaurant',
      name: restaurant.name || 'Restaurant',
      image: `${siteUrl}${image}`,
      address: restaurant.area
        ? {
            '@type': 'PostalAddress',
            addressLocality: restaurant.area,
            addressCountry: 'LU'
          }
        : undefined,
      geo: restaurant.geo
        ? {
            '@type': 'GeoCoordinates',
            latitude: restaurant.geo.latitude,
            longitude: restaurant.geo.longitude
          }
        : undefined
    }
  });
}

for (const recipe of recipes) {
  const ingredientNames = (recipe.ingredients || [])
    .map((reference) => ingredientNamesByReference.get(reference))
    .filter(Boolean);
  const description = recipeDescription(recipe, ingredientNames);
  const image = `/images/items/recipes/${recipe.id}.webp`;
  pages.push({
    type: 'recipes',
    id: recipe.id,
    title: recipe.name || 'Recette',
    description,
    image,
    contentHtml: [
      `<p>${escapeHtml(recipe.overview || description)}</p>`,
      ingredientNames.length
        ? `<h2>Ingredients</h2><ul>${ingredientNames
            .map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`)
            .join('')}</ul>`
        : '',
      Array.isArray(recipe.steps) && recipe.steps.length
        ? `<h2>Preparation</h2><ol>${recipe.steps
            .map((step) => `<li>${escapeHtml(step)}</li>`)
            .join('')}</ol>`
        : ''
    ].join(''),
    structuredData: {
      '@type': 'Recipe',
      name: recipe.name || 'Recette',
      description,
      image: `${siteUrl}${image}`,
      recipeIngredient: ingredientNames,
      recipeInstructions: (recipe.steps || []).map((text) => ({
        '@type': 'HowToStep',
        text
      }))
    }
  });
}

for (const info of infos) {
  pages.push({
    type: 'infos',
    id: info.id,
    title: info.title,
    description: truncate(info.summary),
    contentHtml: info.content.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(''),
    structuredData: {
      '@type': 'Article',
      headline: info.title,
      description: info.summary,
      articleBody: info.content.join('\n\n')
    }
  });
}

await Promise.all(
  pages.map(async (page) => {
    const html = renderPage(template, page);
    await writePage(`/${page.type}/${encodeURIComponent(page.id)}/`, html);
  })
);

const sitemapUrls = [
  `${siteUrl}/`,
  ...pages.map((page) => `${siteUrl}/${page.type}/${encodeURIComponent(page.id)}/`)
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}
</urlset>
`;
await writeFile(join(OUTPUT_DIR, 'sitemap.xml'), sitemap);
await writeFile(
  join(OUTPUT_DIR, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
);

console.log(
  `SSG: ${restaurants.length} restaurants, ${recipes.length} recettes, ${infos.length} articles.`
);
