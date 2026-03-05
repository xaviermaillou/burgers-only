import { createInfoArticleItem } from './InfoArticleItem.js';

export function renderInfoArticlesCollection({ items, target, onArticleOpen }) {
  if (!target) {
    return;
  }

  target.innerHTML = '';
  items.forEach((item) => {
    target.appendChild(createInfoArticleItem(item, onArticleOpen));
  });
}
