const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];
const targetButtons = [...document.querySelectorAll('[data-view-target]')];
const bottomNav = document.querySelector('.bottom-nav');
const bottomNavTrack = document.querySelector('.bottom-nav-track');
const viewsViewport = document.querySelector('.views-viewport');
const viewsTrack = document.querySelector('.views-track');
const restaurantList = document.getElementById('restaurantList');
const recipeList = document.getElementById('recipeList');
const infoList = document.getElementById('infoList');
const geotag = document.querySelector('.location-wrap');
const menuBtn = document.querySelector('.menu-btn');
const optionsMenu = document.getElementById('optionsMenu');
const tileOverlay = document.getElementById('tileOverlay');
const tileExpander = document.getElementById('tileExpander');
const tileCloseBtn = document.getElementById('tileCloseBtn');

let activeTileElement = null;
let isTileAnimating = false;

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

function updateBottomNavPosition(activeIndex) {
  if (!bottomNav || !navItems.length) {
    return;
  }

  const trackWidth = bottomNavTrack ? bottomNavTrack.scrollWidth : 0;
  const maxScroll = trackWidth - bottomNav.clientWidth;
  const safeMax = Math.max(0, maxScroll);
  const denominator = Math.max(1, navItems.length - 1);
  const ratio = Math.max(0, Math.min(1, activeIndex / denominator));
  const target = safeMax * ratio;

  bottomNav.scrollTo({
    left: target,
    behavior: 'smooth'
  });
}

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

  navItems.forEach((item, index) => {
    const isActive = item.dataset.viewTarget === viewId;
    item.classList.toggle('active', isActive);
    if (isActive) {
      activeIndex = index;
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  updateViewportHeight(activeView);
  updateBottomNavPosition(activeIndex);
  window.scrollTo(0, 0);
}

targetButtons.forEach((button) => {
  button.addEventListener('click', () => switchView(button.dataset.viewTarget));
});

function updateGeotagState() {
  if (!geotag) {
    return;
  }

  const threshold = 28;
  if (window.scrollY > threshold) {
    document.body.classList.add('geotag-hidden');
  } else {
    document.body.classList.remove('geotag-hidden');
  }
}

window.addEventListener('scroll', updateGeotagState, { passive: true });

function renderRestaurantTiles(items, target) {
  target.innerHTML = '';

  items.forEach((item) => {
    const tile = document.createElement('article');
    tile.className = `tile restaurant-tile ${item.size}`;
    tile.innerHTML = `
      <p class="tile-kicker">${item.meta}</p>
      <p class="tile-title">${item.name}</p>
    `;
    tile.addEventListener('click', () => openTileExpander(tile));
    target.appendChild(tile);
  });
}

function renderRecipeTiles(items, target) {
  target.innerHTML = '';

  items.forEach((item) => {
    const tile = document.createElement('article');
    tile.className = `tile recipe-tile ${item.size}`;
    tile.innerHTML = `
      <p class="tile-kicker">${item.meta}</p>
      <p class="tile-title">${item.name}</p>
    `;
    tile.addEventListener('click', () => openTileExpander(tile));
    target.appendChild(tile);
  });
}

function renderInfoArticles(items, target) {
  if (!target) {
    return;
  }

  target.innerHTML = '';
  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'info-article';
    article.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
    `;
    target.appendChild(article);
  });
}

renderRestaurantTiles(restaurants, restaurantList);
renderRecipeTiles(recipes, recipeList);
renderInfoArticles(infos, infoList);
updateGeotagState();
updateBottomNavPosition(0);
switchView('restaurantsView');
window.addEventListener('resize', () => {
  const activeView = document.querySelector('.view.active');
  if (activeView) {
    updateViewportHeight(activeView);
  }
});

function openOptionsMenu() {
  if (!optionsMenu || !menuBtn) {
    return;
  }

  optionsMenu.classList.add('open');
  optionsMenu.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
}

function setExpanderFrame(rect) {
  if (!tileExpander) {
    return;
  }

  tileExpander.style.top = `${rect.top}px`;
  tileExpander.style.left = `${rect.left}px`;
  tileExpander.style.width = `${rect.width}px`;
  tileExpander.style.height = `${rect.height}px`;
}

function waitForTileAnimationEnd(callback) {
  if (!tileExpander) {
    callback();
    return;
  }

  let done = false;
  const finalize = () => {
    if (done) {
      return;
    }
    done = true;
    tileExpander.removeEventListener('transitionend', onEnd);
    callback();
  };

  const onEnd = (event) => {
    if (event.target !== tileExpander || event.propertyName !== 'height') {
      return;
    }
    finalize();
  };

  tileExpander.addEventListener('transitionend', onEnd);
  window.setTimeout(finalize, 420);
}

function openTileExpander(tileElement) {
  if (!tileElement || !tileOverlay || !tileExpander || isTileAnimating || document.body.classList.contains('menu-open')) {
    return;
  }

  isTileAnimating = true;
  activeTileElement = tileElement;

  const fromRect = tileElement.getBoundingClientRect();
  const inset = 12;
  const toRect = {
    top: inset,
    left: inset,
    width: Math.max(0, window.innerWidth - inset * 2),
    height: Math.max(0, window.innerHeight - inset * 2)
  };

  tileExpander.className = `${tileElement.className} tile-expander`;
  tileExpander.innerHTML = tileElement.innerHTML;
  tileExpander.style.transition = 'none';
  setExpanderFrame(fromRect);
  tileExpander.getBoundingClientRect();
  tileExpander.style.transition = '';

  tileOverlay.classList.add('open');
  tileOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('tile-open');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      tileOverlay.classList.add('expanded');
      setExpanderFrame(toRect);
      waitForTileAnimationEnd(() => {
        isTileAnimating = false;
      });
    });
  });
}

function closeTileExpander() {
  if (!activeTileElement || !tileOverlay || !tileExpander || isTileAnimating) {
    return;
  }

  isTileAnimating = true;

  const toRect = activeTileElement.getBoundingClientRect();
  tileOverlay.classList.remove('expanded');
  setExpanderFrame(toRect);

  waitForTileAnimationEnd(() => {
    tileOverlay.classList.remove('open');
    tileOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tile-open');
    tileExpander.innerHTML = '';
    activeTileElement = null;
    isTileAnimating = false;
  });
}

function closeOptionsMenu() {
  if (!optionsMenu || !menuBtn) {
    return;
  }

  optionsMenu.classList.remove('open');
  optionsMenu.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    if (optionsMenu?.classList.contains('open')) {
      closeOptionsMenu();
    } else {
      openOptionsMenu();
    }
  });
}

if (optionsMenu) {
  optionsMenu.addEventListener('click', (event) => {
    if (event.target === optionsMenu) {
      closeOptionsMenu();
    }
  });
}

if (tileCloseBtn) {
  tileCloseBtn.addEventListener('click', closeTileExpander);
}

if (tileOverlay) {
  tileOverlay.addEventListener('click', (event) => {
    if (event.target === tileOverlay) {
      closeTileExpander();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('tile-open')) {
    closeTileExpander();
    return;
  }

  if (event.key === 'Escape' && optionsMenu?.classList.contains('open')) {
    closeOptionsMenu();
  }
});
