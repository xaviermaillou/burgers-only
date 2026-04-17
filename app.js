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
const infoReaderOverlay = document.getElementById('infoReaderOverlay');
const infoReaderClose = document.getElementById('infoReaderClose');
const infoReaderTitle = document.getElementById('infoReaderTitle');
const infoReaderBody = document.getElementById('infoReaderBody');

function pushDataLayerEvent(eventName, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload
  });
}

const infos = [
  {
    title: 'Comment choisir un bun',
    summary: 'Un bun moelleux qui reste stable avec la sauce aide a garder un burger propre a manger.',
    content: [
      'Choisis un bun legerement brioché avec une mie serrée: il absorbe un peu de jus sans se desintegrer.',
      'Toaste la face interieure 30 a 60 secondes pour creer une barriere contre l humidite des sauces.',
      'Si ton burger est tres garni, prefere un bun de diametre un peu plus large pour garder un montage stable.'
    ]
  },
  {
    title: 'Cuisson du steak',
    summary: 'Une plaque tres chaude et un temps court donnent une bonne croute et un coeur juteux.',
    content: [
      'Utilise une plaque ou poele en fonte prechauffee a feu fort pour obtenir une vraie reaction de Maillard.',
      'Forme des boules de viande de 90 a 120 g puis ecrase-les a la premiere seconde de cuisson.',
      'Sale juste apres la formation de la galette et retourne quand la croute est bien brune, sans multiplier les retournements.'
    ]
  },
  {
    title: 'Ordre de montage',
    summary: 'Base sauce, salade, steak et toppings: cet ordre limite l humidite sur le pain du bas.',
    content: [
      'Pose une couche fine de sauce sur le pain du bas, puis un element sec comme salade ou pickles egouttes.',
      'Ajoute ensuite le steak et le fromage pour fixer la structure chaude au centre du burger.',
      'Termine avec les toppings humides plus haut dans le montage pour eviter de detremper la base.'
    ]
  },
  {
    title: 'Sauces et equilibre',
    summary: 'Reste sur une sauce principale puis un accent acidule pour eviter un burger trop lourd.',
    content: [
      'Garde une sauce principale (mayo, burger sauce, moutarde douce) et ajoute un seul contrepoint acide.',
      'Un trait de pickles, oignons vinaigres ou citron suffit souvent a redonner de la fraicheur.',
      'Dose progressivement: trop de sauce masque la viande et rend la prise en main moins propre.'
    ]
  }
];

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
  inset: 12
});
const infoReader = initInfoArticleReader({
  overlay: infoReaderOverlay,
  titleElement: infoReaderTitle,
  bodyElement: infoReaderBody,
  closeButton: infoReaderClose
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
  const restaurantTiles = restaurants.map((restaurant) => ({
    name: restaurant.name,
    meta: restaurant.area,
    size: mapTileSizeToClass(restaurant.size)
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
    }
  });

  updateActiveViewHeight();
}

async function loadRestaurants() {
  try {
    const restaurants = await fetchRestaurants();
    renderRestaurants(restaurants);
  } catch (error) {
    console.error('Failed to load restaurants from Firestore.', error);
    renderRestaurants([]);
  }
}

function renderRecipes(recipes) {
  const recipeTiles = recipes.map((recipe) => ({
    name: recipe.name,
    meta: '',
    size: mapTileSizeToClass(recipe.size),
    expandedBody: recipe.overview,
    expandedList: recipe.ingredients.map((ingredient) => ingredient.name).filter(Boolean)
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
  }
}

renderInfoArticlesCollection({
  items: infos,
  target: infoList,
  onArticleOpen: (item) => infoReader.open(item)
});
updateActiveViewHeight();
geotag.locate();
loadRestaurants();
loadRecipes();
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

  if (infoReader.handleEscape(event)) {
    return;
  }

  optionsMenu.handleEscape(event);
});
