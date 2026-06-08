import { GrowthBook } from "@growthbook/growthbook";
import { autoAttributesPlugin, growthbookTrackingPlugin } from "@growthbook/growthbook/plugins";

const GB_USER_ID_STORAGE_KEY = "gb_user_id";
const isLocalDevHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.endsWith(".local");
const isDevMode =
  isLocalDevHost || new URLSearchParams(window.location.search).get("gb_dev") === "1";
let growthBookInitPromise = null;

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

export const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-IhqsVdDTJr4rQB5s",
  enableDevMode: isDevMode,
  attributes: buildBaseAttributes(),
  plugins: [
    autoAttributesPlugin({
      uuid: getOrCreateUserId(),
      uuidAutoPersist: false
    }),
    growthbookTrackingPlugin()
  ],
  features: {
    "nav-position": {
      defaultValue: "bottom"
    }
  },
  trackingCallback: (experiment, result) => {
    if (window.dataLayer && typeof window.dataLayer.push === "function") {
      window.dataLayer.push({
        event: "experiment_viewed",
        experiment_id: experiment.key,
        variation_id: String(result.key)
      });
    }
  }
});

if (isDevMode) {
  window.gb = gb;
}

export async function initGrowthBook() {
  if (!growthBookInitPromise) {
    growthBookInitPromise = (async () => {
      try {
        await gb.init({ streaming: true });
      } catch (err) {
        console.error("GrowthBook failed to initialize", err);
      }
    })();
  }

  await growthBookInitPromise;
}
