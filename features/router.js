const ROUTE_TAB_TO_VIEW = {
  restaurants: 'restaurantsView',
  recipes: 'recipesView',
  infos: 'infosView'
};

const ROUTE_VIEW_TO_TAB = {
  restaurantsView: 'restaurants',
  recipesView: 'recipes',
  infosView: 'infos'
};

const ROUTE_ITEM_TYPE_TO_TAB = {
  restaurant: 'restaurants',
  recipe: 'recipes',
  info: 'infos'
};

const ROUTE_ITEM_TYPE_TO_PARAM = {
  restaurant: 'restaurant',
  recipe: 'recipe',
  info: 'info'
};

const ROUTE_KEYS = ['tab', 'restaurant', 'recipe', 'info'];

function normalizeRouteTab(tab) {
  return ROUTE_TAB_TO_VIEW[tab] ? tab : 'restaurants';
}

function normalizeRouteItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const type = typeof item.type === 'string' ? item.type : '';
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  if (!ROUTE_ITEM_TYPE_TO_PARAM[type] || !id) {
    return null;
  }

  return {
    type,
    id
  };
}

function normalizeRouteState(state) {
  const tab = normalizeRouteTab(state?.tab);
  const item = normalizeRouteItem(state?.item);
  if (!item) {
    return { tab, item: null };
  }

  const routeTabForItem = ROUTE_ITEM_TYPE_TO_TAB[item.type];
  if (!routeTabForItem) {
    return { tab, item: null };
  }

  if (routeTabForItem !== tab) {
    return { tab: routeTabForItem, item };
  }

  return { tab, item };
}

function isSameRouteState(left, right) {
  const leftItem = left?.item;
  const rightItem = right?.item;

  if (left?.tab !== right?.tab) {
    return false;
  }

  if (!leftItem && !rightItem) {
    return true;
  }

  if (!leftItem || !rightItem) {
    return false;
  }

  return leftItem.type === rightItem.type && leftItem.id === rightItem.id;
}

function parseRouteStateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const explicitTab = params.get('tab');
  let item = null;

  const restaurantId = params.get('restaurant');
  const recipeId = params.get('recipe');
  const infoId = params.get('info');

  if (restaurantId) {
    item = { type: 'restaurant', id: restaurantId };
  } else if (recipeId) {
    item = { type: 'recipe', id: recipeId };
  } else if (infoId) {
    item = { type: 'info', id: infoId };
  }

  const inferredTab = item ? ROUTE_ITEM_TYPE_TO_TAB[item.type] : 'restaurants';
  return normalizeRouteState({
    tab: explicitTab || inferredTab,
    item
  });
}

function buildRouteUrl(nextRouteState) {
  const normalized = normalizeRouteState(nextRouteState);
  const url = new URL(window.location.href);

  ROUTE_KEYS.forEach((key) => url.searchParams.delete(key));
  url.searchParams.set('tab', normalized.tab);

  if (normalized.item) {
    const paramName = ROUTE_ITEM_TYPE_TO_PARAM[normalized.item.type];
    if (paramName) {
      url.searchParams.set(paramName, normalized.item.id);
    }
  }

  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
}

function findTileByRouteId(target, routeId) {
  if (!target || !routeId) {
    return null;
  }

  const tiles = target.querySelectorAll('.tile[data-route-id]');
  for (const tile of tiles) {
    if (tile.dataset.routeId === routeId) {
      return tile;
    }
  }

  return null;
}

