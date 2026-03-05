export function createInfoArticleItem(item, onOpen) {
  const article = document.createElement('article');
  article.className = 'info-article';
  article.setAttribute('tabindex', '0');
  article.setAttribute('role', 'button');
  article.innerHTML = `
    <h3>${item.title}</h3>
    <p>${item.summary}</p>
  `;

  if (typeof onOpen === 'function') {
    article.addEventListener('click', () => onOpen(item));
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpen(item);
      }
    });
  }

  return article;
}
