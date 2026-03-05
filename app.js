import { renderTileCollection } from './components/TileCollection.js';
import { renderInfoArticlesCollection } from './components/InfoArticlesCollection.js';
import { initGeotag } from './components/Geotag.js';
import { initBurgerIcon } from './components/BurgerIcon.js';
import { initOptionsMenu } from './components/OptionsMenu.js';
import { initBottomTabs } from './components/BottomTabs.js';
import { initTileExpander } from './components/TileExpander.js';

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

const tileOverlay = document.getElementById('tileOverlay');
const tileExpanderElement = document.getElementById('tileExpander');
const tileCloseButton = document.getElementById('tileCloseBtn');

const restaurants = [
  { name: 'Rocket Smash House', meta: 'Kirchberg', size: 'tile-2x2' },
  { name: 'Pink Buns Club', meta: 'Lux-Centre', size: 'tile-2x1' },
  { name: 'Mint Patty Lab', meta: 'Belair', size: 'tile-1x1' },
  { name: 'Blue Char Burger', meta: 'Gare', size: 'tile-1x1' },
  { name: 'Old Town Burgers', meta: 'Ville Haute', size: 'tile-2x1' },
  { name: 'Flame District', meta: 'Cloche d Or', size: 'tile-1x1' },
  { name: 'Grand Bun Corner', meta: 'Limpertsberg', size: 'tile-1x1' }
];

const recipes = [
  { name: 'Smash Burger Classique', meta: '20 min', size: 'tile-2x1' },
  { name: 'Burger Bacon BBQ', meta: '30 min', size: 'tile-1x1' },
  { name: 'Burger Veggie Halloumi', meta: '25 min', size: 'tile-1x1' },
  { name: 'Burger Poulet Croustillant', meta: '35 min', size: 'tile-2x2' },
  { name: 'Burger Bleu Noix', meta: '28 min', size: 'tile-1x1' },
  { name: 'Burger Fish and Dill', meta: '25 min', size: 'tile-1x1' },
  { name: 'Burger Oignons Crispy', meta: '22 min', size: 'tile-2x1' }
];

const infos = [
  {
    title: 'Comment choisir un bun',
    summary: 'Un bun moelleux qui reste stable avec la sauce aide a garder un burger propre a manger.'
  },
  {
    title: 'Cuisson du steak',
    summary: 'Une plaque tres chaude et un temps court donnent une bonne croute et un coeur juteux.'
  },
  {
    title: 'Ordre de montage',
    summary: 'Base sauce, salade, steak et toppings: cet ordre limite l humidite sur le pain du bas.'
  },
  {
    title: 'Sauces et equilibre',
    summary: 'Reste sur une sauce principale puis un accent acidule pour eviter un burger trop lourd.'
  }
];

const geotag = initGeotag({ element: geotagElement, threshold: 28 });
const burgerIcon = initBurgerIcon(menuButton);
const optionsMenu = initOptionsMenu({ menuElement: optionsMenuElement, burgerIcon });
const tileExpander = initTileExpander({
  overlay: tileOverlay,
  expander: tileExpanderElement,
  closeButton: tileCloseButton,
  inset: 12
});

const bottomTabs = initBottomTabs({
  bottomNav,
  bottomNavTrack,
  items: navItems,
  onSelect: (viewId) => switchView(viewId)
});

function updateViewportHeight(activeView) {
  if (!viewsViewport || !activeView) {
    return;
  }

  viewsViewport.style.minHeight = `${activeView.offsetHeight}px`;
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

renderTileCollection({
  items: restaurants,
  target: restaurantList,
  variant: 'restaurant',
  onTileOpen: (tileElement) => tileExpander.open(tileElement)
});

renderTileCollection({
  items: recipes,
  target: recipeList,
  variant: 'recipe',
  onTileOpen: (tileElement) => tileExpander.open(tileElement)
});

renderInfoArticlesCollection({ items: infos, target: infoList });
geotag.update();
switchView('restaurantsView');

window.addEventListener('resize', () => {
  const activeView = document.querySelector('.view.active');
  if (activeView) {
    updateViewportHeight(activeView);
  }
});

document.addEventListener('keydown', (event) => {
  if (tileExpander.handleEscape(event)) {
    return;
  }

  optionsMenu.handleEscape(event);
});
