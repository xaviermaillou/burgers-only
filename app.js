import { renderTileCollection } from './components/TileCollection.js';
import { renderInfoArticlesCollection } from './components/InfoArticlesCollection.js';
import { initGeotag } from './components/Geotag.js';
import { initBurgerIcon } from './components/BurgerIcon.js';
import { initOptionsMenu } from './components/OptionsMenu.js';
import { initBottomTabs } from './components/BottomTabs.js';
import { initTileExpander } from './components/TileExpander.js';
import { initInfoArticleReader } from './components/InfoArticleReader.js';
import { fetchRestaurants } from './services/restaurants.js';
import { fetchRecipes } from './services/recipes.js';
import { observeAuthState, readRedirectResult, signInWithGoogle, signOutUser } from './services/auth.js';

const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];
const bottomNav = document.querySelector('.bottom-nav');
const bottomNavTrack = document.querySelector('.bottom-nav-track');
const viewsViewport = document.querySelector('.views-viewport');
const viewsTrack = document.querySelector('.views-track');

const restaurantList = document.getElementById('restaurantList');
const recipeList = document.getElementById('recipeList');
const infoList = document.getElementById('infoList');
const geotagElement = document.querySelector('.location-wrap');

const menuButton = document.querySelector('.menu-btn');
const optionsMenuElement = document.getElementById('optionsMenu');
const googleAuthButton = document.getElementById('googleAuthBtn');
const googleAuthButtonLabel = document.getElementById('googleAuthBtnLabel');
const accountStatus = document.getElementById('accountStatus');

const tileOverlay = document.getElementById('tileOverlay');
const tileExpanderElement = document.getElementById('tileExpander');
const tileCloseButton = document.getElementById('tileCloseBtn');
const infoReaderOverlay = document.getElementById('infoReaderOverlay');
const infoReaderClose = document.getElementById('infoReaderClose');
const infoReaderTitle = document.getElementById('infoReaderTitle');
const infoReaderBody = document.getElementById('infoReaderBody');

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
const DEFAULT_ACCOUNT_STATUS = 'Connectez-vous pour retrouver vos preferences et vos favoris.';
const RESTAURANT_SIZE_BY_DISPLAY_INDEX = {
  0: 'l',
  1: 's',
  2: 's',
  3: 'm',
  4: 'm',
  5: 's',
  6: 'm',
  7: 's',
  8: 'm',
  9: 's'
};

let routeState = {
  tab: 'restaurants',
  item: null
};
let pendingRouteItem = null;
let restaurantsLoaded = false;
let recipesLoaded = false;
let suppressTileCloseRouteSync = false;
let suppressInfoCloseRouteSync = false;
let authUser = null;
let authRequestInFlight = false;
let userLocationCoords = null;
let restaurantsRawCache = [];
let restaurantsCache = [];

