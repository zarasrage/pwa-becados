import { todayISO } from "./dates.js";

export const safeStorage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch(e) {
      purgeCacheStorage();
      try { localStorage.setItem(key, value); } catch {}
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
  keys() {
    try { return Object.keys(localStorage); } catch { return []; }
  },
};

export function purgeCacheStorage() {
  try {
    const keys = safeStorage.keys().filter(k => k.startsWith("cache:"));
    let removed = 0;
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const { ts, ttl } = JSON.parse(raw);
        const expired = Date.now() - ts > (ttl || 30 * 60 * 1000);
        const isOldDaily = key.includes("route=daily") && (() => {
          const m = key.match(/date=(\d{4}-\d{2}-\d{2})/);
          if (!m) return false;
          return m[1] < todayISO();
        })();
        if (expired || isOldDaily) {
          localStorage.removeItem(key);
          removed++;
        }
      } catch {}
    }
    return removed;
  } catch { return 0; }
}
