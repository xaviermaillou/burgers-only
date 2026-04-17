import { renderTileCollection } from '../components/TileCollection.js';
import { fetchRecipes } from '../services/recipes.js';

const WIDE_MASK_TILE_INDEXES = new Set([0, 3, 4]);
const SQUARE_MASK_COUNT = 20;
const WIDE_MASK_COUNT = 10;

function toRouteId(...values) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }

  return '';
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

export function initRecipesController({
  target,
  tileExpander,
  onRouteUpdate = null,
  onTrackEvent = null,
  onRendered = null,
  onLoaded = null
}) {
  const track = (eventName, payload = {}) => {
    if (typeof onTrackEvent === 'function') {
      onTrackEvent(eventName, payload);
    }
  };

  const updateRoute = (patch, options = {}) => {
    if (typeof onRouteUpdate === 'function') {
      onRouteUpdate(patch, options);
    }
  };

  const renderRecipes = (recipes) => {
    const recipeTiles = recipes.map((recipe, index) => {
      const useWideMask = WIDE_MASK_TILE_INDEXES.has(index);

      return {
        routeId: toRouteId(recipe.id, `recipe-${index}`),
        name: recipe.name,
        meta: '',
        size: mapTileSizeToClass(recipe.size),
        expandedBody: recipe.overview,
        expandedList: recipe.ingredients.map((ingredient) => ingredient.name).filter(Boolean),
        image: recipe.image || '',
        maskKind: useWideMask ? 'wide' : 'square',
        maskIndex: useWideMask
          ? (index % WIDE_MASK_COUNT) + 1
          : (index % SQUARE_MASK_COUNT) + 1
      };
    });

    renderTileCollection({
      items: recipeTiles,
      target,
      variant: 'recipe',
      onTileOpen: (tileElement, item) => {
        track('view_item', {
          item_name: item.name,
          item_category: 'recipe'
        });
        tileExpander.open(tileElement);
        updateRoute({
          tab: 'recipes',
          item: { type: 'recipe', id: item.routeId }
        });
      }
    });

    if (typeof onRendered === 'function') {
      onRendered();
    }
  };

  const loadRecipes = async () => {
    try {
      const recipes = await fetchRecipes();
      renderRecipes(recipes);
    } catch (error) {
      console.error('Failed to load recipes from Firestore.', error);
      renderRecipes([]);
    } finally {
      if (typeof onLoaded === 'function') {
        onLoaded();
      }
    }
  };

  return {
    loadRecipes
  };
}
