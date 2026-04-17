import { initGeotag } from './components/Geotag.js';
import { initBurgerIcon } from './components/BurgerIcon.js';
import { initOptionsMenu } from './components/OptionsMenu.js';
import { initBottomTabs } from './components/BottomTabs.js';
import { initTileExpander } from './components/TileExpander.js';
import { initInfoArticleReader } from './components/InfoArticleReader.js';
import { gb, initGrowthBook } from './growthbook.js';
import { initRouter, ROUTE_VIEW_TO_TAB } from './features/router.js';
import { initAuthController } from './features/auth-controller.js';
import { initRestaurantsController } from './features/restaurants-controller.js';
import { initRecipesController } from './features/recipes-controller.js';
import { initInfosController } from './features/infos-controller.js';

const views = [...document.querySelectorAll('.view')];
let navItems = [...document.querySelectorAll('.nav-item')];
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
let navPositionVariant = 'bottom';
let navTabsOrderVariant = 'restaurants-recipes-infos';

function pushDataLayerEvent(eventName, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload
  });
}

function normalizeNavTabsOrder(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  if (
    normalizedValue === 'recipes-restaurants-infos' ||
    normalizedValue === 'recipes-first' ||
    normalizedValue === 'recipes_first'
  ) {
    return 'recipes-restaurants-infos';
  }

  return 'restaurants-recipes-infos';
}

function getNavTabsOrderTargets(orderVariant) {
  if (orderVariant === 'recipes-restaurants-infos') {
    return ['recipesView', 'restaurantsView', 'infosView'];
  }

  return ['restaurantsView', 'recipesView', 'infosView'];
}

function initOrRefreshBottomTabs() {
  if (!bottomNav || !bottomNavTrack) {
    return;
  }

  if (bottomTabs) {
    bottomTabs.destroy();
    bottomTabs = null;
  }

  navItems = [...bottomNavTrack.querySelectorAll('.nav-item')];
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

function applyNavTabsOrder(orderValue) {
  if (!bottomNavTrack) {
    return;
  }

  const nextOrderVariant = normalizeNavTabsOrder(orderValue);
  if (nextOrderVariant === navTabsOrderVariant && bottomTabs) {
    return;
  }

  navTabsOrderVariant = nextOrderVariant;

  const itemsByTarget = new Map(navItems.map((item) => [item.dataset.viewTarget, item]));
  const orderedTargets = getNavTabsOrderTargets(navTabsOrderVariant);

  orderedTargets.forEach((viewTarget) => {
    const item = itemsByTarget.get(viewTarget);
    if (item) {
      bottomNavTrack.appendChild(item);
    }
  });

  initOrRefreshBottomTabs();
  updateTopNavLayoutMetrics();
}

function applyNavTabsOrderFromGrowthBook() {
  const navTabsOrderFeature = gb.getFeatureValue('nav-tabs-order', 'restaurants-recipes-infos');
  applyNavTabsOrder(navTabsOrderFeature);
}

function normalizeNavPosition(value) {
  return value === 'top' ? 'top' : 'bottom';
}

function updateTopNavLayoutMetrics() {
  if (navPositionVariant !== 'top' || !bottomNav) {
    return;
  }

  const topbarBottom = topbar?.getBoundingClientRect()?.bottom || 0;
  const navHeight = bottomNav.getBoundingClientRect().height || 0;
  const navTopOffset = Math.max(0, Math.ceil(topbarBottom + 8));
  const measuredNavHeight = Math.max(0, Math.ceil(navHeight));

  document.documentElement.style.setProperty('--nav-top-offset', `${navTopOffset}px`);
  document.documentElement.style.setProperty('--nav-height', `${measuredNavHeight}px`);
}

function applyNavPosition(position) {
  navPositionVariant = normalizeNavPosition(position);
  const isTopNav = navPositionVariant === 'top';
  document.body.classList.toggle('nav-top', isTopNav);

  if (!isTopNav) {
    document.documentElement.style.removeProperty('--nav-top-offset');
    document.documentElement.style.removeProperty('--nav-height');
    window.requestAnimationFrame(() => {
      updateActiveViewHeight();
    });
    return;
  }

  window.requestAnimationFrame(() => {
    updateTopNavLayoutMetrics();
    updateActiveViewHeight();
  });
}

function applyNavPositionFromGrowthBook() {
  const navPositionFeature = gb.getFeatureValue('nav-position', 'bottom');
  applyNavPosition(navPositionFeature);
}

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

  if (bottomTabs) {
    bottomTabs.setActive(viewId);
  }

  updateViewportHeight(activeView);
  window.scrollTo(0, 0);
}

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
  getInfoItemsById: infosController.getInfoItemsById
});

applyNavTabsOrderFromGrowthBook();
applyNavPositionFromGrowthBook();

initAuthController({
  googleAuthButton,
  googleAuthButtonLabel,
  accountStatus,
  onTrackEvent: pushDataLayerEvent
});

const restaurantsController = initRestaurantsController({
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

const recipesController = initRecipesController({
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

void initGrowthBook().then(() => {
  applyNavTabsOrderFromGrowthBook();
  applyNavPositionFromGrowthBook();
});
routerController.applyRouteFromLocation({ replace: true });

geotag.locate().then((position) => {
  updateTopNavLayoutMetrics();
  restaurantsController.updateUserLocation(position);
});

restaurantsController.loadRestaurants();
recipesController.loadRecipes();
geotag.update();

window.addEventListener('resize', () => {
  updateTopNavLayoutMetrics();
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
