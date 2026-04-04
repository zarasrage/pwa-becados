import { todayISO } from "./dates.js";
import { safeStorage } from "./storage.js";

// Los datos cambian ~cada 2 semanas. El checkDataVersion() es el mecanismo
// real de invalidación (limpia caché cuando el Sheet cambia). El TTL es solo
// un fallback de seguridad → 30 días es suficiente.
export const CACHE_30D = 30 * 24 * 60 * 60 * 1000;

export function cacheTTL(params) {
  const route = (params.route || "").toLowerCase();
  if (route === "daily") {
    return CACHE_30D;
  }
  return CACHE_30D; // Todo lo demás → 30 días
}

export function cacheKey(params) {
  return "cache:" + Object.entries(params).sort().map(([k,v])=>`${k}=${v}`).join("&");
}
export function cacheGet(params) {
  try {
    const raw = safeStorage.get(cacheKey(params));
    if (!raw) return null;
    const { data, ts, ttl } = JSON.parse(raw);
    if (Date.now() - ts > (ttl || 30 * 60 * 1000)) { safeStorage.remove(cacheKey(params)); return null; }
    return data;
  } catch { return null; }
}
export function cacheSet(params, data) {
  try {
    const ttl = cacheTTL(params);
    if (ttl <= 0) return;
    safeStorage.set(cacheKey(params), JSON.stringify({ data, ts: Date.now(), ttl }));
  } catch {}
}

export function cacheAge(params) {
  try {
    const raw = safeStorage.get(cacheKey(params));
    if (!raw) return Infinity;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts;
  } catch { return Infinity; }
}

export const _revalidatedThisSession = new Set();

// checkDataVersion() es el mecanismo real de invalidación.
// SWR revalida en background solo como fallback (ej: si el version check falló por red).
export const SWR_REVALIDATE_AFTER = 7 * 24 * 60 * 60 * 1000; // 7 días
