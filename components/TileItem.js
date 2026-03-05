export function createTileItem(item, variant, onOpen) {
  const tile = document.createElement('article');
  const variantClass = variant === 'restaurant' ? 'restaurant-tile' : 'recipe-tile';

  tile.className = `tile ${variantClass} ${item.size}`;
  tile.innerHTML = `
    <p class="tile-kicker">${item.meta}</p>
    <p class="tile-title">${item.name}</p>
  `;

  if (typeof onOpen === 'function') {
    tile.addEventListener('click', () => onOpen(tile));
  }

  return tile;
}
