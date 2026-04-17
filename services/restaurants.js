import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { db } from './firebase.js';
import { resolveItemImage } from './item-images.js';

const COLLECTION_NAME = 'restaurants';

async function normalizeRestaurant(doc) {
  const data = doc.data();
  const manifestImage = await resolveItemImage(COLLECTION_NAME, doc.id);

  return {
    id: doc.id,
    name: data.name || '',
    area: data.area || '',
    geo: data.geo || null,
    image: manifestImage || data.image || data.photo_url || ''
  };
}

function restaurantsQuery() {
  return query(collection(db, COLLECTION_NAME), orderBy('name'));
}

export async function fetchRestaurants() {
  try {
    const snapshot = await getDocs(restaurantsQuery());
    return Promise.all(snapshot.docs.map((doc) => normalizeRestaurant(doc)));
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
          snapshot.docs.map((doc) => normalizeRestaurant(doc))
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
