export function createInfoArticleItem(item) {
  const article = document.createElement('article');
  article.className = 'info-article';
  article.innerHTML = `
    <h3>${item.title}</h3>
    <p>${item.summary}</p>
  `;
  return article;
}
