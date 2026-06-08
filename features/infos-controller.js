import { renderInfoArticlesCollection } from '../components/InfoArticlesCollection.js';
import { infos } from '../data/infos.mjs';

export function initInfosController({
  target,
  infoReader,
  onRouteUpdate = null
}) {
  const infoItemsById = new Map(infos.map((item) => [item.id, item]));

  renderInfoArticlesCollection({
    items: infos,
    target,
    onArticleOpen: (item) => {
      infoReader.open(item);
      if (typeof onRouteUpdate === 'function') {
        onRouteUpdate({
          tab: 'infos',
          item: { type: 'info', id: item.id }
        });
      }
    }
  });

  return {
    getInfoItemsById: () => infoItemsById
  };
}
