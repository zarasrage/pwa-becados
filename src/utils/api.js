import { API_URL, API_TOKEN, USE_SUPABASE } from "../constants/api.js";
import { getWeekDates } from "./dates.js";
import { cacheGet, cacheSet, cacheAge, cacheKey, _revalidatedThisSession, SWR_REVALIDATE_AFTER } from "./cache.js";
import { safeStorage } from "./storage.js";
import { getBecados, getDaily, getWeek, getSummary, getMonthly, getPersonalMonth } from "../lib/supabaseApi.js";

async function supabaseGet(params) {
  const route = (params.route || "").toLowerCase();
  if (route === "becados")        return getBecados();
  if (route === "daily")          return getDaily(params.becado, params.date);
  if (route === "week")           return getWeek(params.becado, params.start);
  if (route === "summary")        return getSummary(params.date);
  if (route === "monthly")        return getMonthly(params.month);
  if (route === "personal-month") return getPersonalMonth(params.becado, params.month);
  return { ok: false, error: "Ruta no disponible en Supabase: " + route };
}

export async function apiGet(params) {
  if (USE_SUPABASE) return supabaseGet(params);
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

// ── Version check — sincronización con Supabase ──────────────────────────────
// Supabase tabla `config` tiene key="data_version". Cuando se editan datos,
// se actualiza ese valor. La app lo chequea una vez por sesión y si cambió,
// limpia el caché local para forzar datos frescos.
export let _versionChecked = false;

export function checkDataVersion() {
  if (_versionChecked) return;
  _versionChecked = true;
  if (!USE_SUPABASE) {
    // Fallback GAS
    const url = new URL(API_URL);
    url.searchParams.set("route", "version");
    url.searchParams.set("token", API_TOKEN);
    fetch(url.toString())
      .then(r => r.json())
      .then(data => {
        if (!data.ok) return;
        _applyVersionCheck(data.version);
      })
      .catch(() => {});
    return;
  }
  import("../lib/supabase.js").then(({ supabase }) => {
    supabase.from("config").select("value").eq("key", "data_version").single()
      .then(({ data }) => {
        if (!data?.value) return;
        _applyVersionCheck(data.value);
      })
      .catch(() => {});
  });
}

function _applyVersionCheck(serverVersion) {
  const localVersion = safeStorage.get("dataVersion");
  if (localVersion && localVersion !== serverVersion) {
    safeStorage.keys()
      .filter(k => k.startsWith("cache:"))
      .forEach(k => safeStorage.remove(k));
    _revalidatedThisSession.clear();
    window.dispatchEvent(new CustomEvent("dataVersionChanged"));
  }
  safeStorage.set("dataVersion", serverVersion);
}
