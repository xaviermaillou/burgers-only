import { GrowthBook } from "https://esm.sh/@growthbook/growthbook@1.6.5?bundle&target=es2022";

const GB_USER_ID_STORAGE_KEY = "gb_user_id";
const GB_URL_CHANGE_EVENT = "growthbook:url-change";
const isLocalDevHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.endsWith(".local");
const isDevMode =
  isLocalDevHost || new URLSearchParams(window.location.search).get("gb_dev") === "1";
let growthBookInitPromise = null;
let growthBookUrlTrackingInstalled = false;

function readStoredUserId() {
  try {
    const localValue = window.localStorage.getItem(GB_USER_ID_STORAGE_KEY);
    if (localValue) {
      return localValue;
    }
  } catch {}

  try {
    const sessionValue = window.sessionStorage.getItem(GB_USER_ID_STORAGE_KEY);
    if (sessionValue) {
      return sessionValue;
    }
  } catch {}

  return null;
}

function writeStoredUserId(userId) {
  try {
    window.localStorage.setItem(GB_USER_ID_STORAGE_KEY, userId);
    return;
  } catch {}

  try {
    window.sessionStorage.setItem(GB_USER_ID_STORAGE_KEY, userId);
  } catch {}
}

function getOrCreateUserId() {
  const existingUserId = readStoredUserId();
  if (existingUserId) {
    return existingUserId;
  }

  const nextUserId = "user-" + Math.floor(Math.random() * 1000000);
  writeStoredUserId(nextUserId);
  return nextUserId;
}

function buildBaseAttributes() {
  return {
    id: getOrCreateUserId(),
    url: window.location.href
  };
}

function updateGrowthBookUrlAttribute() {
  gb.setAttributes({
    ...(gb.getAttributes() || {}),
    url: window.location.href
  });
}

function installGrowthBookUrlTracking() {
  if (growthBookUrlTrackingInstalled) {
    return;
  }

  growthBookUrlTrackingInstalled = true;

  const notifyUrlChange = () => {
    window.dispatchEvent(new Event(GB_URL_CHANGE_EVENT));
  };

  const patchHistoryMethod = (methodName) => {
    const originalMethod = window.history[methodName];
    if (typeof originalMethod !== "function") {
      return;
    }

    window.history[methodName] = function patchedHistoryMethod(...args) {
      const result = originalMethod.apply(this, args);
      notifyUrlChange();
      return result;
    };
  };

  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
  window.addEventListener("popstate", notifyUrlChange);
  window.addEventListener("hashchange", notifyUrlChange);
  window.addEventListener(GB_URL_CHANGE_EVENT, updateGrowthBookUrlAttribute);
}

/**
 * GrowthBook Instance
 * For a pure JS app, we export the instance so it can be used across components.
 */
export const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-IH47uvHMpRKPDj",
  enableDevMode: isDevMode,
  attributes: buildBaseAttributes(),
  // Define default features for local testing/development
  features: {
    "show-beta-badge": {
      defaultValue: true,
    },
    "header-variant": {
      defaultValue: "standard",
    },
    "recipe-layout": {
      defaultValue: "metro",
    },
    "nav-position": {
      defaultValue: "bottom",
    },
    "nav-order-1": {
      defaultValue: "restaurants",
    },
    "nav-order-2": {
      defaultValue: "recipes",
    },
    "nav-order-3": {
      defaultValue: "infos",
    },
    "nav-tabs-order": {
      defaultValue: "restaurants-recipes-infos",
    }
  },
  trackingCallback: (experiment, result) => {
    // Integrate with GTM/GA4 if dataLayer exists
    if (window.dataLayer && typeof window.dataLayer.push === "function") {
      window.dataLayer.push({
        event: "experiment_viewed",
        experiment_id: experiment.key,
        variation_id: result.key
      });
    }
    if (isDevMode) {
      console.log("Experiment Viewed", {
        experimentId: experiment.key,
        variationId: result.key
      });
    }
  },
});

/**
 * Initialize GrowthBook
 * Fetches latest feature flags from the remote API (if clientKey is provided)
 */
export async function initGrowthBook() {
  installGrowthBookUrlTracking();
  updateGrowthBookUrlAttribute();

  if (!growthBookInitPromise) {
    growthBookInitPromise = (async () => {
      try {
        // If clientKey is missing, gb.init() will still work with local features
        await gb.init({ streaming: true });
        updateGrowthBookUrlAttribute();
        if (isDevMode) {
          console.log("GrowthBook initialized successfully");
        }
      } catch (err) {
        console.error("GrowthBook failed to initialize", err);
      }
    })();
  }

  await growthBookInitPromise;
}
