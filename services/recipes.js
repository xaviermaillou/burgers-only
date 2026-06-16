import {
  getDoc,
  getDocs,
  collection,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { db } from './firebase.js';
import { resolveItemImage, resolveItemImageWidth } from './item-images.js';

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

function normalizeNutrition(nutrition) {
  return nutrition && typeof nutrition === 'object' ? nutrition : {};
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
  const manifestImage = resolveItemImage(COLLECTION_NAME, doc.id);

  return {
    id: doc.id,
    name: data.name || '',
    overview: data.overview || '',
    image: manifestImage || data.image || '',
    imageWidth: manifestImage ? resolveItemImageWidth(COLLECTION_NAME, doc.id) : 0,
    ingredients: ingredients.filter(Boolean),
    steps: Array.isArray(data.steps) ? data.steps.filter((step) => typeof step === 'string') : [],
    prepTime: data.prepTime || '',
    cookTime: data.cookTime || '',
    nutrition: normalizeNutrition(data.nutrition),
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

export { COLLECTION_NAME as RECIPES_COLLECTION };
