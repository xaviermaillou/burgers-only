import { createTileItem } from './TileItem.js';

export function renderTileCollection({ items, target, variant, onTileOpen }) {
  if (!target) {
    return;
  }

  target.innerHTML = '';
  items.forEach((item) => {
    target.appendChild(createTileItem(item, variant, onTileOpen));
  });
}
