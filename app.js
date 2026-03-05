import { renderTileCollection } from './components/TileCollection.js';
import { renderInfoArticlesCollection } from './components/InfoArticlesCollection.js';
import { initGeotag } from './components/Geotag.js';
import { initBurgerIcon } from './components/BurgerIcon.js';
import { initOptionsMenu } from './components/OptionsMenu.js';
import { initBottomTabs } from './components/BottomTabs.js';
import { initTileExpander } from './components/TileExpander.js';
import { initInfoArticleReader } from './components/InfoArticleReader.js';

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
const optionsMenu = initOptionsMenu({ menuElement: optionsMenuElement, burgerIcon });
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

renderInfoArticlesCollection({
  items: infos,
  target: infoList,
  onArticleOpen: (item) => infoReader.open(item)
});
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
