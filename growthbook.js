import { GrowthBook } from "@growthbook/growthbook";
import { autoAttributesPlugin, growthbookTrackingPlugin } from "@growthbook/growthbook/plugins";

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
  } catch { }

  try {
    const sessionValue = window.sessionStorage.getItem(GB_USER_ID_STORAGE_KEY);
    if (sessionValue) {
      return sessionValue;
    }
  } catch { }

  return null;
}

function writeStoredUserId(userId) {
  try {
    window.localStorage.setItem(GB_USER_ID_STORAGE_KEY, userId);
    return;
  } catch { }

  try {
    window.sessionStorage.setItem(GB_USER_ID_STORAGE_KEY, userId);
  } catch { }
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
  const userId = getOrCreateUserId();
  const ua = window.navigator.userAgent;

  // Mapping attributes to match Managed Warehouse expectations
  const browser = /chrome|chromium|crios/i.test(ua) ? "chrome" :
    /firefox|fxios/i.test(ua) ? "firefox" :
      /safari/i.test(ua) ? "safari" :
        /edge/i.test(ua) ? "edge" : "unknown";

  const os = /android/i.test(ua) ? "android" :
    /iphone|ipad|ipod/i.test(ua) ? "ios" :
      /windows/i.test(ua) ? "windows" :
        /mac/i.test(ua) ? "macos" : "unknown";

  const deviceType = /Mobi|Android/i.test(ua) ? "mobile" : "desktop";

  return {
    id: userId,
    user_id: userId,
    device_id: userId,
    ua_browser: browser,
    ua_os: os,
    ua_device_type: deviceType
  };
}

function updateGrowthBookAttributes() {
  const current = gb.getAttributes() || {};
  gb.setAttributes({
    ...current,
    url: window.location.href,
    path: window.location.pathname,
    host: window.location.host
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
  window.addEventListener(GB_URL_CHANGE_EVENT, updateGrowthBookAttributes);
}

/**
 * GrowthBook Instance
 * For a pure JS app, we export the instance so it can be used across components.
 */
export const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-IhqsVdDTJr4rQB5s",
  enableDevMode: isDevMode,
  attributes: buildBaseAttributes(),
  plugins: [
    autoAttributesPlugin({
      // Pass our userId to prevent the plugin from creating its own random identifier
      uuid: getOrCreateUserId(),
      uuidAutoPersist: false
    }),
    growthbookTrackingPlugin()
  ],
  // Define default features for local testing/development
  features: {
    "nav-position": {
      defaultValue: "bottom",
    },
    "nav-tabs-order": {
      defaultValue: "restaurants-recipes-infos",
    }
  },
  trackingCallback: (experiment, result) => {
    // 🕵️ Tracing Logic (as seen in SDK docs)
    console.log("🕵️ GrowthBook Trace:", {
      id: experiment.key,
      variationId: result.key,
      inExperiment: result.inExperiment,
      hashAttribute: experiment.hashAttribute || "id",
      hashValue: result.hashValue
    });

    // 🔗 Optional: Push to Google Tag Manager / GA4
    if (window.dataLayer && typeof window.dataLayer.push === "function") {
      window.dataLayer.push({
        event: "experiment_viewed",
        experiment_id: experiment.key,
        variation_id: String(result.key)
      });
    }
  }
});

// Expose GB instance globally for debugging
if (isDevMode) {
  window.gb = gb;
  console.log("🛠️ GrowthBook Debug: current attributes", gb.getAttributes());
}

/**
 * Initialize GrowthBook
 * Fetches latest feature flags from the remote API (if clientKey is provided)
 */
export async function initGrowthBook() {
  installGrowthBookUrlTracking();
  updateGrowthBookAttributes();

  if (!growthBookInitPromise) {
    growthBookInitPromise = (async () => {
      try {
        // If clientKey is missing, gb.init() will still work with local features
        await gb.init({ streaming: true });
        updateGrowthBookAttributes();
        if (isDevMode) {
          console.log("GrowthBook initialized successfully");
          const navPosEval = gb.evalFeature("nav-position");
          console.log("Feature 'nav-position' state:", {
            value: navPosEval.value,
            source: navPosEval.source,
            experimentId: navPosEval.experiment?.key || "N/A"
          });
        }
      } catch (err) {
        console.error("GrowthBook failed to initialize", err);
      }
    })();
  }

  await growthBookInitPromise;
}