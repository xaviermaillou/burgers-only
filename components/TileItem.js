export function createTileItem(item, variant, onOpen) {
  const tile = document.createElement('article');
  const variantClass = variant === 'restaurant' ? 'restaurant-tile' : 'recipe-tile';
  const kickerMarkup = item.meta ? `<p class="tile-kicker">${item.meta}</p>` : '';

  tile.className = `tile ${variantClass} ${item.size}`;
  tile.innerHTML = `
    ${kickerMarkup}
    <p class="tile-title">${item.name}</p>
  `;
  tile.dataset.expandedBody = item.expandedBody || '';
  tile.dataset.expandedList = JSON.stringify(item.expandedList || []);

  if (typeof onOpen === 'function') {
    tile.addEventListener('click', () => onOpen(tile, item));
  }

  return tile;
}
