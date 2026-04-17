const SQUARE_MASK_COUNT = 20;
const WIDE_MASK_COUNT = 10;
const MASK_KIND_SQUARE = 'square';
const MASK_KIND_WIDE = 'wide';
const MASK_CONFIG = {
  [MASK_KIND_SQUARE]: {
    count: SQUARE_MASK_COUNT,
    prefix: 'tile-mask'
  },
  [MASK_KIND_WIDE]: {
    count: WIDE_MASK_COUNT,
    prefix: 'tile-mask-wide'
  }
};
const TEST_FALLBACK_IMAGE = 'data/test-assets/mock-burger-mask-test.svg';
let imageLoadDelayMs = 0;

function normalizeMaskKind(value) {
  return value === MASK_KIND_WIDE ? MASK_KIND_WIDE : MASK_KIND_SQUARE;
}

function normalizeMaskIndex(value, maxCount) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) {
    return null;
  }

  if (numeric < 1 || numeric > maxCount) {
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

function resolveMask(item, variant) {
  const maskKind = normalizeMaskKind(item.maskKind);
  const config = MASK_CONFIG[maskKind];
  const explicitMaskIndex = normalizeMaskIndex(item.maskIndex, config.count);
  const seed = `${maskKind}:${variant}:${item.routeId || item.id || item.name || ''}`;
  const maskIndex = explicitMaskIndex !== null ? explicitMaskIndex : (stableHash(seed) % config.count) + 1;

  return {
    kind: maskKind,
    index: maskIndex,
    filename: `${config.prefix}-${String(maskIndex).padStart(2, '0')}.svg`
  };
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
  const mask = imageUrl ? resolveMask(item, variant) : null;
  const maskName = mask ? mask.filename : '';
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
