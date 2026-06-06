export async function resolveItemImage(collection, id) {
  const collectionName = String(collection || '').trim();
  const itemId = String(id || '').trim();
  if (!collectionName || !itemId) {
    return '';
  }

  return `/images/items/${collectionName}/${itemId}.webp`;
}
