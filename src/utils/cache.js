import { todayISO } from "./dates.js";
import { safeStorage } from "./storage.js";

export const CACHE_7D = 7 * 24 * 60 * 60 * 1000;

export function cacheTTL(params) {
  const route = (params.route || "").toLowerCase();
  if (route === "daily") {
    // Para el día de hoy, expira a medianoche (podría haber cambio de turno)
    const dateStr = params.date || todayISO();
    if (dateStr === todayISO()) {
      const [y,m,d] = dateStr.split("-").map(Number);
      const midnight = new Date(y, m-1, d+1, 0, 0, 0).getTime();
      return midnight - Date.now();
    }
    return CACHE_7D; // Días pasados/futuros → 7 días
  }
  return CACHE_7D; // Todo lo demás → 7 días
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

// Con TTL de 7 días + version check (que limpia localStorage al detectar cambios),
// la revalidación SWR solo es fallback. 24h es suficiente.
export const SWR_REVALIDATE_AFTER = 24 * 60 * 60 * 1000; // 24 horas
