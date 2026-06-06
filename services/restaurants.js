import {
  collection,
  getDocs,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { db } from './firebase.js';
import { resolveItemImage } from './item-images.js';

const COLLECTION_NAME = 'restaurants';

function normalizeRestaurant(doc) {
  const data = doc.data();
  const manifestImage = resolveItemImage(COLLECTION_NAME, doc.id);

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
  const snapshot = await getDocs(restaurantsQuery());
  return snapshot.docs.map((doc) => normalizeRestaurant(doc));
}

export { COLLECTION_NAME as RESTAURANTS_COLLECTION };
