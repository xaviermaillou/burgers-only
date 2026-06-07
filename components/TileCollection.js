import { createTileItem } from './TileItem.js';

export function updateTileImageLoading(container, isActive) {
  const images = container?.querySelectorAll('.tile-bg-image') || [];
  images.forEach((image, index) => {
    image.loading = isActive && index < 4 ? 'eager' : 'lazy';
    image.fetchPriority = isActive && index === 0 ? 'high' : 'auto';
  });
}

export function renderTileCollection({ items, target, variant, onTileOpen }) {
  if (!target) {
    return;
  }

  const isActive = target.closest('.view')?.classList.contains('active') === true;
  target.innerHTML = '';
  items.forEach((item, index) => {
    target.appendChild(createTileItem(item, variant, onTileOpen, {
      eager: isActive && index < 4,
      highPriority: isActive && index === 0
    }));
  });
}
