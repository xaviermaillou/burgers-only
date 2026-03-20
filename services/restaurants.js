import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { db } from './firebase.js';

const COLLECTION_NAME = 'restaurants';
const RESTAURANT_SIZE_BY_INDEX = {
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

function getRestaurantSize(index) {
  return RESTAURANT_SIZE_BY_INDEX[index] || 's';
}

async function normalizeRestaurant(doc, index) {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name || '',
    area: data.area || '',
    size: getRestaurantSize(index)
  };
}

function restaurantsQuery() {
  return query(collection(db, COLLECTION_NAME), orderBy('name'));
}

export async function fetchRestaurants() {
  try {
    const snapshot = await getDocs(restaurantsQuery());
    return Promise.all(snapshot.docs.map((doc, index) => normalizeRestaurant(doc, index)));
  } catch (error) {
    throw error;
  }
}

export function subscribeRestaurants(onUpdate, onError) {
  return onSnapshot(
    restaurantsQuery(),
    async (snapshot) => {
      try {
        const restaurants = await Promise.all(
          snapshot.docs.map((doc, index) => normalizeRestaurant(doc, index))
        );
        if (typeof onUpdate === 'function') {
          onUpdate(restaurants);
        }
      } catch (error) {
        if (typeof onError === 'function') {
          onError(error);
        }
      }
    },
    (error) => {
      if (typeof onError === 'function') {
        onError(error);
      }
    }
  );
}

export { COLLECTION_NAME as RESTAURANTS_COLLECTION };
