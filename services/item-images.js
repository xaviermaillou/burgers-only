const ITEM_IMAGE_WIDTHS = {
  recipes: {
    WnkjUpRC2VzmPS2LkduB: 1000,
    ilTqfzNFf8icY1sQdb0M: 1000,
    m8PWWR1l9OPNfjgd9UKm: 1000,
    oICZLHYJtChcCjGaLVpT: 1000,
    qEYp57U1XZsrDTFnGSIw: 1391,
    tKpj7tH2LruWOPmxV5u5: 1394,
    wDJg9svM4Fbw2rbhtNdl: 1393,
    y12DW2yv7sv6EBrzfz7N: 1000
  },
  restaurants: {
    '97woRzFhJvuGt0vhlAQZ': 1400,
    '9szdyocPkvwuTW2Npno2': 878,
    RTf3N5VgW5oOMYuK4Vyu: 1199,
    UPNza8akmzvUBKValal3: 1600,
    V7QOoc6xWs4mvpBojXNT: 1600,
    Vg4LKq2ZILKTmmrJY4GW: 1600,
    bslVSCA9LmayXun9wlgV: 1170,
    fOYhNeP8L4vnKlYRVXg9: 1600,
    rPAeMlh6my3GSJCBqKbK: 1600,
    wYHOuswx5kOzmkbNrwql: 1024
  }
};

export function resolveItemImage(collection, id) {
  const collectionName = String(collection || '').trim();
  const itemId = String(id || '').trim();
  if (!collectionName || !itemId) {
    return '';
  }

  return `/images/items/${collectionName}/${itemId}.webp`;
}

export function resolveItemImageWidth(collection, id) {
  return ITEM_IMAGE_WIDTHS[collection]?.[id] || 0;
}
