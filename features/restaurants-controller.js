import { renderTileCollection } from '../components/TileCollection.js';
import { fetchRestaurants } from '../services/restaurants.js';

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

function getRestaurantSizeByDisplayIndex(index) {
  return RESTAURANT_SIZE_BY_DISPLAY_INDEX[index] || 's';
}

export function initRestaurantsController({
  target,
  tileExpander,
  onRouteUpdate = null,
  onTrackEvent = null,
  onRendered = null,
  onLoaded = null
}) {
  let userLocationCoords = null;
  let restaurantsRawCache = [];
  let restaurantsCache = [];

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

  const sortRestaurantsByProximity = (restaurants) => {
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
  };

  const renderRestaurants = (restaurants) => {
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
      target,
      variant: 'restaurant',
      onTileOpen: (tileElement, item) => {
        track('view_item', {
          item_name: item.name,
          item_category: 'restaurant'
        });
        tileExpander.open(tileElement);
        updateRoute({
          tab: 'restaurants',
          item: { type: 'restaurant', id: item.routeId }
        });
      }
    });

    if (typeof onRendered === 'function') {
      onRendered();
    }
  };

  const loadRestaurants = async () => {
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
      if (typeof onLoaded === 'function') {
        onLoaded();
      }
    }
  };

  const updateUserLocation = (position) => {
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
  };

  return {
    loadRestaurants,
    updateUserLocation
  };
}
