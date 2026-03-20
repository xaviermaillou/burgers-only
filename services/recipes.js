import {
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { db } from './firebase.js';

const COLLECTION_NAME = 'recipes';
const RECIPE_SIZE_BY_INDEX = {
  0: 'm',
  1: 's',
  2: 's',
  3: 'm',
  4: 'm',
};

function getRecipeSize(index) {
  return RECIPE_SIZE_BY_INDEX[index] || 's';
}

async function resolveIngredient(reference) {
  if (!reference) {
    return null;
  }

  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

async function normalizeRecipe(doc, index) {
  const data = doc.data();
  const ingredientRefs = Array.isArray(data.ingredients) ? data.ingredients : [];
  const ingredients = await Promise.all(ingredientRefs.map(resolveIngredient));

  return {
    id: doc.id,
    name: data.name || '',
    overview: data.overview || '',
    ingredients: ingredients.filter(Boolean),
    size: getRecipeSize(index)
  };
}

function recipesQuery() {
  return query(collection(db, COLLECTION_NAME), orderBy('name'));
}

export async function fetchRecipes() {
  const snapshot = await getDocs(recipesQuery());
  return Promise.all(snapshot.docs.map((doc, index) => normalizeRecipe(doc, index)));
}

export function subscribeRecipes(onUpdate, onError) {
  return onSnapshot(
    recipesQuery(),
    async (snapshot) => {
      try {
        const recipes = await Promise.all(
          snapshot.docs.map((doc, index) => normalizeRecipe(doc, index))
        );
        if (typeof onUpdate === 'function') {
          onUpdate(recipes);
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

export { COLLECTION_NAME as RECIPES_COLLECTION };
