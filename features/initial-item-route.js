import { activateTileImages } from '../components/TileCollection.js';

const root = document.documentElement;

export const isInitialItemRoute = () => root.classList.contains('item-route-loading');

export function revealInitialItemRoute() {
  root.classList.remove('item-route-loading');
}

export function clearInitialItemRoute(container) {
  revealInitialItemRoute();
  if (!root.hasAttribute('data-defer-tile-images')) {
    return;
  }

  root.removeAttribute('data-defer-tile-images');
  activateTileImages(container);
}
