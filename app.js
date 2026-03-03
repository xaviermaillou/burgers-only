const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];
const targetButtons = [...document.querySelectorAll('[data-view-target]')];
const restaurantList = document.getElementById('restaurantList');
const recipeList = document.getElementById('recipeList');
const geotag = document.querySelector('.location-wrap');

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
  { name: 'Smash Burger Classique', meta: '20 min', size: 'tile-2x2' },
  { name: 'Burger Bacon BBQ', meta: '30 min', size: 'tile-2x1' },
  { name: 'Burger Veggie Halloumi', meta: '25 min', size: 'tile-1x1' },
  { name: 'Burger Poulet Croustillant', meta: '35 min', size: 'tile-1x1' },
  { name: 'Burger Bleu Noix', meta: '28 min', size: 'tile-2x1' },
  { name: 'Burger Fish and Dill', meta: '25 min', size: 'tile-1x1' },
  { name: 'Burger Oignons Crispy', meta: '22 min', size: 'tile-1x1' }
];

function switchView(viewId) {
  views.forEach((view) => {
    view.classList.toggle('active', view.id === viewId);
  });

  navItems.forEach((item) => {
    const isActive = item.dataset.viewTarget === viewId;
    item.classList.toggle('active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });

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
    target.appendChild(tile);
  });
}

renderRestaurantTiles(restaurants, restaurantList);
renderRecipeTiles(recipes, recipeList);
updateGeotagState();