function pushDataLayerEvent(eventName, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload
  });
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function resolveGeoCoordinates(geo) {
  if (!geo || typeof geo !== 'object') {
    return null;
  }

  const latitude = [geo.latitude, geo.lat, geo._latitude]
    .map(toFiniteNumber)
    .find((value) => value !== null);
  const longitude = [geo.longitude, geo.lng, geo.lon, geo.long, geo._longitude]
    .map(toFiniteNumber)
    .find((value) => value !== null);

  if (latitude === null || longitude === null) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

function computeDistanceKm(fromCoords, toCoords) {
  const EARTH_RADIUS_KM = 6371;
  const latitudeDelta = toRadians(toCoords.latitude - fromCoords.latitude);
  const longitudeDelta = toRadians(toCoords.longitude - fromCoords.longitude);
  const fromLatitude = toRadians(fromCoords.latitude);
  const toLatitude = toRadians(toCoords.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function sortRestaurantsByProximity(restaurants) {
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return [];
  }

  if (!userLocationCoords) {
    return [...restaurants];
  }

  const rankedRestaurants = restaurants.map((restaurant, index) => {
    const restaurantCoords = resolveGeoCoordinates(restaurant.geo);
    const distanceKm = restaurantCoords
      ? computeDistanceKm(userLocationCoords, restaurantCoords)
      : null;

    return {
      restaurant,
      index,
      distanceKm
    };
  });

  rankedRestaurants.sort((left, right) => {
    const leftHasDistance = Number.isFinite(left.distanceKm);
    const rightHasDistance = Number.isFinite(right.distanceKm);

    if (leftHasDistance && rightHasDistance) {
      if (left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }

      return left.index - right.index;
    }

    if (leftHasDistance !== rightHasDistance) {
      return leftHasDistance ? -1 : 1;
    }

    return left.index - right.index;
  });

  return rankedRestaurants.map((entry) => entry.restaurant);
}

function getRestaurantSizeByDisplayIndex(index) {
  return RESTAURANT_SIZE_BY_DISPLAY_INDEX[index] || 's';
}

function updateUserLocationCoords(position) {
  if (!position?.coords) {
    return;
  }

  const latitude = toFiniteNumber(position.coords.latitude);
  const longitude = toFiniteNumber(position.coords.longitude);
  if (latitude === null || longitude === null) {
    return;
  }

  userLocationCoords = { latitude, longitude };

  if (restaurantsRawCache.length > 0) {
    restaurantsCache = sortRestaurantsByProximity(restaurantsRawCache);
    renderRestaurants(restaurantsCache);
  }
}

function getAuthErrorMessage(error) {
  const code = error?.code || '';

  if (code === 'auth/popup-closed-by-user') {
    return 'Connexion annulee.';
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'Une connexion Google est deja en cours.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Ce domaine nest pas autorise dans Firebase Authentication.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'La methode Google nest pas activee dans Firebase Authentication.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Probleme reseau pendant la connexion.';
  }

  return 'Impossible de finaliser la connexion Google pour le moment.';
}

function setAccountStatus(message = '', { isError = false } = {}) {
  if (!accountStatus) {
    return;
  }

  accountStatus.textContent = message;
  accountStatus.classList.toggle('error', isError);
}

function getAuthButtonLabel() {
  if (authRequestInFlight) {
    return authUser ? 'Déconnexion...' : 'Connexion...';
  }

  return authUser ? 'Se déconnecter' : 'Continuer avec Google';
}

function syncAuthButton() {
  if (!googleAuthButton) {
    return;
  }

  const label = getAuthButtonLabel();
  if (googleAuthButtonLabel) {
    googleAuthButtonLabel.textContent = label;
  }

  googleAuthButton.setAttribute('aria-label', label);
  googleAuthButton.disabled = authRequestInFlight;
}

function getAccountDisplayName(user) {
  const displayName = String(user?.displayName || '').trim();
  if (displayName) {
    return displayName;
  }

  const email = String(user?.email || '').trim();
  if (email) {
    return email;
  }

  return 'cet utilisateur';
}

function renderAuthState(nextUser) {
  authUser = nextUser || null;

  if (!accountStatus) {
    return;
  }

  if (!authUser) {
    setAccountStatus(DEFAULT_ACCOUNT_STATUS);
    return;
  }

  const accountName = getAccountDisplayName(authUser);
  setAccountStatus(`Connecté en tant que ${accountName}.`);
}

function syncAuthDataLayer(previousUser, nextUser) {
  const previousUid = previousUser?.uid || null;
  const nextUid = nextUser?.uid || null;

  if (previousUid === nextUid) {
    return;
  }

  if (nextUid) {
    pushDataLayerEvent('login', {
      auth_provider: 'google',
      user_id: nextUid
    });
    return;
  }

  if (previousUid) {
    pushDataLayerEvent('logout', {
      auth_provider: 'google',
      user_id: previousUid
    });
  }
}

function reportAuthError(error, { redirect = false } = {}) {
  const code = error?.code || 'unknown';
  const message = getAuthErrorMessage(error);

  console.error('Google authentication failed.', error);
  setAccountStatus(message, { isError: true });
  pushDataLayerEvent('auth_error', {
    auth_provider: 'google',
    auth_error_code: code,
    auth_mode: redirect ? 'redirect' : 'popup'
  });
}

function initGoogleAuth() {
  if (!googleAuthButton) {
    return;
  }

  googleAuthButton.addEventListener('click', async () => {
    if (authRequestInFlight) {
      return;
    }

    authRequestInFlight = true;
    setAccountStatus(authUser ? 'Déconnexion en cours...' : 'Connexion en cours...');
    syncAuthButton();

    try {
      if (authUser) {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      authRequestInFlight = false;
      syncAuthButton();
      reportAuthError(error);
    }
  });

  observeAuthState((nextUser) => {
    const previousUser = authUser;

    renderAuthState(nextUser);
    authRequestInFlight = false;
    syncAuthButton();
    syncAuthDataLayer(previousUser, nextUser);
  });

  readRedirectResult().catch((error) => {
    reportAuthError(error, { redirect: true });
  });

  syncAuthButton();
}

function toRouteId(...values) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

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

function tryOpenPendingRouteItem() {
  if (!pendingRouteItem) {
    return;
  }

  const { type, id } = pendingRouteItem;
  if (type === 'info') {
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

const infos = [
  {
    id: 'info-bun',
    title: 'Comment choisir un bun',
    summary: 'Un bun moelleux qui reste stable avec la sauce aide a garder un burger propre a manger.',
    content: [
      'Choisis un bun legerement brioché avec une mie serrée: il absorbe un peu de jus sans se desintegrer.',
      'Toaste la face interieure 30 a 60 secondes pour creer une barriere contre l humidite des sauces.',
      'Si ton burger est tres garni, prefere un bun de diametre un peu plus large pour garder un montage stable.'
    ]
  },
  {
    id: 'info-cuisson-steak',
    title: 'Cuisson du steak',
    summary: 'Une plaque tres chaude et un temps court donnent une bonne croute et un coeur juteux.',
    content: [
      'Utilise une plaque ou poele en fonte prechauffee a feu fort pour obtenir une vraie reaction de Maillard.',
      'Forme des boules de viande de 90 a 120 g puis ecrase-les a la premiere seconde de cuisson.',
      'Sale juste apres la formation de la galette et retourne quand la croute est bien brune, sans multiplier les retournements.'
    ]
  },
  {
    id: 'info-ordre-montage',
    title: 'Ordre de montage',
    summary: 'Base sauce, salade, steak et toppings: cet ordre limite l humidite sur le pain du bas.',
    content: [
      'Pose une couche fine de sauce sur le pain du bas, puis un element sec comme salade ou pickles egouttes.',
      'Ajoute ensuite le steak et le fromage pour fixer la structure chaude au centre du burger.',
      'Termine avec les toppings humides plus haut dans le montage pour eviter de detremper la base.'
    ]
  },
  {
    id: 'info-sauces-equilibre',
    title: 'Sauces et equilibre',
    summary: 'Reste sur une sauce principale puis un accent acidule pour eviter un burger trop lourd.',
    content: [
      'Garde une sauce principale (mayo, burger sauce, moutarde douce) et ajoute un seul contrepoint acide.',
      'Un trait de pickles, oignons vinaigres ou citron suffit souvent a redonner de la fraicheur.',
      'Dose progressivement: trop de sauce masque la viande et rend la prise en main moins propre.'
    ]
  }
];
const infoItemsById = new Map(infos.map((item) => [item.id, item]));

const geotag = initGeotag({ element: geotagElement, threshold: 28 });
const burgerIcon = initBurgerIcon(menuButton);
const optionsMenu = initOptionsMenu({
  menuElement: optionsMenuElement,
  burgerIcon,
  onOpen: () => {
    pushDataLayerEvent('open_menu', {
      menu_name: 'options'
    });
  }
});
const tileExpander = initTileExpander({
  overlay: tileOverlay,
  expander: tileExpanderElement,
  closeButton: tileCloseButton,
  inset: 0,
  onClose: () => {
    if (suppressTileCloseRouteSync) {
      suppressTileCloseRouteSync = false;
      return;
    }

    updateRouteFromUI({ item: null });
  }
});
const infoReader = initInfoArticleReader({
  overlay: infoReaderOverlay,
  titleElement: infoReaderTitle,
  bodyElement: infoReaderBody,
  closeButton: infoReaderClose,
  onClose: () => {
    if (suppressInfoCloseRouteSync) {
      suppressInfoCloseRouteSync = false;
      return;
    }

    updateRouteFromUI({ item: null });
  }
});

const bottomTabs = initBottomTabs({
  bottomNav,
  bottomNavTrack,
  items: navItems,
  onSelect: (viewId) => {
    const activeView = document.querySelector('.view.active');
    if (activeView?.id === viewId) {
      return;
    }

    const tabLabel = navItems.find((item) => item.dataset.viewTarget === viewId)?.textContent?.trim() || viewId;
    pushDataLayerEvent('navigate_tab', {
      tab_id: viewId,
      tab_label: tabLabel
    });
    switchView(viewId);
    updateRouteFromUI({
      tab: ROUTE_VIEW_TO_TAB[viewId] || 'restaurants',
      item: null
    });
  }
});

function updateViewportHeight(activeView) {
  if (!viewsViewport || !activeView) {
    return;
  }

  const nextHeight = Math.max(activeView.scrollHeight, activeView.offsetHeight);
  viewsViewport.style.height = `${nextHeight}px`;
}

function updateActiveViewHeight() {
  const activeView = document.querySelector('.view.active');
  if (!activeView) {
    return;
  }

  updateViewportHeight(activeView);
}

function switchView(viewId) {
  let activeIndex = 0;
  let activeView = views[0] || null;

  views.forEach((view, index) => {
    const isTarget = view.id === viewId;
    view.classList.toggle('active', isTarget);
    view.setAttribute('aria-hidden', String(!isTarget));

    if (isTarget) {
      activeIndex = index;
      activeView = view;
    }
  });

  if (viewsTrack) {
    viewsTrack.style.setProperty('--view-index', String(activeIndex));
  }

  bottomTabs.setActive(viewId);
  updateViewportHeight(activeView);
  window.scrollTo(0, 0);
}

function mapTileSizeToClass(size) {
  if (size === 'l') {
    return 'tile-2x2';
  }

  if (size === 'm') {
    return 'tile-2x1';
  }

  return 'tile-1x1';
}

function renderRestaurants(restaurants) {
  const restaurantTiles = restaurants.map((restaurant, index) => ({
    routeId: toRouteId(restaurant.id, `restaurant-${index}`),
    name: restaurant.name,
    meta: restaurant.area,
    image: restaurant.image || '',
    maskIndex: (index % 20) + 1,
    size: mapTileSizeToClass(getRestaurantSizeByDisplayIndex(index))
  }));

  renderTileCollection({
    items: restaurantTiles,
    target: restaurantList,
    variant: 'restaurant',
    onTileOpen: (tileElement, item) => {
      pushDataLayerEvent('view_item', {
        item_name: item.name,
        item_category: 'restaurant'
      });
      tileExpander.open(tileElement);
      updateRouteFromUI({
        tab: 'restaurants',
        item: { type: 'restaurant', id: item.routeId }
      });
    }
  });

  updateActiveViewHeight();
}

async function loadRestaurants() {
  try {
    restaurantsRawCache = await fetchRestaurants();
    restaurantsCache = sortRestaurantsByProximity(restaurantsRawCache);
    renderRestaurants(restaurantsCache);
  } catch (error) {
    console.error('Failed to load restaurants from Firestore.', error);
    restaurantsRawCache = [];
    restaurantsCache = [];
    renderRestaurants([]);
  } finally {
    restaurantsLoaded = true;
    tryOpenPendingRouteItem();
  }
}

function renderRecipes(recipes) {
  const recipeTiles = recipes.map((recipe, index) => ({
    routeId: toRouteId(recipe.id, `recipe-${index}`),
    name: recipe.name,
    meta: '',
    size: mapTileSizeToClass(recipe.size),
    expandedBody: recipe.overview,
    expandedList: recipe.ingredients.map((ingredient) => ingredient.name).filter(Boolean),
    image: recipe.image || '',
    maskIndex: (index % 20) + 1
  }));

  renderTileCollection({
    items: recipeTiles,
    target: recipeList,
    variant: 'recipe',
    onTileOpen: (tileElement, item) => {
      pushDataLayerEvent('view_item', {
        item_name: item.name,
        item_category: 'recipe'
      });
      tileExpander.open(tileElement);
      updateRouteFromUI({
        tab: 'recipes',
        item: { type: 'recipe', id: item.routeId }
      });
    }
  });

  updateActiveViewHeight();
}

async function loadRecipes() {
  try {
    const recipes = await fetchRecipes();
    renderRecipes(recipes);
  } catch (error) {
    console.error('Failed to load recipes from Firestore.', error);
    renderRecipes([]);
  } finally {
    recipesLoaded = true;
    tryOpenPendingRouteItem();
  }
}

renderInfoArticlesCollection({
  items: infos,
  target: infoList,
  onArticleOpen: (item) => {
    infoReader.open(item);
    updateRouteFromUI({
      tab: 'infos',
      item: { type: 'info', id: item.id }
    });
  }
});

initGoogleAuth();
applyRouteState(parseRouteStateFromLocation(), { replace: true });
geotag.locate().then((position) => {
  updateUserLocationCoords(position);
});
loadRestaurants();
loadRecipes();
geotag.update();

window.addEventListener('resize', () => {
  const activeView = document.querySelector('.view.active');
  if (activeView) {
    updateViewportHeight(activeView);
  }
});

window.addEventListener('popstate', () => {
  applyRouteState(parseRouteStateFromLocation(), { replace: true });
});

document.addEventListener('keydown', (event) => {
  if (tileExpander.handleEscape(event)) {
    return;
  }

  if (infoReader.handleEscape(event)) {
    return;
  }

  optionsMenu.handleEscape(event);
});
