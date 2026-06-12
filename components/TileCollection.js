import { createTileItem } from './TileItem.js';

function activateImageSource(image) {
  const { src, srcset } = image.dataset;
  if (!src) {
    return;
  }

  const tile = image.closest('.tile');
  if (tile?.dataset.maskUrl) {
    tile.style.setProperty('--tile-mask-url', `url("${tile.dataset.maskUrl}")`);
  }
  if (srcset) {
    image.srcset = srcset;
  }
  image.src = src;
}

export function updateTileImageLoading(container, isActive) {
  const images = container?.querySelectorAll('.tile-bg-image') || [];
  images.forEach((image, index) => {
    image.loading = isActive && index < 4 ? 'eager' : 'lazy';
    image.fetchPriority = isActive && index === 0 ? 'high' : 'auto';
  });
}

export function activateTileImages(container) {
  const images = container?.querySelectorAll('.tile-bg-image') || [];
  images.forEach((image) => activateImageSource(image));
  updateTileImageLoading(container, true);
}

export function renderTileCollection({ items, target, variant, onTileOpen }) {
  if (!target) {
    return;
  }

  const isActive = target.closest('.view')?.classList.contains('active') === true;
  const deferImages = document.documentElement.hasAttribute('data-defer-tile-images');
  target.innerHTML = '';
  items.forEach((item, index) => {
    target.appendChild(createTileItem(item, variant, onTileOpen, {
      eager: isActive && index < 4,
      highPriority: isActive && index === 0,
      deferred: deferImages
    }));
  });
}