export function initRouter({
  switchView,
  tileExpander,
  infoReader,
  restaurantList,
  recipeList,
  getInfoItemsById
}) {
  if (
    typeof switchView !== 'function' ||
    !tileExpander ||
    !infoReader ||
    !restaurantList ||
    !recipeList
  ) {
    return {
      updateRouteFromUI: () => {},
      applyRouteFromLocation: () => {},
      handlePopState: () => {},
      markRestaurantsLoaded: () => {},
      markRecipesLoaded: () => {},
      handleTileClose: () => {},
      handleInfoClose: () => {}
    };
  }

  let routeState = {
    tab: 'restaurants',
    item: null
  };
  let pendingRouteItem = null;
  let restaurantsLoaded = false;
  let recipesLoaded = false;
  let suppressTileCloseRouteSync = false;
  let suppressInfoCloseRouteSync = false;

  function writeRouteToHistory(nextRouteState, { replace = false } = {}) {
    const nextUrl = buildRouteUrl(nextRouteState);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl === currentUrl) {
      return;
    }

    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](nextRouteState, '', nextUrl);
  }

  function setRouteState(nextRouteState, { replace = false } = {}) {
    const normalized = normalizeRouteState(nextRouteState);
    const changed = !isSameRouteState(routeState, normalized);

    routeState = normalized;
    pendingRouteItem = normalized.item ? { ...normalized.item } : null;

    if (changed || replace) {
      writeRouteToHistory(normalized, { replace });
    }

    return normalized;
  }

  function updateRouteFromUI(patch, { replace = false } = {}) {
    const hasItemPatch = Object.prototype.hasOwnProperty.call(patch, 'item');
    const nextRouteState = normalizeRouteState({
      tab: typeof patch.tab === 'string' ? patch.tab : routeState.tab,
      item: hasItemPatch ? patch.item : routeState.item
    });

    setRouteState(nextRouteState, { replace });
  }

  function tryOpenPendingRouteItem() {
    if (!pendingRouteItem) {
      return;
    }

    const { type, id } = pendingRouteItem;
    if (type === 'info') {
      const infoItemsById = typeof getInfoItemsById === 'function' ? getInfoItemsById() : null;
      if (!(infoItemsById instanceof Map)) {
        return;
      }

      const infoItem = infoItemsById.get(id);
      if (!infoItem) {
        updateRouteFromUI({ item: null }, { replace: true });
        return;
      }

      infoReader.open(infoItem);
      pendingRouteItem = null;
      return;
    }

    if (type === 'restaurant') {
      if (!restaurantsLoaded) {
        return;
      }

      const openRestaurantTile = () => {
        if (!pendingRouteItem || pendingRouteItem.type !== 'restaurant' || pendingRouteItem.id !== id) {
          return;
        }

        const tileElement = findTileByRouteId(restaurantList, id);
        if (!tileElement) {
          updateRouteFromUI({ item: null }, { replace: true });
          return;
        }

        tileExpander.open(tileElement);
        pendingRouteItem = null;
      };

      if (tileExpander.isOpen()) {
        if (tileExpander.getActiveRouteId() === id) {
          pendingRouteItem = null;
          return;
        }

        suppressTileCloseRouteSync = true;
        tileExpander.close();
        window.setTimeout(openRestaurantTile, 430);
        return;
      }

      const tileElement = findTileByRouteId(restaurantList, id);
      if (!tileElement) {
        updateRouteFromUI({ item: null }, { replace: true });
        return;
      }

      tileExpander.open(tileElement);
      pendingRouteItem = null;
      return;
    }

    if (type === 'recipe') {
      if (!recipesLoaded) {
        return;
      }

      const openRecipeTile = () => {
        if (!pendingRouteItem || pendingRouteItem.type !== 'recipe' || pendingRouteItem.id !== id) {
          return;
        }

        const tileElement = findTileByRouteId(recipeList, id);
        if (!tileElement) {
          updateRouteFromUI({ item: null }, { replace: true });
          return;
        }

        tileExpander.open(tileElement);
        pendingRouteItem = null;
      };

      if (tileExpander.isOpen()) {
        if (tileExpander.getActiveRouteId() === id) {
          pendingRouteItem = null;
          return;
        }

        suppressTileCloseRouteSync = true;
        tileExpander.close();
        window.setTimeout(openRecipeTile, 430);
        return;
      }

      const tileElement = findTileByRouteId(recipeList, id);
      if (!tileElement) {
        updateRouteFromUI({ item: null }, { replace: true });
        return;
      }

      tileExpander.open(tileElement);
      pendingRouteItem = null;
      return;
    }

    updateRouteFromUI({ item: null }, { replace: true });
  }

  function applyRouteState(nextRouteState, { replace = false } = {}) {
    const normalized = setRouteState(nextRouteState, { replace });
    switchView(ROUTE_TAB_TO_VIEW[normalized.tab]);

    const wantsInfoOpen = normalized.item?.type === 'info';
    const wantsTileOpen =
      normalized.item?.type === 'restaurant' || normalized.item?.type === 'recipe';

    if (!wantsInfoOpen && infoReader.isOpen()) {
      suppressInfoCloseRouteSync = true;
      infoReader.close();
    }

    if (!wantsTileOpen && tileExpander.isOpen()) {
      suppressTileCloseRouteSync = true;
      tileExpander.close();
    }

    tryOpenPendingRouteItem();
  }

  return {
    updateRouteFromUI,
    applyRouteFromLocation({ replace = false } = {}) {
      applyRouteState(parseRouteStateFromLocation(), { replace });
    },
    handlePopState() {
      applyRouteState(parseRouteStateFromLocation(), { replace: true });
    },
    markRestaurantsLoaded() {
      restaurantsLoaded = true;
      tryOpenPendingRouteItem();
    },
    markRecipesLoaded() {
      recipesLoaded = true;
      tryOpenPendingRouteItem();
    },
    handleTileClose() {
      if (suppressTileCloseRouteSync) {
        suppressTileCloseRouteSync = false;
        return;
      }

      updateRouteFromUI({ item: null });
    },
    handleInfoClose() {
      if (suppressInfoCloseRouteSync) {
        suppressInfoCloseRouteSync = false;
        return;
      }

      updateRouteFromUI({ item: null });
    }
  };
}

export { ROUTE_VIEW_TO_TAB };
