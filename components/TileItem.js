const MASK_COUNT = 20;
const TEST_FALLBACK_IMAGE = 'data/test-assets/mock-burger-mask-test.svg';
let imageLoadDelayMs = 0;

function normalizeMaskIndex(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) {
    return null;
  }

  if (numeric < 1 || numeric > MASK_COUNT) {
    return null;
  }

  return numeric;
}

function stableHash(value) {
  const input = String(value || '');
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function resolveMaskIndex(item, variant) {
  const explicitMaskIndex = normalizeMaskIndex(item.maskIndex);
  if (explicitMaskIndex !== null) {
    return explicitMaskIndex;
  }

  const seed = `${variant}:${item.routeId || item.id || item.name || ''}`;
  return (stableHash(seed) % MASK_COUNT) + 1;
}

function resolveImageUrl(item) {
  const image = String(item.image || '').trim();
  if (image) {
    return resolveAssetUrl(image);
  }

  return resolveAssetUrl(TEST_FALLBACK_IMAGE);
}

function resolveAssetUrl(path) {
  const value = String(path || '').trim();
  if (!value) {
    return '';
  }

  try {
    return new URL(value, window.location.href).href;
  } catch {
    return value;
  }
}

export function createTileItem(item, variant, onOpen) {
  const tile = document.createElement('article');
  const variantClass = variant === 'restaurant' ? 'restaurant-tile' : 'recipe-tile';
  const kickerMarkup = item.meta ? `<p class="tile-kicker">${item.meta}</p>` : '';
  const imageUrl = resolveImageUrl(item);
  const hasImageClass = imageUrl ? 'has-image' : '';
  const maskIndex = imageUrl ? resolveMaskIndex(item, variant) : null;
  const maskName = maskIndex ? `tile-mask-${String(maskIndex).padStart(2, '0')}.svg` : '';
  const imageMarkup = imageUrl
    ? `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${imageUrl}" alt="" class="tile-bg-image" />`
    : '';

  tile.className = `tile ${variantClass} ${item.size} ${hasImageClass}`;
  tile.innerHTML = `
    ${imageMarkup}
    ${kickerMarkup}
    <p class="tile-title">${item.name}</p>
  `;
  tile.dataset.expandedBody = item.expandedBody || '';
  tile.dataset.expandedList = JSON.stringify(item.expandedList || []);
  if (item.routeId) {
    tile.dataset.routeId = item.routeId;
  }
  if (imageUrl) {
    tile.dataset.image = imageUrl;
    const maskUrl = resolveAssetUrl(`data/masks/${maskName}`);
    tile.dataset.maskUrl = maskUrl;
    tile.style.setProperty('--tile-mask-url', `url("${maskUrl}")`);

    // Delay image assignment so many tiles do not request at the exact same time.
    imageLoadDelayMs += 120;
    window.setTimeout(() => {
      const images = tile.querySelectorAll('.tile-bg-image');
      images.forEach((img) => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
    }, imageLoadDelayMs);
  }

  if (typeof onOpen === 'function') {
    tile.addEventListener('click', () => onOpen(tile, item));
  }

  return tile;
}
