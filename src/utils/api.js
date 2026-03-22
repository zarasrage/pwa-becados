import { API_URL, API_TOKEN } from "../constants/api.js";
import { DEMO_BECADO, demoDaily, demoPersonalMonth } from "../data/demo.js";
import { getWeekDates } from "./dates.js";
import { cacheGet, cacheSet, cacheAge, cacheKey, _revalidatedThisSession, SWR_REVALIDATE_AFTER } from "./cache.js";
import { safeStorage } from "./storage.js";

export async function apiGet(params) {
  if (params.becado === DEMO_BECADO) {
    await new Promise(r => setTimeout(r, 180));
    const route = (params.route || "").toLowerCase();
    if (route === "daily")          return demoDaily(params.date);
    if (route === "personal-month") return demoPersonalMonth(params.month);
    return { ok:false, error:"Demo: ruta no disponible" };
  }
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiSWR(params, onImmediate, onFresh) {
  const cached = cacheGet(params);
  const key    = cacheKey(params);

  if (cached) {
    onImmediate(cached, true);
    if (!_revalidatedThisSession.has(key) && cacheAge(params) > SWR_REVALIDATE_AFTER) {
      _revalidatedThisSession.add(key);
      apiGet(params)
        .then(fresh => { cacheSet(params, fresh); onFresh(fresh, false); })
        .catch(() => { onFresh(cached, false); });
    } else {
      onFresh(cached, false);
    }
    return cached;
  }

  try {
    const fresh = await apiGet(params);
    cacheSet(params, fresh);
    _revalidatedThisSession.add(key);
    onFresh(fresh, false);
    return fresh;
  } catch(e) {
    throw e;
  }
}

export function prefetch(params) {
  if (cacheGet(params)) return;
  apiGet(params)
    .then(d => { if (d.ok !== false) cacheSet(params, d); })
    .catch(() => {});
}

export function prefetchWeek(becado, mondayISO) {
  const weekDates = getWeekDates(mondayISO);
  const allCached = weekDates.every(d => !!cacheGet({route:"daily",becado,date:d,token:API_TOKEN}));
  if (allCached) return;
  apiGet({ route:"week", becado, start:mondayISO, token:API_TOKEN })
    .then(res => {
      if (!res.ok || !res.days) return;
      res.days.forEach(day => {
        if (day.ok !== false) {
          cacheSet({route:"daily", becado, date:day.date, token:API_TOKEN}, day);
        }
      });
    })
    .catch(() => {});
}

// ── Version check — sincronización con el backend ────────────────────────────
// Cuando tú editas el Google Sheet, el backend actualiza un "dataVersion".
// Esta función se llama una vez al abrir la app. Si la versión cambió,
// limpia todo el localStorage para forzar datos frescos.
export let _versionChecked = false;

export function checkDataVersion() {
  if (_versionChecked) return;
  _versionChecked = true;
  const url = new URL(API_URL);
  url.searchParams.set("route", "version");
  url.searchParams.set("token", API_TOKEN);
  fetch(url.toString())
    .then(r => r.json())
    .then(data => {
      if (!data.ok) return;
      const serverVersion = data.version;
      const localVersion = safeStorage.get("dataVersion");
      if (localVersion && localVersion !== serverVersion) {
        // ¡El Sheet fue editado! No borrar caché — los datos viejos siguen
        // visibles. Solo forzar que SWR revalide todo en background.
        _revalidatedThisSession.clear();
      }
      safeStorage.set("dataVersion", serverVersion);
    })
    .catch(() => {});
}
