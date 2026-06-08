import { initGeotag } from './components/Geotag.js';
import { initOptionsMenu } from './components/OptionsMenu.js';
import { initBottomTabs } from './components/BottomTabs.js';
import { initTileExpander } from './components/TileExpander.js';
import { initInfoArticleReader } from './components/InfoArticleReader.js';
import { updateTileImageLoading } from './components/TileCollection.js';
import { gb, initGrowthBook } from './growthbook.js';
import { initRouter, ROUTE_VIEW_TO_TAB } from './features/router.js';
import { initAuthController } from './features/auth-controller.js';
import { initRestaurantsController } from './features/restaurants-controller.js';
import { initRecipesController } from './features/recipes-controller.js';
import { initInfosController } from './features/infos-controller.js';

const views = [...document.querySelectorAll('.view')];
const viewIndexById = new Map(views.map((view, index) => [view.id, index]));
const navItems = [...document.querySelectorAll('.nav-item')];
const bottomNav = document.querySelector('.bottom-nav');
const bottomNavTrack = document.querySelector('.bottom-nav-track');
const viewsViewport = document.querySelector('.views-viewport');
const viewsTrack = document.querySelector('.views-track');
const topbar = document.querySelector('.topbar');

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

let bottomTabs = null;
let routerController = null;
let restaurantsController = null;
let recipesController = null;

const PAGE_TITLE_BASE = 'BurgersOnly';
const PAGE_TITLE_TAB_LABELS = {
  restaurants: 'Restaurants',
  recipes: 'Recettes',
  infos: 'Infos'
};

function updatePageTitle(routeState, itemTitle = '') {
  const tabLabel = PAGE_TITLE_TAB_LABELS[routeState?.tab] || PAGE_TITLE_TAB_LABELS.restaurants;
  const cleanItemTitle = String(itemTitle || '').trim();
  document.title = `${PAGE_TITLE_BASE} | ${cleanItemTitle || tabLabel}`;
}

function pushDataLayerEvent(eventName, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload
  });

  if (gb && typeof gb.logEvent === 'function') {
    const attrs = gb.getAttributes() || {};
    gb.logEvent(eventName, {
      ...payload,
      id: attrs.id,
      user_id: attrs.user_id,
      device_id: attrs.device_id
    });
  }
}

function initBottomNavigation() {
  if (!bottomNav || !bottomNavTrack) {
    return;
  }

  bottomTabs = initBottomTabs({
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
      routerController.updateRouteFromUI({
        tab: ROUTE_VIEW_TO_TAB[viewId] || 'restaurants',
        item: null
      });
    }
  });

  const activeViewId = document.querySelector('.view.active')?.id;
  if (activeViewId) {
    bottomTabs.setActive(activeViewId);
  }
}

function updateViewportHeight(activeView = document.querySelector('.view.active')) {
  if (!viewsViewport || !activeView) {
    return;
  }

  viewsViewport.style.height = `${Math.max(activeView.scrollHeight, activeView.offsetHeight)}px`;
}

function updateActiveViewHeight() {
  updateViewportHeight();
}

async function applyNavPositionFromGrowthBook() {
  if (gb.getFeatureValue('nav-position', 'bottom') !== 'top') {
    return;
  }

  const { initTopNavigation } = await import('./features/top-navigation.js');
  await initTopNavigation({
    bottomNav,
    topbar,
    geotagElement,
    onLayoutChange: updateActiveViewHeight
  });
}

function loadViewData(viewId) {
  if (viewId === 'restaurantsView') {
    void restaurantsController?.loadRestaurants();
  } else if (viewId === 'recipesView') {
    void recipesController?.loadRecipes();
  }
}

function switchView(viewId) {
  const activeIndex = viewIndexById.get(viewId) ?? 0;
  const activeView = views[activeIndex] || views[0] || null;
  const nextViewportHeight = activeView
    ? Math.max(activeView.scrollHeight, activeView.offsetHeight)
    : 0;

  views.forEach((view) => {
    const isTarget = view.id === viewId;
    view.classList.toggle('active', isTarget);
    view.setAttribute('aria-hidden', String(!isTarget));
    updateTileImageLoading(view, isTarget);
  });

  if (viewsTrack) {
    viewsTrack.style.setProperty('--view-index', String(activeIndex));
  }

  if (bottomTabs) {
    bottomTabs.setActive(viewId);
  }

  if (viewsViewport && nextViewportHeight) {
    viewsViewport.style.height = `${nextViewportHeight}px`;
  }

  loadViewData(viewId);
  window.scrollTo(0, 0);
}

const geotag = initGeotag({ element: geotagElement, threshold: 28 });
const optionsMenu = initOptionsMenu({
  menuElement: optionsMenuElement,
  toggleButton: menuButton,
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
  inset: 12,
  onClose: () => {
    if (routerController) {
      routerController.handleTileClose();
    }
  }
});

const infoReader = initInfoArticleReader({
  overlay: infoReaderOverlay,
  titleElement: infoReaderTitle,
  bodyElement: infoReaderBody,
  closeButton: infoReaderClose,
  onClose: () => {
    if (routerController) {
      routerController.handleInfoClose();
    }
  }
});

const infosController = initInfosController({
  target: infoList,
  infoReader,
  onRouteUpdate: (patch, options) => {
    if (routerController) {
      routerController.updateRouteFromUI(patch, options);
    }
  }
});

routerController = initRouter({
  switchView,
  tileExpander,
  infoReader,
  restaurantList,
  recipeList,
  getInfoItemsById: infosController.getInfoItemsById,
  onTitleUpdate: updatePageTitle
});

initBottomNavigation();

initAuthController({
  googleAuthButton,
  googleAuthButtonLabel,
  accountStatus,
  onTrackEvent: pushDataLayerEvent
});

restaurantsController = initRestaurantsController({
  target: restaurantList,
  tileExpander,
  onRouteUpdate: (patch, options) => {
    routerController.updateRouteFromUI(patch, options);
  },
  onTrackEvent: pushDataLayerEvent,
  onRendered: updateActiveViewHeight,
  onLoaded: () => {
    routerController.markRestaurantsLoaded();
  }
});

recipesController = initRecipesController({
  target: recipeList,
  tileExpander,
  onRouteUpdate: (patch, options) => {
    routerController.updateRouteFromUI(patch, options);
  },
  onTrackEvent: pushDataLayerEvent,
  onRendered: updateActiveViewHeight,
  onLoaded: () => {
    routerController.markRecipesLoaded();
  }
});

void initGrowthBook().then(applyNavPositionFromGrowthBook);
routerController.applyRouteFromLocation({ replace: true });

geotag.locate().then((position) => {
  restaurantsController.updateUserLocation(position);
});

geotag.update();

window.addEventListener('resize', () => {
  const activeView = document.querySelector('.view.active');
  if (activeView) {
    updateViewportHeight(activeView);
  }
});

window.addEventListener('popstate', () => {
  routerController.handlePopState();
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
