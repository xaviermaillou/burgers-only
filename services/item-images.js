const ITEM_IMAGE_BY_KEY = new Map([
  [
    'restaurants:97woRzFhJvuGt0vhlAQZ',
    '/images/items/restaurants/97woRzFhJvuGt0vhlAQZ.jpg'
  ],
  [
    'restaurants:9szdyocPkvwuTW2Npno2',
    '/images/items/restaurants/9szdyocPkvwuTW2Npno2.jpg'
  ],
  [
    'restaurants:RTf3N5VgW5oOMYuK4Vyu',
    '/images/items/restaurants/RTf3N5VgW5oOMYuK4Vyu.jpg'
  ],
  [
    'restaurants:UPNza8akmzvUBKValal3',
    '/images/items/restaurants/UPNza8akmzvUBKValal3.jpg'
  ],
  [
    'restaurants:V7QOoc6xWs4mvpBojXNT',
    '/images/items/restaurants/V7QOoc6xWs4mvpBojXNT.jpg'
  ],
  [
    'restaurants:Vg4LKq2ZILKTmmrJY4GW',
    '/images/items/restaurants/Vg4LKq2ZILKTmmrJY4GW.jpg'
  ],
  [
    'restaurants:bslVSCA9LmayXun9wlgV',
    '/images/items/restaurants/bslVSCA9LmayXun9wlgV.jpg'
  ],
  [
    'restaurants:fOYhNeP8L4vnKlYRVXg9',
    '/images/items/restaurants/fOYhNeP8L4vnKlYRVXg9.jpg'
  ],
  [
    'restaurants:rPAeMlh6my3GSJCBqKbK',
    '/images/items/restaurants/rPAeMlh6my3GSJCBqKbK.jpg'
  ],
  [
    'restaurants:wYHOuswx5kOzmkbNrwql',
    '/images/items/restaurants/wYHOuswx5kOzmkbNrwql.jpg'
  ],
  [
    'recipes:WnkjUpRC2VzmPS2LkduB',
    '/images/items/recipes/WnkjUpRC2VzmPS2LkduB.jpg'
  ],
  [
    'recipes:ilTqfzNFf8icY1sQdb0M',
    '/images/items/recipes/ilTqfzNFf8icY1sQdb0M.jpg'
  ],
  [
    'recipes:m8PWWR1l9OPNfjgd9UKm',
    '/images/items/recipes/m8PWWR1l9OPNfjgd9UKm.jpg'
  ],
  [
    'recipes:oICZLHYJtChcCjGaLVpT',
    '/images/items/recipes/oICZLHYJtChcCjGaLVpT.jpg'
  ],
  [
    'recipes:y12DW2yv7sv6EBrzfz7N',
    '/images/items/recipes/y12DW2yv7sv6EBrzfz7N.jpg'
  ]
]);

export async function resolveItemImage(collection, id) {
  const collectionName = String(collection || '').trim();
  const itemId = String(id || '').trim();
  if (!collectionName || !itemId) {
    return '';
  }

  return ITEM_IMAGE_BY_KEY.get(`${collectionName}:${itemId}`) || '';
}
