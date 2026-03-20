import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbz9Zme-RquoB2GVh6yj9v9Yl2xFAq2JKO5RnM_Cm5-EYgEQV6CWsD5H4ai3ZtmKiq4U/exec";
const API_TOKEN = "queseyo_calendriobecados2026";
const SHEET_ID  = "10rsV7iRYehwWIyZGG6neEr1-kXUWFjya_ZZLnqUVKYk";
// Nombres exactos de las hojas en el Spreadsheet
const SHEET_NAMES = {
  rotaciones: "Rotaciones",
  dia:        "Dia",
  noche:      "Noche",
  seminarios: "Seminarios",
  horarios: {
    H:   "Horario Hombro",
    M:   "Horario Mano",
    CyP: "Horario Cadera",
    R:   "Horario Rodilla",
    TyP: "Horario TyP",
    Col: "Horario Columna",
  },
};

// ── Temas ─────────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:       "#0D1117",
    surface:  "#161B22",
    surface2: "#1C2333",
    border:   "#2D3748",
    text:     "#E6EDF3",
    sub:      "#8B949E",
    muted:    "#484F58",
    tabBg:    "rgba(13,17,23,0.88)",
    skeleton: "#1C2333",
    skeletonShine: "#2D3748",
  },
  light: {
    bg:       "#F4F7FB",
    surface:  "#FFFFFF",
    surface2: "#EEF2F8",
    border:   "#DDE3EE",
    text:     "#0F172A",
    sub:      "#4A5568",
    muted:    "#94A3B8",
    tabBg:    "rgba(244,247,251,0.92)",
    skeleton: "#E8EDF5",
    skeletonShine: "#F4F7FB",
  },
  pink: {
    bg:"#FEE6F2", surface:"#FFF0F8", surface2:"#FCDAED", border:"#F4A8CE",
    text:"#1E0713", sub:"#8B1A4A", muted:"#CF6A9C", tabBg:"rgba(254,230,242,0.96)",
    skeleton:"#FCDAED", skeletonShine:"#FFF0F8", accent:"#E8186A", glow:"#E8186A",
  },
  ocean: {
    bg:"#04080F", surface:"#071424", surface2:"#0A1C32", border:"#0E3050",
    text:"#C8EEFF", sub:"#4A9CC4", muted:"#1A4060", tabBg:"rgba(4,8,15,0.95)",
    skeleton:"#0A1C32", skeletonShine:"#0E2442", accent:"#00C8FF", glow:"#00C8FF",
  },
  sunset: {
    bg:"#0F0500", surface:"#1C0A05", surface2:"#271108", border:"#3D1A0C",
    text:"#FFE8CC", sub:"#C06830", muted:"#6A2E10", tabBg:"rgba(15,5,0,0.95)",
    skeleton:"#271108", skeletonShine:"#341608", accent:"#FF5500", glow:"#FF5500",
  },
  forest: {
    bg:"#020A04", surface:"#071510", surface2:"#0A1E14", border:"#123520",
    text:"#C8F0D4", sub:"#3A8A52", muted:"#184C28", tabBg:"rgba(2,10,4,0.95)",
    skeleton:"#0A1E14", skeletonShine:"#0E281C", accent:"#22D45A", glow:"#22D45A",
  },
  aurora: {
    bg:"#020510", surface:"#060B1C", surface2:"#0A1028", border:"#101830",
    text:"#DDE8FF", sub:"#607CC4", muted:"#20304A", tabBg:"rgba(2,5,16,0.95)",
    skeleton:"#0A1028", skeletonShine:"#0E1638", accent:"#8A5CF6", glow:"#8A5CF6",
  },
  neon: {
    bg:"#03000A", surface:"#080018", surface2:"#0D0024", border:"#1E0040",
    text:"#F0E6FF", sub:"#9050E0", muted:"#3A1060", tabBg:"rgba(3,0,10,0.96)",
    skeleton:"#0D0024", skeletonShine:"#140030", accent:"#CC00FF", glow:"#CC00FF",
  },
  synthwave: {
    bg:"#0A0015", surface:"#130028", surface2:"#1C0038", border:"#3D0070",
    text:"#FFE8FF", sub:"#D070E0", muted:"#6A2080", tabBg:"rgba(10,0,21,0.95)",
    skeleton:"#1C0038", skeletonShine:"#260050", accent:"#FF006E", glow:"#FF006E",
  },
  cryo: {
    bg:"#020D1A", surface:"#061828", surface2:"#0A2438", border:"#103858",
    text:"#E8F8FF", sub:"#60C8E8", muted:"#1A4860", tabBg:"rgba(2,13,26,0.95)",
    skeleton:"#0A2438", skeletonShine:"#0E2E48", accent:"#00CFFF", glow:"#00CFFF",
  },
  cosmos: {
    bg:"#020008", surface:"#080018", surface2:"#0E0028", border:"#220048",
    text:"#F8E8FF", sub:"#C060F0", muted:"#501880", tabBg:"rgba(2,0,8,0.96)",
    skeleton:"#0E0028", skeletonShine:"#160038", accent:"#FF6BF5", glow:"#FF6BF5",
  },
  tormenta: {
    bg:"#04060E", surface:"#0A1020", surface2:"#0E1830", border:"#152040",
    text:"#E0EAFF", sub:"#5080B0", muted:"#1A3050", tabBg:"rgba(4,6,14,0.95)",
    skeleton:"#0E1830", skeletonShine:"#152848", accent:"#00E5FF", glow:"#00E5FF",
  },
};
const THEME_BG = {
  dark:"#0D1117", light:"#F4F7FB", pink:"#FEE6F2",
  ocean:"#04080F", sunset:"#0F0500", forest:"#020A04", aurora:"#020510", neon:"#03000A",
  synthwave:"#0A0015", cryo:"#020D1A", cosmos:"#020008", tormenta:"#04060E",
};

// ── Colores institucionales por rotación ──────────────────────────────────────
const ROT = {
  H:   { accent:"#FB923C", glow:"#FB923C28", light:"#FB923C12", dark:"#FB923C22", name:"Hombro" },
  M:   { accent:"#F87171", glow:"#F8717128", light:"#F8717112", dark:"#F8717122", name:"Mano" },
  CyP: { accent:"#348FFF", glow:"#348FFF28", light:"#348FFF12", dark:"#348FFF22", name:"Cadera" },
  R:   { accent:"#FBBF24", glow:"#FBBF2428", light:"#FBBF2412", dark:"#FBBF2422", name:"Rodilla" },
  TyP: { accent:"#13C045", glow:"#13C04528", light:"#13C04512", dark:"#13C04522", name:"Tobillo y Pie" },
  Col: { accent:"#8B73FF", glow:"#8B73FF28", light:"#8B73FF12", dark:"#8B73FF22", name:"Columna" },
  I:   { accent:"#F472B6", glow:"#F472B628", light:"#F472B612", dark:"#F472B622", name:"Infantil" },
  A:   { accent:"#E2E8F0", glow:"#E2E8F028", light:"#E2E8F012", dark:"#E2E8F022", name:"Anestesia" },
  rx:  { accent:"#64748B", glow:"#64748B28", light:"#64748B12", dark:"#64748B22", name:"Radiología" },
  F:   { accent:"#94A3B8", glow:"#94A3B828", light:"#94A3B812", dark:"#94A3B822", name:"Fisiatría" },
  V:   { accent:"#334155", glow:"#33415528", light:"#33415512", dark:"#33415522", name:"Vacaciones" },
 CPQ:  { accent:"#D2A679", glow:"#D2A67933", light:"#D2A6791A", dark:"#D2A67926", name:"Vacaciones" },
  "":  { accent:"#64748B", glow:"#64748B28", light:"#64748B12", dark:"#64748B22", name:"Sin rotación" },
};
const ROT_ORDER = ["H","M","CyP","R","TyP","Col","I","A","rx","F","V","CPQ",""];

const YEAR_COLORS = ["#8B73FF","#13C045","#348FFF"];
const YEAR_LABELS = ["3er año","2do año","1er año"];

function rot(code) { return ROT[code] || ROT[""]; }

// ── Utilidades de fecha ───────────────────────────────────────────────────────
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function offsetDate(iso, days) {
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y,m-1,d+days);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}
function formatDate(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"});
}
function getWeekDates(refISO) {
  const [y,m,d] = refISO.split("-").map(Number);
  const ref = new Date(y,m-1,d);
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({length:7},(_,i)=>{
    const dt = new Date(monday);
    dt.setDate(monday.getDate()+i);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  });
}
function weekLabel(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"short",day:"numeric"});
}
function weekRangeLabel(dates) {
  const [y1,m1,d1] = dates[0].split("-").map(Number);
  const [y2,m2,d2] = dates[6].split("-").map(Number);
  const from = new Date(y1,m1-1,d1).toLocaleDateString("es-CL",{day:"numeric",month:"short"});
  const to   = new Date(y2,m2-1,d2).toLocaleDateString("es-CL",{day:"numeric",month:"short"});
  return `${from} – ${to}`;
}

// ── safeStorage — wrapper seguro para localStorage ───────────────────────────
const safeStorage = {
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

function purgeCacheStorage() {
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

// ── Caché inteligente con TTL largo ──────────────────────────────────────────
// Los datos cambian 1-2 veces al mes. Usamos TTL de 7 días para todo.
// Cuando tú editas el Sheet, el backend bumpa un "dataVersion" y el frontend
// lo detecta al abrir la app → limpia todo automáticamente.

const CACHE_7D = 7 * 24 * 60 * 60 * 1000;

function cacheTTL(params) {
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

function cacheKey(params) {
  return "cache:" + Object.entries(params).sort().map(([k,v])=>`${k}=${v}`).join("&");
}
function cacheGet(params) {
  try {
    const raw = safeStorage.get(cacheKey(params));
    if (!raw) return null;
    const { data, ts, ttl } = JSON.parse(raw);
    if (Date.now() - ts > (ttl || 30 * 60 * 1000)) { safeStorage.remove(cacheKey(params)); return null; }
    return data;
  } catch { return null; }
}
function cacheSet(params, data) {
  try {
    const ttl = cacheTTL(params);
    if (ttl <= 0) return;
    safeStorage.set(cacheKey(params), JSON.stringify({ data, ts: Date.now(), ttl }));
  } catch {}
}

// ── Demo mode ─────────────────────────────────────────────────────────────────
const DEMO_BECADO = "— Demo —";
const DEMO_MAP_NAMES = ["García","Muñoz","López","Rojas","Díaz","Torres","Soto","Herrera","Vargas","Núñez","Reyes","Mora"];
const DEMO_ROTATIONS = ["H","M","CyP","R","TyP","Col","H","M","CyP","R","TyP","Col","","",""];
const DEMO_ACTIVITIES = {
  H:   [["07:30","Pase de visita Hombro"],["08:30","Pabellón Artroscopía"],["12:00","Almuerzo"],["14:00","Policlínico Hombro"],["16:30","Revisión casos"]],
  M:   [["07:30","Pase de visita Mano"],["09:00","Pabellón Mano"],["12:00","Almuerzo"],["14:00","Policlínico Mano"],["16:00","Revisión radiológica"]],
  CyP: [["07:30","Pase de visita Cadera"],["08:00","Pabellón Cadera/Pelvis"],["12:30","Almuerzo"],["14:00","Policlínico Cadera"],["17:00","Fin de jornada"]],
  R:   [["07:30","Pase de visita Rodilla"],["08:30","Pabellón Artroscopía Rodilla"],["12:00","Almuerzo"],["14:00","Policlínico Rodilla"],["16:30","Lectura bibliográfica"]],
  TyP: [["07:30","Pase de visita Tobillo"],["09:00","Pabellón Tobillo y Pie"],["12:00","Almuerzo"],["14:00","Policlínico TyP"],["16:30","Fin de jornada"]],
  Col: [["07:30","Pase de visita Columna"],["08:00","Pabellón Columna"],["12:00","Almuerzo"],["14:00","Policlínico Columna"],["16:00","Revisión casos clínicos"]],
  "": [],
};

// Demo data generators for the map
function demoSummary(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  const dow = new Date(y,m-1,d).getDay();
  if (dow === 0 || dow === 6) return { ok:true, date:dateStr, groups:{"":[...DEMO_MAP_NAMES]} };
  const groups = {};
  DEMO_MAP_NAMES.forEach((name, i) => {
    const rotCode = DEMO_ROTATIONS[((d-1) + i * 2) % DEMO_ROTATIONS.length] || "";
    if (!groups[rotCode]) groups[rotCode] = [];
    groups[rotCode].push(name);
  });
  return { ok:true, date:dateStr, groups };
}

function demoMonthly(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const TURNO_PATTERNS = [
    [null,"P",null,"A","D",null,"N"],
    [null,null,"D",null,"N",null,"P"],
    ["A",null,"N",null,null,"P",null],
    [null,"D",null,"P",null,"A","N"],
  ];
  const entries = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dow = new Date(y, m-1, d).getDay();
    if (dow === 0 || dow === 6) continue;
    DEMO_MAP_NAMES.forEach((name, ni) => {
      const pat = TURNO_PATTERNS[ni % TURNO_PATTERNS.length];
      const turno = pat[(d-1) % pat.length];
      if (turno === "P") entries.push({ date:iso, name, type:"P" });
      if (turno === "D") entries.push({ date:iso, name, type:"D" });
      if (turno === "N") entries.push({ date:iso, name, type:"N" });
      if (turno === "A") entries.push({ date:iso, name, type:"A" });
    });
  }
  return { ok:true, month:monthStr, entries };
}

function demoDaily(dateStr) {
  const dow = new Date(dateStr).getDay();
  const d   = Number(dateStr.split("-")[2]);
  if (dow === 0 || dow === 6) return { ok:true, becado:DEMO_BECADO, date:dateStr, rotationCode:"", rotationName:"", items:[] };
  const rotCode = DEMO_ROTATIONS[(d - 1) % DEMO_ROTATIONS.length];
  const rotInfo = ROT[rotCode] || ROT[""];
  const acts = DEMO_ACTIVITIES[rotCode] || [];
  return {
    ok: true, becado: DEMO_BECADO, date: dateStr,
    rotationCode: rotCode, rotationName: rotInfo.name,
    items: acts.map(([time, activity]) => ({ time, activity })),
  };
}

function demoPersonalMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const TURNO_SEQ = [null,"P",null,"A","D",null,"N",null,null,"P","A",null,"D",null,"N",null,"P",null,"A",null,"D",null,"N",null,null,"P",null,"A","D",null,null];
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d   = i + 1;
    const iso = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dow = new Date(y, m-1, d).getDay();
    const rotCode = (dow === 0 || dow === 6) ? "" : DEMO_ROTATIONS[(d-1) % DEMO_ROTATIONS.length];
    const turno   = (dow === 0 || dow === 6) ? null : TURNO_SEQ[i % TURNO_SEQ.length];
    return {
      date: iso, rotationCode: rotCode,
      diaCode:   turno === "P" ? "P" : turno === "D" ? "D" : null,
      nocheCode: turno === "N" ? "N" : null,
      artroCode: turno === "A" ? "A" : null,
      hasSeminar: false,
    };
  });
  return { ok:true, becado:DEMO_BECADO, month:monthStr, days };
}

// ── API ───────────────────────────────────────────────────────────────────────
async function apiGet(params) {
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

const _revalidatedThisSession = new Set();

function cacheAge(params) {
  try {
    const raw = safeStorage.get(cacheKey(params));
    if (!raw) return Infinity;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts;
  } catch { return Infinity; }
}

// Con TTL de 7 días + version check, la revalidación en background es menos urgente.
// Solo revalidar si el caché tiene más de 1 hora (por si el version check no corrió aún)
const SWR_REVALIDATE_AFTER = 60 * 60 * 1000; // 1 hora

async function apiSWR(params, onImmediate, onFresh) {
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

function prefetch(params) {
  if (cacheGet(params)) return;
  apiGet(params)
    .then(d => { if (d.ok !== false) cacheSet(params, d); })
    .catch(() => {});
}

function prefetchWeek(becado, mondayISO) {
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
let _versionChecked = false;

function checkDataVersion() {
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

// ── Agrupar items por actividad contigua ──────────────────────────────────────
function t2m(t) { if(!t)return 0; const[h,m]=t.split(":").map(Number); return h*60+(m||0); }
function m2t(m) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }
function groupItems(items) {
  if(!items?.length) return [];
  const out=[]; let cur=null;
  for(const it of items){
    if(cur&&cur.activity===it.activity){ cur.end=t2m(it.time)+59; }
    else{ if(cur)out.push(cur); cur={activity:it.activity,start:t2m(it.time),end:t2m(it.time)+59}; }
  }
  if(cur)out.push(cur);
  return out.map(g=>({activity:g.activity,from:m2t(g.start),to:m2t(g.end)}));
}

const INFANTIL_ITEMS = [
  { time:"08:00", activity:"Infantilizado" },
  { time:"09:00", activity:"Infantilizado" },
  { time:"10:00", activity:"Infantilizado" },
  { time:"11:00", activity:"Infantilizado" },
];

function resolveItems(rotationCode, items, dateISO) {
  if (rotationCode === "I" && !items?.length) {
    const [y,m,d] = dateISO.split("-").map(Number);
    const dow = new Date(y,m-1,d).getDay();
    return (dow === 0 || dow === 6) ? [] : INFANTIL_ITEMS;
  }
  return items || [];
}

// ── CSS global ────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --sat: env(safe-area-inset-top, 0px); --sab: env(safe-area-inset-bottom, 0px); }
  html, body { background: #0D1117; height: 100%; overflow: hidden; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { overscroll-behavior-y: contain; touch-action: manipulation; }
  #root { height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes doctorWalk { from{background-position-x:0} to{background-position-x:-400%} }
  @keyframes petalFall {
    0%   { transform: translateY(-30px) rotate(0deg) scale(1.1); opacity: 0; }
    8%   { opacity: 1; }
    85%  { opacity: 0.7; }
    100% { transform: translateY(108vh) rotate(680deg) scale(0.6); opacity: 0; }
  }
  @keyframes petalSway {
    0%   { margin-left: 0px; }
    20%  { margin-left: 22px; }
    50%  { margin-left: -8px; }
    75%  { margin-left: 26px; }
    100% { margin-left: 0px; }
  }
  @keyframes sakuraGlow {
    0%,100% { opacity: 0.6; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.08); }
  }
  @keyframes pinkPulse {
    0%,100% { box-shadow: 0 0 0 0 #E8186A00; }
    50%     { box-shadow: 0 0 16px 4px #E8186A30; }
  }
  .anim  { animation: fadeUp 0.28s ease both; }
  .fade  { animation: fadeIn 0.2s ease both; }
  .tab-in { animation: tabFadeIn 0.18s ease both; }
  @keyframes tabFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  .press { transition: transform 0.1s, opacity 0.1s; -webkit-tap-highlight-color: transparent; cursor: pointer; user-select: none; }
  .press:active { transform: scale(0.96); opacity: 0.82; }
  ::-webkit-scrollbar { width: 0; }
  .theme-pink .sakura-font { font-family: 'Georgia', 'Palatino', serif !important; }
  .petal {
    position: fixed; pointer-events: none; z-index: 999;
    animation: petalFall linear infinite, petalSway ease-in-out infinite;
    user-select: none;
    will-change: transform;
    backface-visibility: hidden;
  }
  @keyframes bubbleRise {
    0%   { transform: translateY(0) scale(1); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
  }
  @keyframes bubbleSway {
    0%,100% { margin-left: 0px; }
    33%     { margin-left: 18px; }
    66%     { margin-left: -12px; }
  }
  @keyframes auroraShift1 {
    0%   { transform: translate(0%,0%) scale(1); }
    100% { transform: translate(8%,12%) scale(1.2); }
  }
  @keyframes auroraShift2 {
    0%   { transform: translate(0%,0%) scale(1.1); }
    100% { transform: translate(-10%,8%) scale(0.9); }
  }
  @keyframes auroraShift3 {
    0%   { transform: translate(0%,0%) scale(0.9); }
    100% { transform: translate(6%,-10%) scale(1.15); }
  }
  @keyframes fireflyFloat {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.15; }
    25%     { transform: translate(12px,-18px) scale(1.3); opacity: 0.9; }
    50%     { transform: translate(-8px,-8px) scale(0.8); opacity: 0.5; }
    75%     { transform: translate(16px,-24px) scale(1.1); opacity: 0.8; }
  }
  @keyframes emberRise {
    0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
    10%  { opacity: 1; }
    80%  { opacity: 0.6; }
    100% { transform: translateY(-90vh) scale(0.2) rotate(360deg); opacity: 0; }
  }
  @keyframes neonPulseA {
    0%,100% { opacity: 0.6; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.15); }
  }
  @keyframes neonPulseB {
    0%,100% { opacity: 0.4; transform: scale(1.1); }
    50%     { opacity: 0.9; transform: scale(0.9); }
  }
  @keyframes popIn {
    0%   { opacity:0; transform: translate(-50%,-50%) scale(0.88); }
    100% { opacity:1; transform: translate(-50%,-50%) scale(1); }
  }
  @keyframes rainFall {
    0%   { transform: translateY(-5vh) translateX(0px); opacity: 0; }
    8%   { opacity: 1; }
    85%  { opacity: 0.6; }
    100% { transform: translateY(112vh) translateX(-20px); opacity: 0; }
  }
  @keyframes lightningFlashA {
    0%,93%,100% { opacity: 0; }
    94%   { opacity: 0.85; }
    95%   { opacity: 0; }
    95.5% { opacity: 0.5; }
    96.5% { opacity: 0; }
  }
  @keyframes lightningFlashB {
    0%,91%,100% { opacity: 0; }
    92%   { opacity: 0.7; }
    92.8% { opacity: 0; }
    93.2% { opacity: 0.45; }
    94%   { opacity: 0; }
  }
  @keyframes lightningFlashC {
    0%,88%,100% { opacity: 0; }
    89%   { opacity: 0.6; }
    89.5% { opacity: 0.1; }
    90%   { opacity: 0.75; }
    90.8% { opacity: 0; }
  }
  @keyframes boltStrike {
    0%,92%,100% { opacity: 0; transform: scaleY(0.7); }
    93%   { opacity: 1; transform: scaleY(1); }
    94%   { opacity: 0.15; transform: scaleY(1); }
    94.5% { opacity: 0.8; transform: scaleY(1.02); }
    96%   { opacity: 0; transform: scaleY(1); }
  }
  @keyframes cloudDrift1 {
    0%   { transform: translateX(-8%) scaleX(1); }
    100% { transform: translateX(8%) scaleX(1.05); }
  }
  @keyframes cloudDrift2 {
    0%   { transform: translateX(6%); }
    100% { transform: translateX(-10%); }
  }
  @keyframes windGust {
    0%,100% { transform: rotate(4deg); }
    40%     { transform: rotate(8deg); }
    70%     { transform: rotate(2deg); }
  }
  @keyframes gridScroll {
    0%   { background-position: 0 0; }
    100% { background-position: 0 80px; }
  }
  @keyframes sunSink {
    0%   { transform: translateX(-50%) translateY(0); }
    100% { transform: translateX(-50%) translateY(12px); }
  }
  @keyframes starPop {
    0%,100% { opacity: 0.3; transform: scale(1); }
    50%     { opacity: 1; transform: scale(1.5); }
  }
  @keyframes glitchJolt {
    0%,90%,100% { transform: translateX(0); clip-path: inset(0); }
    92%  { transform: translateX(-8px); clip-path: inset(10% 0 80% 0); }
    93%  { transform: translateX(12px); clip-path: inset(40% 0 30% 0); }
    94%  { transform: translateX(-4px); clip-path: inset(70% 0 5% 0); }
    95%  { transform: translateX(0); clip-path: inset(0); }
  }
  @keyframes glitchJoltB {
    0%,85%,100% { transform: translateX(0); clip-path: inset(0); }
    87%  { transform: translateX(10px); clip-path: inset(5% 0 70% 0); }
    88%  { transform: translateX(-14px); clip-path: inset(45% 0 25% 0); }
    89%  { transform: translateX(6px); clip-path: inset(75% 0 10% 0); }
    90%  { transform: translateX(0); clip-path: inset(0); }
  }
  @keyframes corruptBlock {
    0%,88%,96%,100% { opacity: 0; }
    90% { opacity: 0.8; }
    92% { opacity: 0.15; }
    93% { opacity: 0.65; }
    95% { opacity: 0; }
  }
  @keyframes corruptBlockB {
    0%,82%,92%,100% { opacity: 0; }
    84% { opacity: 0.7; }
    86% { opacity: 0; }
    87% { opacity: 0.55; }
    90% { opacity: 0; }
  }
  @keyframes scanlineFlicker {
    0%   { opacity: 0.04; }
    50%  { opacity: 0.08; }
    100% { opacity: 0.04; }
  }
  @keyframes neonFlicker {
    0%,100% { opacity: 1; }
    92%     { opacity: 1; }
    93%     { opacity: 0.2; }
    94%     { opacity: 0.9; }
    95%     { opacity: 0.1; }
    96%     { opacity: 1; }
  }
`;


// ── Sakura petals SVG ────────────────────────────────────────────────────────
// ✦ OPTIMIZADO: drop-shadow removido del SVG, glow via box-shadow en padre
function PetalSVG({ size, color, opacity }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:"block"}}>
      <path d="M12 2 C14 5, 19 6, 20 10 C21 14, 18 19, 12 22 C6 19, 3 14, 4 10 C5 6, 10 5, 12 2Z"
        fill={color} opacity={opacity}/>
      <path d="M12 2 C12 8, 14 14, 12 22" stroke="white" strokeWidth="0.4" opacity="0.35" fill="none"/>
    </svg>
  );
}

const PETAL_COLORS = [
  "#FF4D94","#FF69B4","#FF1A75","#FF85B8","#E8186A",
  "#FF3380","#FFB3D1","#F50057","#FF6BA8","#FF0066",
];

const PETALS_CONFIG = Array.from({length: 18}, (_, i) => ({
  id: i,
  left:     (i * 5.8 + Math.sin(i * 2.3) * 8),
  size:     14 + (i % 5) * 5,
  duration: 5 + (i % 6) * 1.8,
  swayDur:  2 + (i % 5) * 0.9,
  delay:    -(i * 0.75 + (i % 4) * 1.1),
  color:    PETAL_COLORS[i % PETAL_COLORS.length],
  opacity:  0.55 + (i % 4) * 0.12,
  rotate:   i * 37,
}));

// ✦ OPTIMIZADO: blur→gradiente más ancho, glow via box-shadow en petal div
function SakuraPetals() {
  return (
    <>
      <div style={{position:"fixed",top:-120,left:-120,width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle, #FF4D9440 0%, transparent 50%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:-100,right:-100,width:340,height:340,borderRadius:"50%",background:"radial-gradient(circle, #E8186A30 0%, transparent 50%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:40,right:-80,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle, #FF69B428 0%, transparent 50%)",pointerEvents:"none",zIndex:0}}/>
      {PETALS_CONFIG.map(p => (
        <div key={p.id} className="petal" style={{
          left: `${p.left}%`,
          top: 0,
          width: p.size,
          height: p.size,
          animationDuration: `${p.duration}s, ${p.swayDur}s`,
          animationDelay: `${p.delay}s, ${p.delay * 0.6}s`,
          transform: `rotate(${p.rotate}deg)`,
          boxShadow: `0 0 ${p.size*0.5}px ${p.color}70`,
        }}>
          <PetalSVG size={p.size} color={p.color} opacity={p.opacity}/>
        </div>
      ))}
    </>
  );
}

// ── Efectos ambientales por tema ─────────────────────────────────────────────
// ✦ OPTIMIZADOS: filter:blur→gradientes más anchos, box-shadow dobles→simples,
//   will-change+backfaceVisibility en partículas, contain en wrappers,
//   conteo reducido donde no se nota

function OceanBubbles() {
  const bubbles = Array.from({length:22},(_,i)=>({
    id:i,
    size: i%4===0 ? 18+Math.sin(i)*8 : i%3===0 ? 10+Math.cos(i)*4 : 3+Math.sin(i*1.7)*3,
    x: 4+i*4.2+Math.cos(i*0.8)*12,
    dur: i%4===0 ? 14+Math.sin(i)*4 : 6+Math.sin(i)*3,
    delay: -(i*0.7),
    swayDur: 3+Math.cos(i*1.3)*1.5,
    opacity: i%4===0 ? 0.15 : i%3===0 ? 0.25 : 0.45,
  }));
  const rays = Array.from({length:5},(_,i)=>({
    id:i, x:10+i*18, rot:-15+i*6, dur:8+i*2.5, delay:-(i*1.8),
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(to bottom, #001830 0%, #04080F 40%, #001025 100%)",
        opacity:0.6}}/>
      {rays.map(r=>(
        <div key={r.id} style={{
          position:"absolute",top:-60,left:`${r.x}%`,
          width:44,height:"70%",
          background:`linear-gradient(to bottom, #00C8FF18, transparent)`,
          transform:`rotate(${r.rot}deg)`,
          transformOrigin:"top center",
          animation:`neonPulseA ${r.dur}s ${r.delay}s ease-in-out infinite`,
          willChange:"opacity,transform",
        }}/>
      ))}
      <div style={{position:"fixed",top:-80,left:"2%",width:600,height:600,borderRadius:"50%",
        background:"radial-gradient(circle, #00C8FF0D 0%, transparent 50%)",
        animation:"neonPulseA 12s ease-in-out infinite"}}/>
      <div style={{position:"fixed",bottom:-120,right:"-8%",width:540,height:540,borderRadius:"50%",
        background:"radial-gradient(circle, #0055FF0F 0%, transparent 50%)",
        animation:"neonPulseB 15s ease-in-out infinite"}}/>
      {bubbles.map(b=>(
        <div key={b.id} style={{
          position:"absolute",bottom:-20,left:`${b.x}%`,
          width:b.size,height:b.size,borderRadius:"50%",
          background:`radial-gradient(circle at 30% 25%, #00C8FF${Math.round(b.opacity*80).toString(16).padStart(2,"0")}, transparent 70%)`,
          border:`1px solid #00C8FF${Math.round(b.opacity*120).toString(16).padStart(2,"0")}`,
          boxShadow: b.size>12 ? `0 0 ${b.size}px #00C8FF20` : "none",
          animation:`bubbleRise ${b.dur}s ${b.delay}s infinite ease-in, bubbleSway ${b.swayDur}s ${b.delay*0.4}s infinite ease-in-out`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
    </div>
  );
}

// ✦ OPTIMIZADO: stars 40→30, blur→gradiente ancho en curtains
function AuroraEffect() {
  const stars = Array.from({length:30},(_,i)=>({
    id:i, x:Math.sin(i*137.5)*50+50, y:Math.cos(i*97.3)*40+20,
    size:Math.sin(i*1.7)*0.8+1.2, dur:2+Math.cos(i)*1.5, delay:-(i*0.3),
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {stars.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.size,height:s.size,borderRadius:"50%",
          background:"#C8D8FF",
          boxShadow:`0 0 ${s.size*3}px #8A5CF660`,
          animation:`neonPulseA ${s.dur}s ${s.delay}s ease-in-out infinite`,
          opacity:0.6,
          willChange:"opacity",
        }}/>
      ))}
      <div style={{position:"absolute",top:"-35%",left:"-25%",width:"90%",height:"75%",
        background:"radial-gradient(ellipse, #8A5CF630 0%, #4F46E514 35%, transparent 55%)",
        animation:"auroraShift1 12s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",top:"-5%",right:"-35%",width:"100%",height:"65%",
        background:"radial-gradient(ellipse, #06B6D422 0%, #0EA5E910 35%, transparent 55%)",
        animation:"auroraShift2 16s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",top:"15%",left:"-15%",width:"80%",height:"55%",
        background:"radial-gradient(ellipse, #22D45A18 0%, #4ADE8008 35%, transparent 55%)",
        animation:"auroraShift3 19s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",bottom:"-25%",right:"0%",width:"85%",height:"65%",
        background:"radial-gradient(ellipse, #C026D316 0%, #8A5CF608 40%, transparent 55%)",
        animation:"auroraShift1 22s 4s ease-in-out infinite alternate-reverse"}}/>
      <div style={{position:"absolute",inset:0,
        background:"radial-gradient(ellipse at 50% -10%, #8A5CF612, transparent 55%)"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"30%",
        background:"linear-gradient(to top, #020510, transparent)"}}/>
    </div>
  );
}

// ✦ OPTIMIZADO: blur→gradiente ancho en niebla/canopy, box-shadow simple en fireflies
function ForestFireflies() {
  const flies = Array.from({length:24},(_,i)=>({
    id:i,
    x: 3+i*3.8+Math.sin(i*2.1)*12,
    y: 10+Math.cos(i*1.8)*38,
    dur: 2.5+Math.sin(i)*2+1.5,
    delay: -(i*0.42),
    size: 1.5+Math.cos(i*1.3)*1.8+2,
    bright: i%5===0 ? 1 : i%3===0 ? 0.7 : 0.35,
    hue: i%7===0 ? "#AAFF70" : i%5===0 ? "#00FF88" : "#22D45A",
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,height:"25%",
        background:"linear-gradient(to bottom, #010602, transparent)"}}/>
      {[
        {bottom:"3%", opacity:0.18, dur:25, delay:0},
        {bottom:"10%", opacity:0.10, dur:32, delay:-8},
        {bottom:"18%", opacity:0.06, dur:40, delay:-15},
      ].map((m,i)=>(
        <div key={i} style={{
          position:"fixed",bottom:m.bottom,left:"-30%",right:"-30%",height:120,
          background:"radial-gradient(ellipse at 50% 100%, #22D45A14, transparent 55%)",
          opacity:m.opacity,
          animation:`auroraShift1 ${m.dur}s ${m.delay}s ease-in-out infinite alternate`,
        }}/>
      ))}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"40%",
        background:"linear-gradient(to top, #020A04 15%, transparent)"}}/>
      <div style={{position:"fixed",top:-80,left:"15%",width:560,height:450,
        background:"radial-gradient(ellipse, #22D45A0A, transparent 50%)",
        animation:"neonPulseA 18s ease-in-out infinite"}}/>
      {flies.map(f=>(
        <div key={f.id} style={{
          position:"absolute",left:`${f.x}%`,top:`${f.y}%`,
          width:f.size,height:f.size,borderRadius:"50%",
          background:f.hue,
          boxShadow:`0 0 ${f.size*6}px ${f.hue}${Math.round(f.bright*160).toString(16).padStart(2,"0")}`,
          opacity:f.bright,
          animation:`fireflyFloat ${f.dur}s ${f.delay}s ease-in-out infinite`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
    </div>
  );
}

// ✦ OPTIMIZADO: blur→gradiente ancho en glows, box-shadow simple en embers
function SunsetEmbers() {
  const embers = Array.from({length:20},(_,i)=>({
    id:i,
    x: 2+i*4.8+Math.sin(i*1.9)*14,
    dur: 7+Math.cos(i)*4, delay:-(i*0.6),
    size: i%5===0 ? 4+Math.sin(i)*2 : 1.2+Math.sin(i*1.4)*1.5,
    color: i%4===0 ? "#FFDD00" : i%3===0 ? "#FFAA40" : "#FF5500",
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(to bottom, #200800 0%, #0F0500 35%, transparent 65%)",
        opacity:0.7}}/>
      <div style={{position:"fixed",bottom:"12%",left:"-15%",right:"-15%",height:180,
        background:"radial-gradient(ellipse at 50% 100%, #FF3300 0%, #FF550030 30%, transparent 55%)",
        animation:"neonPulseA 4s ease-in-out infinite"}}/>
      <div style={{position:"fixed",top:"-25%",left:"5%",right:"5%",height:"65%",
        background:"radial-gradient(ellipse at 50% 0%, #FF220018 0%, #FF550008 30%, transparent 55%)",
        animation:"neonPulseB 6s ease-in-out infinite"}}/>
      <div style={{position:"fixed",top:0,left:0,width:"20%",height:"100%",
        background:"linear-gradient(to right, #FF220010, transparent)"}}/>
      <div style={{position:"fixed",top:0,right:0,width:"20%",height:"100%",
        background:"linear-gradient(to left, #FF220010, transparent)"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"45%",
        background:"linear-gradient(to top, #0F0500 20%, transparent)"}}/>
      {embers.map(e=>(
        <div key={e.id} style={{
          position:"absolute",bottom:-10,left:`${e.x}%`,
          width:e.size,height:e.size*(1.2+Math.sin(e.id)*0.6),borderRadius:"50% 50% 40% 40%",
          background:`radial-gradient(circle at 40% 30%, #FFEE80, ${e.color})`,
          boxShadow:`0 0 ${e.size*6}px ${e.color}80`,
          animation:`emberRise ${e.dur}s ${e.delay}s infinite ease-out`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
    </div>
  );
}

// ✦ GLITCH V2 — Aggressive digital corruption: displacement jolts, data blocks,
//   heavy scanlines, flickering neon orbs, chaotic not clean
function NeonGrid() {
  // Grid lines — kept but made more visible
  const hLines = [12, 28, 44, 58, 72, 86];
  const vLines = [15, 30, 50, 70, 85];
  // Corruption blocks — rectangles that flash like broken VRAM
  const corruptBlocks = [
    { x:"5%",  y:"12%", w:120, h:8,  dur:7,  delay:0,    anim:"corruptBlock" },
    { x:"55%", y:"35%", w:80,  h:12, dur:11, delay:-3,   anim:"corruptBlockB" },
    { x:"20%", y:"62%", w:140, h:6,  dur:9,  delay:-5,   anim:"corruptBlock" },
    { x:"65%", y:"78%", w:100, h:10, dur:13, delay:-8,   anim:"corruptBlockB" },
    { x:"10%", y:"48%", w:60,  h:14, dur:8,  delay:-2,   anim:"corruptBlock" },
    { x:"72%", y:"18%", w:90,  h:7,  dur:15, delay:-6,   anim:"corruptBlockB" },
    { x:"38%", y:"88%", w:110, h:5,  dur:10, delay:-4,   anim:"corruptBlock" },
  ];
  // Pixel clusters — tiny squares like dead pixels
  const pixels = Array.from({length:16},(_,i)=>({
    id:i,
    x: Math.sin(i*137.5)*45+50,
    y: Math.cos(i*97.3)*40+45,
    size: 2+Math.sin(i*2.3)*2,
    dur: 6+Math.cos(i)*4,
    delay: -(i*0.6),
    color: i%4===0?"#FF00FF":i%3===0?"#00FFFF":i%2===0?"#CC00FF":"#FFFFFF",
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {/* Heavy scanlines — actually visible */}
      <div style={{position:"absolute",inset:0,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 3px)",
        animation:"scanlineFlicker 3s ease-in-out infinite",
        pointerEvents:"none"}}/>

      {/* Tron horizontal grid lines — brighter */}
      {hLines.map((t,i)=>(
        <div key={`h${i}`} style={{
          position:"fixed",top:`${t}%`,left:0,right:0,height:1,
          background:`linear-gradient(90deg, transparent 3%, #CC00FF${i%2===0?"38":"20"} 50%, transparent 97%)`,
          animation:`neonPulseB ${4+i*1.2}s ${-i*1.5}s ease-in-out infinite`,
        }}/>
      ))}
      {/* Tron vertical grid lines */}
      {vLines.map((l,i)=>(
        <div key={`v${i}`} style={{
          position:"fixed",left:`${l}%`,top:0,bottom:0,width:1,
          background:`linear-gradient(180deg, transparent 3%, #FF00FF18 50%, transparent 97%)`,
          animation:`neonPulseA ${6+i*1.5}s ${-i*1.3}s ease-in-out infinite`,
        }}/>
      ))}

      {/* ═══ GLITCH DISPLACEMENT LAYERS ═══ */}
      {/* Full-screen copies of the glow shifted horizontally — creates the "broken screen" look */}
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 35% 25%, #CC00FF25, transparent 50%)",
        animation:"glitchJolt 7s linear infinite",
        willChange:"transform",
      }}/>
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 65% 70%, #00FFFF18, transparent 50%)",
        animation:"glitchJoltB 11s linear infinite",
        willChange:"transform",
      }}/>

      {/* ═══ CORRUPTION BLOCKS ═══ */}
      {/* VRAM-corruption rectangles that flash in and out */}
      {corruptBlocks.map((b,i)=>(
        <div key={`cb${i}`} style={{
          position:"fixed",left:b.x,top:b.y,
          width:b.w,height:b.h,
          background:`linear-gradient(90deg, #CC00FF${i%2===0?"50":"35"}, #FF00FF30, #00FFFF${i%3===0?"40":"20"}, transparent)`,
          animation:`${b.anim} ${b.dur}s ${b.delay}s linear infinite`,
          opacity:0,
        }}/>
      ))}

      {/* ═══ DEAD PIXEL CLUSTERS ═══ */}
      {pixels.map(p=>(
        <div key={`px${p.id}`} style={{
          position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
          width:p.size,height:p.size,
          background:p.color,
          boxShadow:`0 0 ${p.size*3}px ${p.color}80`,
          animation:`corruptBlock ${p.dur}s ${p.delay}s linear infinite`,
          opacity:0,
        }}/>
      ))}

      {/* ═══ NEON GLOW ORBS — with flicker ═══ */}
      <div style={{position:"fixed",top:"5%",left:"-12%",width:480,height:480,borderRadius:"50%",
        background:"radial-gradient(circle, #CC00FF22, transparent 50%)",
        animation:"neonPulseA 6s ease-in-out infinite, neonFlicker 7s linear infinite"}}/>
      <div style={{position:"fixed",bottom:"8%",right:"-15%",width:540,height:540,borderRadius:"50%",
        background:"radial-gradient(circle, #FF00FF1A, transparent 50%)",
        animation:"neonPulseB 8s ease-in-out infinite, neonFlicker 11s linear infinite"}}/>
      <div style={{position:"fixed",top:"40%",left:"32%",width:280,height:280,borderRadius:"50%",
        background:"radial-gradient(circle, #7700FF18, transparent 50%)",
        animation:"neonPulseA 10s 2s ease-in-out infinite reverse"}}/>
      {/* Cyan accent — flickers independently */}
      <div style={{position:"fixed",top:"58%",left:"-6%",width:320,height:320,borderRadius:"50%",
        background:"radial-gradient(circle, #00FFFF10, transparent 50%)",
        animation:"neonPulseB 13s 1s ease-in-out infinite, neonFlicker 13s 3s linear infinite"}}/>

      {/* Corner flare */}
      <div style={{position:"fixed",top:-30,right:-30,width:260,height:260,
        background:"radial-gradient(circle at 100% 0%, #CC00FF1A, transparent 50%)"}}/>

      {/* RGB split line — a signature horizontal neon strip that jolts */}
      <div style={{
        position:"fixed",top:"50%",left:0,right:0,height:2,
        background:"linear-gradient(90deg, transparent, #FF00FF80, #00FFFF60, #FF00FF80, transparent)",
        boxShadow:"0 0 12px #FF00FF, 0 -1px 0 #00FFFF, 0 1px 0 #FF006E",
        animation:"glitchJolt 7s linear infinite",
      }}/>
    </div>
  );
}

// ✦ SYNTHWAVE V2 — Sliced venetian-blind sun sinking, perspective grid scrolling,
//   scattered stars, sun reflection on the ground, rich atmospheric glow
function SynthwaveEffect() {
  // Perspective grid — horizontal lines get closer together toward horizon
  // Simulating depth: lines at 52%, 56%, 60%, 64%, 68%, 73%, 78%, 84%, 91%, 98%
  const gridH = [52,55,58,62,66,71,77,83,90,97];
  // Vertical lines converging to center vanishing point
  const gridV = Array.from({length:12},(_,i)=>{
    const spread = (i - 5.5) / 5.5; // -1 to +1
    return { left: 50 + spread * 48, skew: -spread * 12 };
  });
  // Stars — scattered in the sky (top half)
  const stars = Array.from({length:20},(_,i)=>({
    id:i,
    x: Math.sin(i*137.5)*45+50,
    y: Math.cos(i*97.3)*20+12,
    size: i%6===0 ? 2.5 : i%3===0 ? 1.8 : 1,
    dur: 1.5+Math.cos(i)*1,
    delay: -(i*0.35),
  }));
  // Sun slices — 5 horizontal gaps cut through the sun
  const sunSlices = [22,34,46,58,70]; // percentage positions within the sun

  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {/* Sky gradient — deep purple → magenta at horizon */}
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(to bottom, #06001A 0%, #12002A 30%, #2D0050 48%, #0A0015 100%)",
        opacity:0.9}}/>

      {/* ═══ STARS ═══ */}
      {stars.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.size,height:s.size,borderRadius:"50%",
          background:"#FFFFFF",
          boxShadow:`0 0 ${s.size*3}px #FFFFFF80`,
          animation:`starPop ${s.dur}s ${s.delay}s ease-in-out infinite`,
          opacity:0.3,
          willChange:"opacity",
        }}/>
      ))}

      {/* ═══ SUN — sliced venetian-blind style ═══ */}
      {/* Sun body */}
      <div style={{
        position:"fixed",top:"28%",left:"50%",
        width:130,height:130,borderRadius:"50%",
        background:"linear-gradient(to bottom, #FF006E 0%, #FF4800 35%, #FF8C00 60%, #FFD700 100%)",
        boxShadow:"0 0 50px #FF006E90, 0 0 100px #FF006E50, 0 0 150px #FF480030",
        transform:"translateX(-50%)",
        animation:"sunSink 30s ease-in-out infinite alternate, neonPulseA 4s ease-in-out infinite",
        overflow:"hidden",
      }}>
        {/* Venetian blind slices — horizontal black bars across the sun */}
        {sunSlices.map((pct,i)=>(
          <div key={i} style={{
            position:"absolute",left:0,right:0,top:`${pct}%`,height: i%2===0 ? 4 : 3,
            background:"#0A0015",
            opacity:0.7 + (i*0.05),
          }}/>
        ))}
      </div>

      {/* Sun upper glow */}
      <div style={{position:"fixed",top:"18%",left:"30%",right:"30%",height:200,
        background:"radial-gradient(ellipse at 50% 80%, #FF006E30 0%, #FF480015 40%, transparent 70%)"}}/>

      {/* ═══ HORIZON LINE — bright neon strip ═══ */}
      <div style={{position:"fixed",top:"50%",left:"-10%",right:"-10%",height:3,
        background:"linear-gradient(90deg, transparent, #FF006E, #00F5FF, #FF006E, transparent)",
        boxShadow:"0 0 30px #FF006E, 0 0 60px #00F5FF60"}}/>

      {/* ═══ SUN REFLECTION below horizon ═══ */}
      <div style={{
        position:"fixed",top:"51%",left:"50%",transform:"translateX(-50%) scaleY(-0.5)",
        width:160,height:130,borderRadius:"50%",
        background:"radial-gradient(ellipse, #FF006E35 0%, #FF880020 40%, transparent 65%)",
        animation:"neonPulseB 4s ease-in-out infinite",
        opacity:0.6,
      }}/>
      {/* Reflection streak — elongated glow */}
      <div style={{position:"fixed",top:"52%",left:"35%",right:"35%",height:120,
        background:"radial-gradient(ellipse at 50% 0%, #FF006E20, #FF880010 40%, transparent 70%)",
        animation:"neonPulseA 5s ease-in-out infinite"}}/>

      {/* ═══ PERSPECTIVE GRID — FLOOR ═══ */}
      {/* Horizontal lines — spacing increases toward viewer (bottom) */}
      {gridH.map((t,i)=>{
        const proximity = i / gridH.length; // 0=far, 1=near
        const brightness = Math.round(20 + proximity * 50);
        const alpha = Math.round(proximity * 80 + 20).toString(16).padStart(2,"0");
        return (
          <div key={`gh${i}`} style={{
            position:"fixed",top:`${t}%`,left:0,right:0,height:1,
            background:`linear-gradient(90deg, transparent 3%, #FF006E${alpha} 50%, transparent 97%)`,
            animation:`neonPulseA ${4+i*0.8}s ease-in-out infinite`,
            opacity: 0.3 + proximity * 0.6,
          }}/>
        );
      })}
      {/* Vertical lines — converge to vanishing point at horizon center */}
      {gridV.map((v,i)=>(
        <div key={`gv${i}`} style={{
          position:"fixed",
          left:`${v.left}%`,
          top:"50%",bottom:0,
          width:1,
          background:`linear-gradient(to bottom, #00F5FF50, #00F5FF20 40%, transparent)`,
          transform:`skewX(${v.skew}deg)`,
          transformOrigin:"top center",
          animation:`neonPulseB ${5+i*0.4}s ease-in-out infinite`,
          opacity:0.4,
        }}/>
      ))}

      {/* Grid scroll overlay — gives illusion of forward movement */}
      <div style={{
        position:"fixed",left:0,right:0,top:"50%",bottom:0,
        backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 38px, #00F5FF10 38px, #00F5FF10 40px)",
        backgroundSize:"100% 80px",
        animation:"gridScroll 3s linear infinite",
        opacity:0.4,
      }}/>

      {/* Atmospheric glow — top sky shimmer */}
      <div style={{position:"fixed",top:"-10%",left:"20%",right:"20%",height:250,
        background:"radial-gradient(ellipse, #FF006E18 0%, transparent 55%)"}}/>
      {/* Bottom floor glow */}
      <div style={{position:"fixed",bottom:"-5%",left:"5%",right:"5%",height:200,
        background:"radial-gradient(ellipse at 50% 100%, #00F5FF14 0%, transparent 55%)"}}/>
      {/* Side atmosphere */}
      <div style={{position:"fixed",top:"45%",left:"-5%",width:"30%",height:"30%",
        background:"radial-gradient(circle, #FF006E0A, transparent 60%)",
        animation:"neonPulseB 9s ease-in-out infinite"}}/>
      <div style={{position:"fixed",top:"45%",right:"-5%",width:"30%",height:"30%",
        background:"radial-gradient(circle, #00F5FF0A, transparent 60%)",
        animation:"neonPulseA 11s ease-in-out infinite"}}/>
    </div>
  );
}

// ✦ OPTIMIZADO: shards 28→20, flakes 40→25, blur→gradiente, box-shadow simple
function CryoEffect() {
  const shards = Array.from({length:20},(_,i)=>({
    id:i, x:2+i*4.8+Math.sin(i*2.7)*12, y:Math.cos(i*1.9)*45+45,
    w:4+Math.abs(Math.sin(i*1.3))*18, h:8+Math.abs(Math.cos(i*2.1))*32,
    rot:i*29, dur:3+Math.sin(i)*2, delay:-(i*0.45),
    bright:i%4===0?1:i%3===0?0.7:0.4,
  }));
  const flakes = Array.from({length:25},(_,i)=>({
    id:i, x:i*4+Math.sin(i*3)*8, size:1+Math.cos(i*1.7)*1.5+1.5,
    dur:2.5+Math.sin(i)*1.5, delay:-(i*0.35),
  }));
  const orbs = [
    {x:"12%",y:"8%",w:420,h:420,col:"#00CFFF",op:0.18,dur:5},
    {x:"62%",y:"3%",w:340,h:340,col:"#7BE8FF",op:0.14,dur:7},
    {x:"35%",y:"50%",w:480,h:480,col:"#00CFFF",op:0.10,dur:9},
    {x:"78%",y:"55%",w:280,h:280,col:"#C0F8FF",op:0.16,dur:6},
    {x:"-8%",y:"45%",w:300,h:300,col:"#00A8FF",op:0.12,dur:8},
  ];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(135deg, #020D1A 0%, #041C30 40%, #020D1A 100%)",opacity:0.85}}/>
      {orbs.map((o,i)=>(
        <div key={i} style={{
          position:"fixed",left:o.x,top:o.y,width:o.w,height:o.h,borderRadius:"50%",
          background:`radial-gradient(circle, ${o.col} 0%, transparent 50%)`,
          opacity:o.op,
          animation:`neonPulseA ${o.dur}s ${-i*1.2}s ease-in-out infinite`,
        }}/>
      ))}
      {shards.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.w,height:s.h,
          background:`linear-gradient(${s.rot}deg, rgba(0,207,255,${s.bright*0.7}) 0%, rgba(200,248,255,${s.bright*0.9}) 40%, rgba(0,168,255,${s.bright*0.5}) 70%, transparent 100%)`,
          clipPath:"polygon(50% 0%, 90% 25%, 100% 75%, 70% 100%, 30% 100%, 0% 75%, 10% 25%)",
          boxShadow:`0 0 ${s.w*0.8}px rgba(0,207,255,${s.bright*0.5})`,
          animation:`fireflyFloat ${s.dur}s ${s.delay}s ease-in-out infinite`,
          transform:`rotate(${s.rot}deg)`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
      {flakes.map(f=>(
        <div key={f.id} style={{
          position:"absolute",top:-8,left:`${f.x}%`,
          width:f.size,height:f.size,borderRadius:"50%",
          background:"#E8F8FF",
          boxShadow:`0 0 ${f.size*5}px #00CFFF90`,
          animation:`bubbleRise ${f.dur}s ${f.delay}s infinite linear`,
          opacity:0.9,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
      {[15,35,55,72,88].map((t,i)=>(
        <div key={i} style={{
          position:"fixed",top:`${t}%`,left:0,right:0,height:1,
          background:`linear-gradient(90deg, transparent 10%, #00CFFF${i%2===0?"50":"30"} 50%, transparent 90%)`,
          animation:`neonPulseB ${4+i*1.5}s ${-i*1.1}s ease-in-out infinite`,
        }}/>
      ))}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"30%",
        background:"linear-gradient(to top, #020D1A 20%, transparent)"}}/>
      <div style={{position:"fixed",top:-40,left:"15%",right:"15%",height:180,
        background:"radial-gradient(ellipse, #00CFFF22 0%, transparent 50%)",
        animation:"auroraShift1 8s ease-in-out infinite alternate"}}/>
    </div>
  );
}

// ✦ OPTIMIZADO: stars 70→50, blur→gradiente, box-shadow simple
function CosmosEffect() {
  const stars = Array.from({length:50},(_,i)=>({
    id:i, x:Math.sin(i*137.508)*50+50, y:Math.cos(i*97.31)*45+45,
    size:i%12===0?3.5:i%5===0?2.2:Math.sin(i*1.7)*0.6+1.2,
    dur:1+Math.abs(Math.cos(i))*2.5, delay:-(i*0.18),
    color:i%9===0?"#FFFFFF":i%6===0?"#FF6BF5":i%4===0?"#C8A0FF":i%3===0?"#FFB8F0":"#9B6FFF",
    glow:i%9===0?"#FF6BF5":i%6===0?"#FF6BF5":"#7B2FFF",
    bright:i%9===0?1:i%5===0?0.85:0.55,
  }));
  const shoots = Array.from({length:5},(_,i)=>({
    id:i, startX:10+i*18, startY:5+i*8, dur:3+i*1.5, delay:-(i*2.8),
  }));
  const nebulas = [
    {x:"-18%",y:"-25%",w:"95%",h:"70%",c1:"#FF6BF5",c2:"#7B2FFF",dur:16,dir:"alternate"},
    {x:"38%", y:"5%", w:"85%",h:"60%",c1:"#7B2FFF",c2:"#FF6BF5",dur:20,dir:"alternate-reverse"},
    {x:"5%",  y:"45%",w:"80%",h:"60%",c1:"#FF4AE8",c2:"#4400FF",dur:24,dir:"alternate"},
    {x:"48%", y:"50%",w:"70%",h:"55%",c1:"#CC00FF",c2:"#FF6BF5",dur:18,dir:"alternate-reverse"},
  ];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 25% 15%, #1A0040 0%, #020008 55%, #080018 100%)",opacity:0.9}}/>
      {nebulas.map((n,i)=>(
        <div key={i} style={{
          position:"fixed",left:n.x,top:n.y,width:n.w,height:n.h,
          background:`radial-gradient(ellipse, ${n.c1}28 0%, ${n.c2}14 35%, transparent 55%)`,
          animation:`auroraShift${(i%3)+1} ${n.dur}s ease-in-out infinite ${n.dir}`,
        }}/>
      ))}
      <div style={{position:"fixed",top:"5%",left:"25%",width:300,height:300,
        background:"radial-gradient(circle, #FF6BF535 0%, #7B2FFF18 35%, transparent 55%)",
        animation:"neonPulseA 5s ease-in-out infinite"}}/>
      {stars.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.size,height:s.size,borderRadius:"50%",background:s.color,
          boxShadow:`0 0 ${s.size*5}px ${s.glow}${Math.round(s.bright*160).toString(16).padStart(2,"0")}`,
          opacity:s.bright,
          animation:`neonPulseA ${s.dur}s ${s.delay}s ease-in-out infinite`,
          willChange:"opacity",
        }}/>
      ))}
      {shoots.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.startX}%`,top:`${s.startY}%`,
          width:60,height:2,borderRadius:99,
          background:"linear-gradient(90deg, #FFFFFF, #FF6BF560, transparent)",
          animation:`shimmerLine ${s.dur}s ${s.delay}s linear infinite`,
          boxShadow:"0 0 6px #FF6BF5",
        }}/>
      ))}
      {[{x:"20%",y:"15%"},{x:"75%",y:"8%"},{x:"55%",y:"40%"}].map((p,i)=>(
        <div key={i} style={{
          position:"fixed",left:p.x,top:p.y,
          width:i===2?10:6,height:i===2?10:6,borderRadius:"50%",background:"#FFFFFF",
          boxShadow:"0 0 20px #FF6BF5, 0 0 40px #7B2FFF60",
          animation:`neonPulseA ${2+i}s ease-in-out infinite`,
        }}/>
      ))}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"30%",
        background:"linear-gradient(to top, #020008, transparent)"}}/>
      <div style={{position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 60% 30%, #FF6BF508, transparent 60%)",
        animation:"neonPulseB 7s ease-in-out infinite"}}/>
    </div>
  );
}

// ── ⛈️ TORMENTA — Electric storm with lightning strikes, rain, wind ─────────
// El único tema con "eventos": relámpagos que iluminan todo de golpe.
// 3 capas de flash con duraciones primas (7s, 11s, 17s) → patrón no se repite
// en 22 minutos. Lluvia diagonal con ráfagas de viento. Nubes rodando.

function LightningBoltSVG({ x, w, h, delay, dur }) {
  // Cada rayo es un zigzag SVG con glow
  return (
    <svg style={{
      position:"absolute",left:`${x}%`,top:0,width:w,height:h,
      animation:`boltStrike ${dur}s ${delay}s linear infinite`,
      opacity:0,willChange:"opacity,transform",
    }} viewBox="0 0 60 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 0 L22 120 L38 130 L18 260 L34 270 L12 400"
        stroke="#E0F4FF" strokeWidth="3" strokeLinecap="round"
        fill="none" opacity="0.9"/>
      <path d="M32 0 L22 120 L38 130 L18 260 L34 270 L12 400"
        stroke="#00E5FF" strokeWidth="6" strokeLinecap="round"
        fill="none" opacity="0.4"/>
      {/* Branch */}
      <path d="M22 120 L4 200" stroke="#C0F0FF" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M18 260 L40 320" stroke="#C0F0FF" strokeWidth="1.5" fill="none" opacity="0.5"/>
    </svg>
  );
}

function StormEffect() {
  // Rain config: 40 drops, fast fall, slight wind angle
  const drops = Array.from({length:40},(_,i)=>({
    id:i,
    x: (i*2.5 + Math.sin(i*3.7)*6) % 100,
    h: 16 + Math.sin(i*1.3)*12,      // 4-28px tall
    w: i%5===0 ? 2 : 1,               // most thin, some thicker
    dur: 0.5 + Math.sin(i*0.7)*0.25 + (i%3)*0.15,  // 0.25-0.9s (very fast)
    delay: -(i*0.12 + Math.cos(i)*0.3),
    opacity: i%4===0 ? 0.6 : i%3===0 ? 0.4 : 0.25,
  }));

  // Cloud config: 5 dark masses drifting at top
  const clouds = [
    { x:"-15%", y:"-8%", w:"55%", h:140, opacity:0.35, dur:28, dir:"alternate", anim:"cloudDrift1" },
    { x:"30%",  y:"-12%",w:"50%", h:120, opacity:0.25, dur:35, dir:"alternate-reverse", anim:"cloudDrift2" },
    { x:"55%",  y:"-5%", w:"45%", h:100, opacity:0.30, dur:22, dir:"alternate", anim:"cloudDrift1" },
    { x:"-5%",  y:"2%",  w:"40%", h:80,  opacity:0.18, dur:40, dir:"alternate-reverse", anim:"cloudDrift2" },
    { x:"65%",  y:"0%",  w:"35%", h:90,  opacity:0.22, dur:32, dir:"alternate", anim:"cloudDrift1" },
  ];

  // Electric arc orbs: brief glow points
  const arcs = [
    { x:"15%", y:"20%", size:240, dur:7,  delay:0 },
    { x:"70%", y:"35%", size:200, dur:11, delay:-3 },
    { x:"40%", y:"60%", size:180, dur:17, delay:-8 },
  ];

  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {/* Storm sky gradient — deep navy → near-black */}
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(175deg, #0A1228 0%, #04060E 35%, #020410 70%, #060818 100%)",
        opacity:0.9}}/>

      {/* Cloud layers — no blur, wide soft gradients */}
      {clouds.map((c,i)=>(
        <div key={i} style={{
          position:"fixed",left:c.x,top:c.y,width:c.w,height:c.h,
          background:"radial-gradient(ellipse at 50% 80%, #0A1428 0%, #06101E80 40%, transparent 70%)",
          borderRadius:"50%",
          opacity:c.opacity,
          animation:`${c.anim} ${c.dur}s ease-in-out infinite ${c.dir}`,
        }}/>
      ))}

      {/* Undercloud ambient light — reflects lightning color faintly */}
      <div style={{position:"fixed",top:0,left:"10%",right:"10%",height:"20%",
        background:"radial-gradient(ellipse at 50% 100%, #00E5FF06, transparent 60%)",
        animation:"neonPulseA 8s ease-in-out infinite"}}/>

      {/* ═══ LIGHTNING FLASH LAYERS ═══ */}
      {/* Three overlapping full-screen flashes at prime-number intervals */}
      {/* → combined pattern doesn't repeat for ~22 minutes */}
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 30% 15%, #C0E8FF, #4080C060 40%, transparent 70%)",
        animation:"lightningFlashA 7s linear infinite",
        opacity:0,
      }}/>
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 65% 10%, #E0F4FF, #6090D050 40%, transparent 70%)",
        animation:"lightningFlashB 11s linear infinite",
        opacity:0,
      }}/>
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 45% 20%, #D0EEFF, #5088C040 40%, transparent 70%)",
        animation:"lightningFlashC 17s linear infinite",
        opacity:0,
      }}/>

      {/* ═══ LIGHTNING BOLTS ═══ */}
      {/* SVG zigzag bolts that appear during flash windows */}
      <LightningBoltSVG x={22} w={60} h="55%" delay={0} dur={7}/>
      <LightningBoltSVG x={62} w={50} h="48%" delay={-2} dur={11}/>
      <LightningBoltSVG x={42} w={55} h="52%" delay={-5} dur={17}/>

      {/* ═══ ELECTRIC ARC GLOWS ═══ */}
      {/* Brief illumination at bolt strike points */}
      {arcs.map((a,i)=>(
        <div key={i} style={{
          position:"fixed",left:a.x,top:a.y,
          width:a.size,height:a.size,borderRadius:"50%",
          background:"radial-gradient(circle, #00E5FF18 0%, #00A0FF08 30%, transparent 55%)",
          animation:`lightningFlashA ${a.dur}s ${a.delay}s linear infinite`,
          opacity:0,
        }}/>
      ))}

      {/* ═══ RAIN ═══ */}
      {/* Wind container — tilts all rain slightly, with gusting */}
      <div style={{
        position:"fixed",inset:"-10% -5% 0 -5%",
        animation:"windGust 6s ease-in-out infinite",
        transformOrigin:"top center",
      }}>
        {drops.map(d=>(
          <div key={d.id} style={{
            position:"absolute",
            left:`${d.x}%`,
            top:-30,
            width:d.w,
            height:d.h,
            borderRadius:d.w,
            background:`linear-gradient(to bottom, transparent, #80C8E8${Math.round(d.opacity*255).toString(16).padStart(2,"0")} 30%, #B0DEFF${Math.round(d.opacity*200).toString(16).padStart(2,"0")} 70%, transparent)`,
            animation:`rainFall ${d.dur}s ${d.delay}s linear infinite`,
            willChange:"transform,opacity",
            backfaceVisibility:"hidden",
          }}/>
        ))}
      </div>

      {/* Ground splash zone — subtle reflected glow at bottom */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"18%",
        background:"linear-gradient(to top, #00E5FF06, transparent)"}}/>

      {/* Horizon glow — distant storm light */}
      <div style={{position:"fixed",bottom:"8%",left:"-10%",right:"-10%",height:100,
        background:"radial-gradient(ellipse at 50% 100%, #102040 0%, transparent 60%)",
        animation:"neonPulseB 12s ease-in-out infinite"}}/>

      {/* Top darkening — storm ceiling */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:"15%",
        background:"linear-gradient(to bottom, #02040A, transparent)"}}/>

      {/* Bottom ground fade */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"25%",
        background:"linear-gradient(to top, #04060E 15%, transparent)"}}/>
    </div>
  );
}

// ── Theme options & picker ───────────────────────────────────────────────────

const THEME_OPTIONS = [
  { id:"dark",      name:"Void",       desc:"El original",            preview:["#0D1117","#161B22","#348FFF"], emoji:"⬛", tag:null },
  { id:"light",     name:"Blanco",     desc:"Claridad total",         preview:["#F4F7FB","#FFFFFF","#348FFF"], emoji:"☀️", tag:null },
  { id:"pink",      name:"Sakura",     desc:"Petalos de cerezo",      preview:["#FEE6F2","#FFF0F8","#E8186A"], emoji:"🌸", tag:"✦ SECRET" },
  { id:"ocean",     name:"Abismo",     desc:"Profundidades del mar",  preview:["#04080F","#071424","#00C8FF"], emoji:"🌊", tag:"✦ SECRET" },
  { id:"sunset",    name:"Volcan",     desc:"Calor y brasa",          preview:["#0F0500","#1C0A05","#FF5500"], emoji:"🌋", tag:"✦ SECRET" },
  { id:"forest",    name:"Bosque",     desc:"Luciernagas nocturnas",  preview:["#020A04","#071510","#22D45A"], emoji:"🌿", tag:"✦ SECRET" },
  { id:"aurora",    name:"Aurora",     desc:"Luces del norte",        preview:["#020510","#060B1C","#8A5CF6"], emoji:"🔮", tag:"✦ SECRET" },
  { id:"neon",      name:"Glitch",     desc:"Ciudad cyberpunk",       preview:["#03000A","#080018","#CC00FF"], emoji:"⚡", tag:"✦ SECRET" },
  { id:"synthwave", name:"Synthwave",  desc:"Horizonte retro 80s",    preview:["#0A0015","#130028","#FF006E"], emoji:"🌅", tag:"✦ SECRET" },
  { id:"cryo",      name:"Cryo",       desc:"Cristal glacial",        preview:["#020D1A","#061828","#00CFFF"], emoji:"❄️", tag:"✦ SECRET" },
  { id:"cosmos",    name:"Cosmos",     desc:"Nebulosa y estrellas",   preview:["#020008","#080018","#FF6BF5"], emoji:"🌌", tag:"✦ SECRET" },
  { id:"tormenta", name:"Tormenta",   desc:"Rayos y lluvia eléctrica",preview:["#04060E","#0A1020","#00E5FF"], emoji:"⛈️", tag:"✦ SECRET" },
];

const ACCENT_MAP = {
  dark:"#348FFF", light:"#348FFF", pink:"#E8186A",
  ocean:"#00C8FF", sunset:"#FF5500", forest:"#22D45A", aurora:"#8A5CF6", neon:"#CC00FF",
  synthwave:"#FF006E", cryo:"#00CFFF", cosmos:"#FF6BF5", tormenta:"#00E5FF",
};

function ThemePicker({ current, onSelect, onClose, onShowMapa }) {
  const [hovered, setHovered] = useState(null);
  const accent = ACCENT_MAP[current] || "#348FFF";
  const isDark = !["light"].includes(current);

  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed",inset:0,zIndex:290,
        background:"rgba(0,0,0,0.65)",
        backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
        animation:"fadeIn 0.18s ease both",
      }}/>
      <div style={{
        position:"fixed",left:"50%",top:"50%",
        transform:"translate(-50%,-50%)",
        zIndex:300,
        width:"min(94vw, 400px)",
        background: isDark
          ? `linear-gradient(160deg, ${accent}08 0%, #000000F0 40%)`
          : "rgba(255,255,255,0.97)",
        border:`1px solid ${accent}35`,
        borderRadius:28,
        padding:"22px 16px 18px",
        boxShadow:`0 0 80px ${accent}20, 0 0 0 1px ${accent}15, 0 32px 80px rgba(0,0,0,0.6)`,
        animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        fontFamily:"'Inter',sans-serif",
        overflowY:"auto",
        maxHeight:"88vh",
      }}>
        <div style={{
          position:"absolute",top:0,left:"10%",right:"10%",height:1,
          background:`linear-gradient(90deg, transparent, ${accent}80, transparent)`,
          borderRadius:99,
        }}/>
        <div style={{textAlign:"center",marginBottom:20,position:"relative"}}>
          <div style={{
            display:"inline-flex",alignItems:"center",gap:6,
            fontSize:9,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",
            color:accent,marginBottom:8,
            padding:"3px 10px",
            background:`${accent}12`,
            border:`1px solid ${accent}25`,
            borderRadius:99,
          }}>
            <span style={{width:4,height:4,borderRadius:"50%",background:accent,display:"inline-block",boxShadow:`0 0 6px ${accent}`}}/>
            TEMAS SECRETOS
            <span style={{width:4,height:4,borderRadius:"50%",background:accent,display:"inline-block",boxShadow:`0 0 6px ${accent}`}}/>
          </div>
          <div style={{
            fontFamily:"'Bricolage Grotesque',sans-serif",
            fontSize:24,fontWeight:800,lineHeight:1.1,
            color: isDark ? "#F0EFFF" : "#0A0A14",
            letterSpacing:"-0.02em",
          }}>
            Elige tu universo
          </div>
          <div style={{fontSize:11,color: isDark ? "#556080" : "#94A3B8",marginTop:4}}>
            Cada tema transforma la experiencia
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {THEME_OPTIONS.map((opt, i) => {
            const ac      = ACCENT_MAP[opt.id] || "#348FFF";
            const isActive = current === opt.id;
            const isHov    = hovered === opt.id;
            const isSecret = !!opt.tag;
            return (
              <button key={opt.id} className="press"
                onPointerEnter={() => setHovered(opt.id)}
                onPointerLeave={() => setHovered(null)}
                onClick={() => { onSelect(opt.id); onClose(); }}
                style={{
                  position:"relative",
                  background: isActive
                    ? `linear-gradient(135deg, ${ac}22 0%, ${ac}0A 100%)`
                    : isHov
                      ? `${opt.preview[0]}EE`
                      : `${opt.preview[0]}CC`,
                  border:`1.5px solid ${isActive ? ac+"70" : isHov ? ac+"40" : ac+"18"}`,
                  borderRadius:18,
                  padding:"13px 11px 11px",
                  cursor:"pointer",
                  textAlign:"left",
                  transition:"all 0.16s ease",
                  overflow:"hidden",
                  boxShadow: isActive
                    ? `0 0 24px ${ac}25, inset 0 0 24px ${ac}08`
                    : isHov
                      ? `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${ac}15`
                      : "none",
                }}>
                {isActive && (
                  <div style={{
                    position:"absolute",top:0,left:"15%",right:"15%",height:2,
                    background:`linear-gradient(90deg, transparent, ${ac}, transparent)`,
                    borderRadius:99,
                  }}/>
                )}
                {isSecret && (
                  <div style={{
                    position:"absolute",top:8,right:8,
                    fontSize:6,fontWeight:800,letterSpacing:"0.1em",
                    color:ac,background:`${ac}18`,border:`1px solid ${ac}30`,
                    borderRadius:99,padding:"2px 5px",
                    opacity: isActive || isHov ? 1 : 0.6,
                  }}>{opt.tag}</div>
                )}
                {isActive && (
                  <div style={{
                    position:"absolute",top:9,left:9,
                    width:7,height:7,borderRadius:"50%",
                    background:ac,boxShadow:`0 0 10px ${ac}, 0 0 4px ${ac}`,
                  }}/>
                )}
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}>
                  <div style={{width:22,height:22,borderRadius:8,background:opt.preview[0],border:`1px solid ${ac}20`,flexShrink:0}}/>
                  <div style={{width:16,height:16,borderRadius:6,background:opt.preview[1],border:`1px solid ${ac}15`,flexShrink:0}}/>
                  <div style={{width:12,height:12,borderRadius:4,background:ac,boxShadow:`0 0 8px ${ac}90`,flexShrink:0}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:18,lineHeight:1,filter: isActive||isHov ? "none" : "saturate(0.7)"}}>{opt.emoji}</span>
                  <span style={{
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                    fontSize:15,fontWeight:800,lineHeight:1,
                    color: isActive ? ac : isHov ? "#E8F0FF" : "#8090B0",
                    transition:"color 0.15s",
                  }}>{opt.name}</span>
                </div>
                <div style={{fontSize:10,lineHeight:1.4,paddingLeft:24,color: isActive ? ac+"99" : "#445060"}}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Secret: Mapa en vivo */}
        {onShowMapa && (
          <button className="press" onClick={() => { onClose(); onShowMapa(); }}
            style={{
              width:"100%",marginTop:14,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              background: isDark ? "#ffffff06" : "#00000006",
              border:`1px dashed ${isDark?"#ffffff18":"#00000015"}`,
              borderRadius:12,padding:"10px 14px",cursor:"pointer",
            }}>
            <span style={{fontSize:14}}>🗺</span>
            <span style={{fontSize:11,fontWeight:600,color: isDark ? "#556080" : "#94A3B8"}}>Mapa en vivo (beta)</span>
          </button>
        )}

        <div style={{marginTop:16,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{height:1,flex:1,background: isDark ? "#ffffff10" : "#00000010"}}/>
          <button className="press" onClick={onClose} style={{
            fontSize:11,fontWeight:600,letterSpacing:"0.05em",
            color: isDark ? "#445060" : "#94A3B8",
            background:"none",border:`1px solid ${isDark?"#ffffff12":"#00000010"}`,
            borderRadius:99,padding:"5px 14px",cursor:"pointer",
          }}>
            cerrar
          </button>
          <div style={{height:1,flex:1,background: isDark ? "#ffffff10" : "#00000010"}}/>
        </div>
      </div>
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonLine({ width = "100%", height = 14, radius = 6, T, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: `linear-gradient(90deg, ${T.skeleton} 25%, ${T.skeletonShine} 50%, ${T.skeleton} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s ease-in-out infinite",
      ...style,
    }}/>
  );
}
function SkeletonCard({ T, index = 0 }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.border}`,
      borderRadius: 12,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      animationDelay: `${index * 40}ms`,
    }} className="fade">
      <div style={{flexShrink:0,minWidth:48,display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
        <SkeletonLine width={36} height={13} T={T}/>
        <SkeletonLine width={28} height={10} T={T}/>
      </div>
      <div style={{width:1,height:28,background:T.border,flexShrink:0}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        <SkeletonLine width="85%" height={13} T={T}/>
        <SkeletonLine width="55%" height={11} T={T}/>
      </div>
    </div>
  );
}
function SkeletonWeekCard({ T, index = 0 }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden",
      animationDelay: `${index * 35}ms`,
    }} className="fade">
      <div style={{padding:"9px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
        <SkeletonLine width={60} height={12} T={T}/>
        <SkeletonLine width={70} height={12} T={T}/>
      </div>
      <div style={{padding:"8px 13px 10px",display:"flex",flexDirection:"column",gap:5}}>
        <SkeletonLine width="70%" height={11} T={T}/>
        <SkeletonLine width="50%" height={11} T={T}/>
      </div>
    </div>
  );
}

// ── Banner offline / stale ────────────────────────────────────────────────────
function OfflineBanner({ isOnline, isStale, T }) {
  if (isOnline && !isStale) return null;
  const offline = !isOnline;
  return (
    <div className="fade" style={{
      marginBottom: 10,
      padding: "8px 12px",
      borderRadius: 10,
      background: offline ? "#2D1515" : T.surface2,
      border: `1px solid ${offline ? "#F8717140" : T.border}`,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: offline ? "#F87171" : T.muted,
    }}>
      {offline ? (
        <>
          <span>📵</span>
          <span>Sin conexión — mostrando datos guardados</span>
        </>
      ) : (
        <>
          <div style={{width:10,height:10,border:`1.5px solid ${T.muted}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
          <span>Actualizando…</span>
        </>
      )}
    </div>
  );
}

// ── Pull-to-refresh ───────────────────────────────────────────────────────────
const PTR_THRESHOLD = 72;

function usePullToRefresh(onRefresh, scrollRef) {
  const [pullY, setPullY] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  // El scroll container real es #root (no el tab div)
  const getScrollTop = () => {
    const root = document.getElementById("root");
    return root ? root.scrollTop : 0;
  };

  const onTouchStart = useCallback((e) => {
    if (getScrollTop() > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || startY.current === null) return;
    if (getScrollTop() > 0) { pulling.current = false; startY.current = null; return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) return;
    const y = Math.min(delta * 0.45, PTR_THRESHOLD + 20);
    setPullY(y);
    if (y >= PTR_THRESHOLD && !triggered) setTriggered(true);
    if (y < PTR_THRESHOLD && triggered) setTriggered(false);
  }, [triggered]);

  const onTouchEnd = useCallback(() => {
    if (triggered) onRefresh();
    setPullY(0);
    setTriggered(false);
    pulling.current = false;
    startY.current = null;
  }, [triggered, onRefresh]);

  return { pullY, triggered, onTouchStart, onTouchMove, onTouchEnd };
}

function PullIndicator({ pullY, triggered, T }) {
  if (pullY <= 4) return null;
  const progress = Math.min(pullY / PTR_THRESHOLD, 1);
  return (
    <div style={{
      position: "absolute",
      top: Math.max(-40, pullY - 52),
      left: "50%",
      transform: "translateX(-50%)",
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: T.surface,
      border: `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: progress,
      transition: "top 0.05s",
      zIndex: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      {triggered ? (
        <div style={{width:16,height:16,border:"2px solid #348FFF",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.6s linear infinite"}}/>
      ) : (
        <span style={{fontSize:16,transform:`rotate(${progress*180}deg)`,transition:"transform 0.1s",display:"block"}}>↓</span>
      )}
    </div>
  );
}

// ── SwapTurnos — cambio de turnos con PIN ────────────────────────────────────
function nextMonthStr(m) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthNameLabel(m) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo-1, 1).toLocaleDateString("es-CL", { month:"long" });
}

function TurnoSelector({ label, becados, curMonth, tipoCode, selected, onSelect, T }) {
  const [becado,   setBecado]   = useState("");
  const [turnos,   setTurnos]   = useState([]);
  const [loadingT, setLoadingT] = useState(false);

  const TIPO_COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00" };
  const col = TIPO_COLOR[tipoCode] || "#64748B";
  const DIAS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  const filterDays = (days, month) => (days || [])
    .filter(day => tipoCode === "N" ? day.nocheCode === "N" : tipoCode === "A" ? day.artroCode === "A" : day.diaCode === tipoCode)
    .map(day => ({ date: day.date, code: tipoCode, month }));

  useEffect(() => {
    if (!becado) { setTurnos([]); onSelect(null); return; }
    setLoadingT(true); setTurnos([]); onSelect(null);
    const m2 = nextMonthStr(curMonth);
    Promise.all([
      apiGet({ route:"personal-month", becado, month: curMonth, token:API_TOKEN }),
      apiGet({ route:"personal-month", becado, month: m2,       token:API_TOKEN }),
    ]).then(([d1, d2]) => {
      const t1 = d1.ok ? filterDays(d1.days, curMonth) : [];
      const t2 = d2.ok ? filterDays(d2.days, m2)       : [];
      setTurnos([...t1, ...t2]);
    }).catch(() => setTurnos([])).finally(() => setLoadingT(false));
  }, [becado, curMonth, tipoCode]);

  useEffect(() => { onSelect(null); }, [becado, tipoCode]);

  const byMonth = turnos.reduce((acc, t) => {
    if (!acc[t.month]) acc[t.month] = [];
    acc[t.month].push(t);
    return acc;
  }, {});

  const selectStyle = {
    width:"100%", padding:"11px 36px 11px 14px", borderRadius:10,
    border:`1px solid ${T.border}`, background:T.surface2, color:T.text,
    fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none",
    WebkitAppearance:"none", appearance:"none", boxSizing:"border-box",
  };

  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>{label}</div>
      <div style={{position:"relative",marginBottom:10}}>
        <select value={becado} onChange={e => setBecado(e.target.value)} style={selectStyle}>
          <option value="">Seleccionar becado…</option>
          {becados.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:T.muted,fontSize:12}}>▾</span>
      </div>
      {becado && (
        loadingT ? (
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:T.muted,fontSize:13}}>
            <div style={{width:14,height:14,border:`2px solid ${T.border}`,borderTopColor:"#348FFF",borderRadius:"50%",animation:"spin 0.6s linear infinite",flexShrink:0}}/>
            Cargando turnos…
          </div>
        ) : turnos.length === 0 ? (
          <div style={{padding:"8px 0",fontSize:13,color:T.muted}}>Sin turnos de este tipo</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {Object.entries(byMonth).map(([m, ts]) => (
              <div key={m}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.07em",textTransform:"capitalize",marginBottom:6}}>
                  {monthNameLabel(m)}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {ts.map(t => {
                    const [ty,tm,td] = t.date.split("-").map(Number);
                    const dow = new Date(ty,tm-1,td).getDay();
                    const isSel = selected?.date === t.date;
                    return (
                      <button key={t.date} className="press"
                        onClick={() => onSelect(isSel ? null : { date:t.date, becado, code:tipoCode })}
                        style={{
                          padding:"6px 11px", borderRadius:9,
                          border:`1.5px solid ${isSel ? col : T.border}`,
                          background: isSel ? `${col}22` : T.surface2,
                          color: isSel ? col : T.sub,
                          fontSize:13, fontWeight: isSel ? 700 : 400,
                          transition:"all 0.12s",
                          display:"flex", alignItems:"center", gap:5,
                        }}>
                        <span style={{fontSize:10,opacity:0.6}}>{DIAS_ES[dow]}</span>
                        <span>{td}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function SwapTurnos({ becados, onClose, T }) {
  const today   = useMemo(() => todayISO(), []);
  const curMonth = today.slice(0, 7);

  const TIPO_OPTS = [
    { id:"P", label:"Poli",  sheet:"Dia",          color:"#06B6D4" },
    { id:"D", label:"Día",   sheet:"Dia",          color:"#F59E0B" },
    { id:"N", label:"Noche", sheet:"Noche",        color:"#4F6EFF" },
    { id:"A", label:"Artro", sheet:"Artroscopia",   color:"#72FF00" },
  ];
  const [tipo,    setTipo]    = useState("P");
  const [selA,    setSelA]    = useState(null);
  const [selB,    setSelB]    = useState(null);
  const [pin,     setPin]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const handleTipo = (id) => { setTipo(id); setSelA(null); setSelB(null); setResult(null); };
  const tipoObj  = TIPO_OPTS.find(t => t.id === tipo);
  const canSubmit = selA && selB && pin.length === 4 && !loading
    && !(selA.becado === selB.becado && selA.date === selB.date);

  const handleSwap = async () => {
    if (!canSubmit) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(API_URL, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          route:"swap_turno", pin,
          becado1: selA.becado, date1: selA.date,
          becado2: selB.becado, date2: selB.date,
          sheet: tipoObj.sheet, tipoCode: tipo,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // No borrar caché — datos viejos visibles hasta que SWR revalide.
        // Solo marcar que estas claves necesitan refetch.
        [{route:"daily",becado:selA.becado,date:selA.date,token:API_TOKEN},
         {route:"daily",becado:selB.becado,date:selB.date,token:API_TOKEN}]
          .forEach(p => _revalidatedThisSession.delete(cacheKey(p)));
        setResult({ ok:true, msg:"✓ Cambio aplicado correctamente" });
        setPin(""); setSelA(null); setSelB(null);
      } else {
        setResult({ ok:false, msg: data.error || "Error al aplicar el cambio" });
      }
    } catch(e) {
      setResult({ ok:false, msg:"Error de conexión" });
    }
    setLoading(false);
  };

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:190,background:"rgba(0,0,0,0.55)"}}/>
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:200,
        background:T.surface, borderRadius:"22px 22px 0 0",
        boxShadow:"0 -12px 48px rgba(0,0,0,0.35)",
        fontFamily:"'Inter',sans-serif",
        maxHeight:"92vh", display:"flex", flexDirection:"column",
      }}>
        <div style={{padding:"12px 20px 16px", flexShrink:0, borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:40,height:4,borderRadius:99,background:T.border,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted,marginBottom:2}}>Administración</div>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:800,color:T.text,lineHeight:1.1}}>Cambio de turno</div>
            </div>
            <button className="press" onClick={onClose}
              style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:T.muted}}>
              ✕
            </button>
          </div>
        </div>

        <div style={{overflowY:"auto",padding:"16px 20px",flex:1,display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Tipo de turno</div>
            <div style={{display:"flex",gap:8}}>
              {TIPO_OPTS.map(o => (
                <button key={o.id} className="press" onClick={() => handleTipo(o.id)}
                  style={{flex:1,height:40,borderRadius:10,border:`1px solid ${tipo===o.id ? o.color+"80" : T.border}`,background:tipo===o.id ? `${o.color}20` : T.surface2,fontSize:13,fontWeight:tipo===o.id?700:500,color:tipo===o.id?o.color:T.sub,transition:"all 0.15s"}}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <TurnoSelector label="Becado A" becados={becados} curMonth={curMonth} tipoCode={tipo} selected={selA} onSelect={setSelA} T={T}/>

          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,height:1,background:T.border}}/>
            <div style={{width:32,height:32,borderRadius:8,background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:T.muted}}>⇅</div>
            <div style={{flex:1,height:1,background:T.border}}/>
          </div>

          <TurnoSelector label="Becado B" becados={becados} curMonth={curMonth} tipoCode={tipo} selected={selB} onSelect={setSelB} T={T}/>

          {selA && selB && (
            <div style={{background:T.surface2,border:`1px solid ${tipoObj.color}30`,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:11,fontWeight:700,color:tipoObj.color,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Confirmando cambio</div>
              <div style={{fontSize:13,color:T.sub,lineHeight:1.8}}>
                <span style={{color:T.text,fontWeight:600}}>{selA.becado}</span> el {formatDate(selA.date).split(",")[1]?.trim() || selA.date}
                <span style={{color:T.muted}}> ↔ </span>
                <span style={{color:T.text,fontWeight:600}}>{selB.becado}</span> el {formatDate(selB.date).split(",")[1]?.trim() || selB.date}
              </div>
            </div>
          )}

          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>PIN de administrador</div>
            <input
              type="password" inputMode="numeric" maxLength={4} placeholder="_ _ _ _"
              value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g,""))}
              style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,color:T.text,fontSize:24,textAlign:"center",letterSpacing:"0.5em",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
            />
          </div>

          {result && (
            <div style={{padding:"11px 14px",borderRadius:10,background:result.ok?"#13C04518":"#F8717118",border:`1px solid ${result.ok?"#13C04540":"#F8717140"}`,fontSize:13,color:result.ok?"#13C045":"#F87171",lineHeight:1.4}}>
              {result.msg}
            </div>
          )}

          <div style={{height:4}}/>
        </div>

        <div style={{padding:`12px 20px calc(var(--sab) + 16px)`,flexShrink:0,borderTop:`1px solid ${T.border}`}}>
          <button className="press" onClick={handleSwap} disabled={!canSubmit}
            style={{width:"100%",height:50,borderRadius:13,border:"none",background:canSubmit?(T?.accent||"#348FFF"):(T?.accent||"#348FFF")+"38",color:canSubmit?"#fff":"#ffffff80",fontSize:15,fontWeight:700,transition:"all 0.15s",cursor:canSubmit?"pointer":"default"}}>
            {loading ? "Aplicando…" : "Confirmar cambio"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({ theme, onToggle, onClose, onPreviewSplash, onSwapTurnos, T }) {
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.3)"}}/>
      <div style={{
        position:"fixed",top:"calc(var(--sat) + 52px)",right:12,zIndex:100,
        background:T.surface,border:`1px solid ${T.border}`,
        borderRadius:14,padding:"14px 16px",width:200,
        boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
        animation:"slideDown 0.2s ease both",
        fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>
          Apariencia
        </div>
        <button className="press" onClick={onSwapTurnos}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>⇄</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Cambio de turno</span>
        </button>
        <button className="press" onClick={onPreviewSplash}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>🎭</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Ver intro</span>
        </button>
        <button className="press"
          onClick={onToggle}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:16}}>{theme==="dark"||theme==="pink" ? "🌙" : "☀️"}</span>
            <span style={{fontSize:13,fontWeight:500,color:T.text}}>{theme==="dark"||theme==="pink" ? "Dark" : "Light"}</span>
          </div>
          <div style={{width:36,height:20,borderRadius:99,background:theme==="light"?T.border:(T.accent||"#348FFF"),position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:theme==="light"?2:18,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </button>
      </div>
    </>
  );
}

// ── Gear button ───────────────────────────────────────────────────────────────
function GearBtn({ onClick, T }) {
  return (
    <button className="press" onClick={onClick}
      style={{position:"fixed",top:"calc(var(--sat) + 8px)",right:12,zIndex:80,width:36,height:36,borderRadius:10,background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
      ⚙️
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = "#348FFF" }) {
  return (
    <div style={{display:"flex",justifyContent:"center",padding:"52px 0"}}>
      <div style={{width:22,height:22,border:`2.5px solid #2D374860`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.65s linear infinite"}}/>
    </div>
  );
}

// ── Error box ─────────────────────────────────────────────────────────────────
function ErrorBox({ msg, T }) {
  if (!msg) return null;
  return <div style={{background:"#2D1515",border:"1px solid #F8717140",borderRadius:10,padding:"10px 13px",fontSize:13,color:"#F87171",marginBottom:12}}>{msg}</div>;
}

// ── DateNav ───────────────────────────────────────────────────────────────────
function DateNav({ date, today, onPrev, onNext, onToday, T }) {
  const isToday = date === today;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <button className="press" onClick={onPrev}
        style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>
        ‹
      </button>
      <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>
        {formatDate(date)}
      </div>
      <button className="press" onClick={onNext}
        style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>
        ›
      </button>
      {!isToday && (
        <button className="press" onClick={onToday}
          style={{height:32,padding:"0 11px",borderRadius:8,border:`1px solid ${T?.accent||"#348FFF"}60`,background:`${T?.accent||"#348FFF"}14`,fontSize:11,fontWeight:700,color:T?.accent||"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
          HOY
        </button>
      )}
    </div>
  );
}

// ── Activity card ─────────────────────────────────────────────────────────────
function ActivityCard({ from, to, activity, accent, light, glow, index, T }) {
  const [pressed, setPressed] = useState(false);
  const isPink = T.accent === "#E8186A";
  return (
    <div className="anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: isPink
          ? (pressed ? `linear-gradient(135deg, ${accent}22, ${accent}12)` : "rgba(255,255,255,0.72)")
          : (pressed ? light : T.surface),
        border: isPink
          ? `1px solid ${pressed ? accent+"70" : accent+"35"}`
          : `1px solid ${pressed ? accent+"50" : T.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: isPink ? 16 : 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: isPink
          ? (pressed ? `0 4px 20px ${accent}50, 0 0 0 1px ${accent}20` : `0 2px 12px ${accent}20, 0 1px 3px rgba(0,0,0,0.05)`)
          : (pressed ? `0 0 14px ${glow}` : "none"),
        backdropFilter: isPink ? "blur(12px)" : "none",
        WebkitBackdropFilter: isPink ? "blur(12px)" : "none",
        transition: "all 0.15s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:48,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:accent,lineHeight:1.2}}>{from}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:accent,opacity:0.55,lineHeight:1.2,marginTop:2}}>{to}</div>
      </div>
      <div style={{width:1,height:28,background:`${accent}30`,flexShrink:0}}/>
      <div style={{fontSize:14,color:T.text,fontWeight: isPink ? 500 : 400,lineHeight:1.35,flex:1}}>{activity}</div>
    </div>
  );
}

// ── Colores de turno ──────────────────────────────────────────────────────────
const TURNO = {
  P: { accent:"#06B6D4", light:"#06B6D412", glow:"#06B6D428", label:"Poli",  desde:"14:00", hasta:"17:59" },
  D: { accent:"#F59E0B", light:"#F59E0B12", glow:"#F59E0B28", label:"Día",   desde:"14:00", hasta:"19:59" },
  N: { accent:"#4F6EFF", light:"#4F6EFF12", glow:"#4F6EFF28", label:"Noche", desde:"20:00", hasta:"--"    },
  A: { accent:"#72FF00", light:"#72FF0012", glow:"#72FF0028", label:"Artroscopía", desde:"13:00", hasta:"13:59" },
};

function SectionDivider({ label, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0 4px"}}>
      <div style={{height:1,flex:1,background:T.border}}/>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted}}>{label}</span>
      <div style={{height:1,flex:1,background:T.border}}/>
    </div>
  );
}

function TurnoCard({ tipo, index, T }) {
  const t = TURNO[tipo];
  if (!t) return null;
  const [pressed, setPressed] = useState(false);
  return (
    <div className="anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: pressed ? t.light : T.surface,
        border: `1px solid ${pressed ? t.accent+"50" : T.border}`,
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: pressed ? `0 0 14px ${t.glow}` : "none",
        transition: "all 0.12s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:48,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:t.accent,lineHeight:1.2}}>{t.desde}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:t.accent,opacity:0.45,lineHeight:1.2,marginTop:2}}>{t.hasta}</div>
      </div>
      <div style={{width:1,height:28,background:`${t.accent}25`,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:14,color:T.text,fontWeight:500,lineHeight:1.35}}>{t.label}</div>
      </div>
    </div>
  );
}

// ── Seminario card ────────────────────────────────────────────────────────────
const SEMINAR_ACCENT = "#E879F9";
function SemCard({ presenter, title, tag, index, T }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: pressed ? "#E879F912" : T.surface,
        border: `1px solid ${pressed ? "#E879F950" : T.border}`,
        borderLeft: `3px solid ${SEMINAR_ACCENT}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: pressed ? `0 0 14px #E879F928` : "none",
        transition: "all 0.12s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:48,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:SEMINAR_ACCENT,lineHeight:1.2}}>07:30</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:SEMINAR_ACCENT,opacity:0.45,lineHeight:1.2,marginTop:2}}>07:59</div>
      </div>
      <div style={{width:1,height:28,background:`${SEMINAR_ACCENT}25`,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:14,color:T.text,fontWeight:500,lineHeight:1.35}}>
          <span style={{color:SEMINAR_ACCENT}}>{presenter}: </span>{title}
        </div>
        <div style={{fontSize:11,color:SEMINAR_ACCENT,opacity:0.7,marginTop:2}}>{tag}</div>
      </div>
    </div>
  );
}

// ── useOnline hook ────────────────────────────────────────────────────────────
function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator !== "undefined" ? (navigator.onLine ?? true) : true);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

// ── Configuración de universidades ───────────────────────────────────────────
const UNIVERSIDADES = {
  UNAB: {
    label: "UNAB",
    groups: [
      { label:"3er año", color:"#8B73FF" },
      { label:"2do año", color:"#13C045" },
      { label:"1er año", color:"#348FFF" },
    ],
    getGroups: (becados) => [
      becados.slice(0,5),
      becados.slice(5,10),
      becados.slice(10,15),
    ].filter(g => g.length > 0),
  },
  UANDES: {
    label: "UANDES",
    groups: [
      { label:"3er año", color:"#8B73FF" },
      { label:"2do año", color:"#13C045" },
      { label:"1er año", color:"#348FFF" },
    ],
    getGroups: (becados) => [
      becados.slice(15,21),
      becados.slice(21,27),
      becados.slice(27,33),
    ].filter(g => g.length > 0),
  },
  IST: {
    label: "IST",
    groups: [
      { label:"Becados IST", color:"#FB923C" },
    ],
    getGroups: (becados) => [
      becados.slice(33,36),
    ].filter(g => g.length > 0),
  },
};
const UNIV_ORDER = ["UNAB","UANDES","IST"];

// ── Mapa en Vivo — pixel art hospital ────────────────────────────────────────

const MAP_BUILDINGS = [
  { id:"pabellones",   label:"Pabellones",  accent:"#13C045", desc:"Cirugía",
    sprite:"/sprites/pabellones.png",
    floorSpots:[
      {x:26,y:67},{x:39,y:75},{x:51,y:83},{x:70,y:76},
      {x:56,y:66},{x:44,y:58},{x:53,y:52},{x:69,y:59},{x:81,y:68},
    ],
  },
  { id:"jofre",        label:"Jofré",        accent:"#FBBF24", desc:"Artroscopía · Seminarios",
    sprite:"/sprites/jofre.png",
    floorSpots:[
      {x:22,y:71},{x:37,y:64},{x:49,y:56},{x:38,y:79},
      {x:51,y:71},{x:65,y:64},{x:51,y:85},{x:67,y:77},{x:79,y:70},
    ],
  },
  { id:"policlinicos", label:"Policlínicos", accent:"#348FFF", desc:"Consultas",
    sprite:"/sprites/policlinicos.png",
    floorSpots:[
      {x:51,y:62},{x:32,y:69},{x:50,y:79},{x:71,y:71},
    ],
  },
  { id:"urgencia",     label:"Urgencia",     accent:"#F87171", desc:"Turnos Día · Noche",
    sprite:"/sprites/urgencia.png",
    floorSpots:[
      {x:66,y:57},{x:76,y:71},{x:61,y:81},{x:49,y:85},{x:28,y:73},
    ],
  },
];

// Pixel art building sprites — detailed, 80x64 viewBox
function PixelBuilding({ accent, type }) {
  // Helper: R(x,y,w,h,fill) — compact rect
  const R = (x,y,w,h,f) => <rect x={x} y={y} width={w} height={h} fill={f}/>;

  if (type === "pabellones") {
    // 2-story green hospital, cross on roof, double doors, awning, plants
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {/* Ground shadow */}
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(8,16,64,42,"#1A3D2A")} {R(10,16,60,42,"#1E4D30")}
        {/* Wall texture — brick lines */}
        {R(10,24,60,1,"#16382590")} {R(10,32,60,1,"#16382590")} {R(10,40,60,1,"#16382590")} {R(10,48,60,1,"#16382590")}
        {/* Roof */}
        {R(6,14,68,4,"#2D6B3F")} {R(4,12,72,3,"#13C045")} {R(4,11,72,2,"#0FA038")}
        {/* Cross on roof */}
        {R(36,2,8,10,"#FFFFFF")} {R(33,5,14,4,"#FFFFFF")} {R(37,3,6,8,"#13C045")} {R(34,6,12,2,"#13C045")}
        {/* Floor separator */}
        {R(10,34,60,2,"#2D6B3F50")}
        {/* Windows — top floor */}
        {R(14,18,10,7,"#0A1C12")} {R(15,19,8,5,"#80FFB040")} {R(15,19,8,1,"#80FFB020")}
        {R(28,18,10,7,"#0A1C12")} {R(29,19,8,5,"#80FFB040")} {R(29,19,8,1,"#80FFB020")}
        {R(42,18,10,7,"#0A1C12")} {R(43,19,8,5,"#80FFB040")} {R(43,19,8,1,"#80FFB020")}
        {R(56,18,10,7,"#0A1C12")} {R(57,19,8,5,"#80FFB040")} {R(57,19,8,1,"#80FFB020")}
        {/* Operating light in top-left window */}
        {R(17,20,4,2,"#FFEE80")} {R(18,22,2,1,"#FFD700")}
        {/* Windows — bottom floor */}
        {R(14,37,10,7,"#0A1C12")} {R(15,38,8,5,"#80FFB030")}
        {R(56,37,10,7,"#0A1C12")} {R(57,38,8,5,"#80FFB030")}
        {/* Double door */}
        {R(30,42,20,16,"#0D2818")} {R(31,43,8,15,"#1A5030")} {R(41,43,8,15,"#1E5A36")}
        {R(38,49,4,4,"#FFD700")} {/* door handle */}
        {/* Awning over door */}
        {R(26,40,28,3,"#13C045")} {R(27,40,2,3,"#FFFFFF60")} {R(31,40,2,3,"#FFFFFF60")} {R(35,40,2,3,"#FFFFFF60")}
        {R(39,40,2,3,"#FFFFFF60")} {R(43,40,2,3,"#FFFFFF60")} {R(47,40,2,3,"#FFFFFF60")} {R(51,40,2,3,"#FFFFFF60")}
        {/* Plants */}
        {R(10,52,4,6,"#5D4037")} {R(8,48,8,5,"#2E7D32")} {R(9,46,6,3,"#388E3C")}
        {R(66,52,4,6,"#5D4037")} {R(64,48,8,5,"#2E7D32")} {R(65,46,6,3,"#388E3C")}
        {/* Steps */}
        {R(28,56,24,2,"#2D6B3F80")} {R(26,57,28,2,"#2D6B3F50")}
      </svg>
    );
  }

  if (type === "jofre") {
    // Amber/gold building, scope detail, sign "JOFRÉ", seminar room hint
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(8,22,64,36,"#4A3520")} {R(10,22,60,36,"#5C4429")}
        {/* Wall texture */}
        {R(10,30,60,1,"#4A352080")} {R(10,38,60,1,"#4A352080")} {R(10,46,60,1,"#4A352080")}
        {/* Roof */}
        {R(6,20,68,4,"#6B4F30")} {R(4,18,72,3,"#FBBF24")} {R(4,17,72,2,"#E5A91F")}
        {/* Sign on roof — "JOFRÉ" */}
        {R(22,8,36,10,"#3D2B15")} {R(23,9,34,8,"#5C4429")}
        <text x="40" y="15.5" textAnchor="middle" fontSize="6" fontWeight="900" fill="#FBBF24" fontFamily="monospace">JOFRÉ</text>
        {/* Scope decoration on sign */}
        {R(18,9,4,6,"#FBBF24")} {R(17,8,6,2,"#FBBF24")} {R(19,14,2,4,"#FBBF24AA")}
        {/* Big windows — seminar room (left) */}
        {R(13,25,18,14,"#0D0800")} {R(14,26,16,12,"#FBBF2420")}
        {/* Chairs visible inside */}
        {R(16,34,3,2,"#FBBF2440")} {R(21,34,3,2,"#FBBF2440")} {R(26,34,3,2,"#FBBF2440")}
        {/* Big window — arthro room (right) */}
        {R(49,25,18,14,"#0D0800")} {R(50,26,16,12,"#FBBF2420")}
        {/* Arthroscope detail inside */}
        {R(56,28,2,8,"#FBBF2450")} {R(54,28,6,2,"#FBBF2460")} {R(57,35,3,2,"#88FF8840")}
        {/* Door */}
        {R(34,38,12,20,"#0D0800")} {R(35,39,10,19,"#3D2B15")} {R(43,48,2,3,"#FFD700")}
        {/* Awning — striped */}
        {R(30,36,20,3,"#FBBF24")} {R(31,36,2,3,"#FFFFFF50")} {R(35,36,2,3,"#FFFFFF50")}
        {R(39,36,2,3,"#FFFFFF50")} {R(43,36,2,3,"#FFFFFF50")} {R(47,36,2,3,"#FFFFFF50")}
        {/* Side lamp */}
        {R(10,38,2,12,"#6B4F30")} {R(9,36,4,3,"#FBBF2480")}
        {/* Barrel */}
        {R(68,48,6,10,"#6B4F30")} {R(68,50,6,1,"#5C4429")} {R(68,54,6,1,"#5C4429")} {R(69,47,4,2,"#7B5F38")}
        {/* Small plant */}
        {R(64,52,4,6,"#5D4037")} {R(62,49,8,4,"#F9A825")} {R(63,47,6,3,"#FDD835")}
      </svg>
    );
  }

  if (type === "policlinicos") {
    // Blue, long building, many windows, reception-style door
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(4,24,72,34,"#0F2A4A")} {R(6,24,68,34,"#153660")}
        {/* Wall texture */}
        {R(6,32,68,1,"#0F2A4A80")} {R(6,40,68,1,"#0F2A4A80")} {R(6,48,68,1,"#0F2A4A80")}
        {/* Roof */}
        {R(2,22,76,4,"#1A4C80")} {R(0,20,80,3,"#348FFF")} {R(0,19,80,2,"#2B7AE0")}
        {/* Sign */}
        {R(14,10,52,10,"#0F2A4A")} {R(15,11,50,8,"#153660")}
        <text x="40" y="17.5" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#348FFF" fontFamily="monospace">POLICLÍNICO</text>
        {/* Stethoscope on sign */}
        {R(8,11,5,2,"#348FFF")} {R(7,13,3,4,"#348FFF")} {R(11,13,3,4,"#348FFF")} {R(8,16,5,2,"#348FFFAA")}
        {/* Many windows — row 1 */}
        {R(8,27,8,6,"#061220")} {R(9,28,6,4,"#348FFF20")} {R(9,28,6,1,"#348FFF15")}
        {R(20,27,8,6,"#061220")} {R(21,28,6,4,"#348FFF20")}
        {R(32,27,8,6,"#061220")} {R(33,28,6,4,"#348FFF20")}
        {R(44,27,8,6,"#061220")} {R(45,28,6,4,"#348FFF20")}
        {R(56,27,8,6,"#061220")} {R(57,28,6,4,"#348FFF20")}
        {R(68,27,6,6,"#061220")} {R(69,28,4,4,"#348FFF20")}
        {/* Windows — row 2 */}
        {R(8,41,8,6,"#061220")} {R(9,42,6,4,"#348FFF15")}
        {R(56,41,8,6,"#061220")} {R(57,42,6,4,"#348FFF15")}
        {R(68,41,6,6,"#061220")} {R(69,42,4,4,"#348FFF15")}
        {/* Reception door — glass */}
        {R(26,40,28,18,"#061220")} {R(27,41,12,17,"#348FFF12")} {R(41,41,12,17,"#348FFF12")}
        {R(39,48,2,6,"#FFD700")} {/* handle */}
        {/* Awning */}
        {R(22,38,36,3,"#348FFF")} {R(23,38,2,3,"#FFFFFF40")} {R(27,38,2,3,"#FFFFFF40")} {R(31,38,2,3,"#FFFFFF40")}
        {R(35,38,2,3,"#FFFFFF40")} {R(39,38,2,3,"#FFFFFF40")} {R(43,38,2,3,"#FFFFFF40")}
        {R(47,38,2,3,"#FFFFFF40")} {R(51,38,2,3,"#FFFFFF40")} {R(55,38,2,3,"#FFFFFF40")}
        {/* Bench outside */}
        {R(6,54,12,2,"#1A4C80")} {R(6,52,2,3,"#1A4C80")} {R(16,52,2,3,"#1A4C80")}
        {/* Small plant */}
        {R(70,52,4,6,"#5D4037")} {R(68,49,8,4,"#1B5E20")} {R(69,47,6,3,"#2E7D32")}
      </svg>
    );
  }

  if (type === "urgencia") {
    // Red emergency building, big red cross, wide entrance, ambulance bay hint
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(8,18,64,40,"#4A1010")} {R(10,18,60,40,"#5C1515")}
        {/* Wall texture */}
        {R(10,26,60,1,"#4A101080")} {R(10,34,60,1,"#4A101080")} {R(10,42,60,1,"#4A101080")}
        {/* Roof */}
        {R(6,16,68,4,"#7A2020")} {R(4,14,72,3,"#F87171")} {R(4,13,72,2,"#E05555")}
        {/* Red cross on roof — bigger */}
        {R(34,2,12,12,"#FFFFFF")} {R(31,5,18,6,"#FFFFFF")} {R(35,3,10,10,"#F87171")} {R(32,6,16,4,"#F87171")}
        {/* Emergency light */}
        {R(22,3,4,4,"#FF0000")} {R(23,2,2,2,"#FF4444")}
        {R(54,3,4,4,"#3344FF")} {R(55,2,2,2,"#5566FF")}
        {/* Windows — top row */}
        {R(14,21,10,7,"#200505")} {R(15,22,8,5,"#F8717118")} {R(15,22,8,1,"#F8717110")}
        {R(28,21,10,7,"#200505")} {R(29,22,8,5,"#F8717118")}
        {R(42,21,10,7,"#200505")} {R(43,22,8,5,"#F8717118")}
        {R(56,21,10,7,"#200505")} {R(57,22,8,5,"#F8717118")}
        {/* Windows — bottom row */}
        {R(14,36,10,7,"#200505")} {R(15,37,8,5,"#F8717115")}
        {R(56,36,10,7,"#200505")} {R(57,37,8,5,"#F8717115")}
        {/* Wide ambulance entrance */}
        {R(26,34,28,24,"#200505")} {R(27,35,26,23,"#5C151510")}
        {/* Red/white striped awning */}
        {R(22,32,36,3,"#F87171")} {R(23,32,3,3,"#FFFFFF70")} {R(29,32,3,3,"#FFFFFF70")} {R(35,32,3,3,"#FFFFFF70")}
        {R(41,32,3,3,"#FFFFFF70")} {R(47,32,3,3,"#FFFFFF70")} {R(53,32,3,3,"#FFFFFF70")}
        {/* URGENCIA sign above door */}
        {R(28,29,24,4,"#CC0000")}
        <text x="40" y="32" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#FFFFFF" fontFamily="monospace">URGENCIA</text>
        {/* Ambulance stripes on ground */}
        {R(30,56,8,2,"#F8717140")} {R(42,56,8,2,"#F8717140")}
        {/* Cone */}
        {R(10,52,4,6,"#FF6600")} {R(10,52,4,2,"#FFFFFF80")} {R(11,50,2,3,"#FF6600")}
      </svg>
    );
  }

  return null;
}

// Pixel art doctor avatar — 12x16 with lab coat
function PixelAvatar({ color, initial, size = 28, selected, onClick, name }) {
  const skin = "#FFD5B0";
  const hair = "#3D2B1F";
  const coat = "#FFFFFF";
  const accent = color;
  return (
    <div className="press" onClick={onClick} style={{
      display:"inline-flex",flexDirection:"column",alignItems:"center",gap:2,
      width: size + 12,
      transition:"transform 0.15s",
      transform: selected ? "scale(1.18)" : "none",
    }}>
      <svg viewBox="0 0 12 18" width={size} height={size*1.5} style={{imageRendering:"pixelated",display:"block"}}>
        {/* Hair */}
        <rect x="3" y="0" width="6" height="2" fill={hair}/>
        <rect x="2" y="1" width="8" height="1" fill={hair}/>
        {/* Head */}
        <rect x="3" y="2" width="6" height="5" fill={skin}/>
        <rect x="2" y="3" width="1" height="3" fill={skin}/>
        <rect x="9" y="3" width="1" height="3" fill={skin}/>
        {/* Eyes */}
        <rect x="4" y="3" width="1" height="2" fill="#2D1B0E"/>
        <rect x="7" y="3" width="1" height="2" fill="#2D1B0E"/>
        {/* Mouth */}
        <rect x="5" y="6" width="2" height="1" fill="#C4956A"/>
        {/* Lab coat body */}
        <rect x="2" y="7" width="8" height="6" fill={coat}/>
        {/* Colored accent stripe (stethoscope/collar) */}
        <rect x="4" y="7" width="4" height="1" fill={accent}/>
        <rect x="5" y="8" width="2" height="2" fill={accent+"80"}/>
        {/* Arms — coat sleeves */}
        <rect x="0" y="8" width="2" height="4" fill={coat}/>
        <rect x="10" y="8" width="2" height="4" fill={coat}/>
        {/* Hands */}
        <rect x="0" y="12" width="2" height="1" fill={skin}/>
        <rect x="10" y="12" width="2" height="1" fill={skin}/>
        {/* Coat buttons */}
        <rect x="6" y="10" width="1" height="1" fill={accent+"60"}/>
        <rect x="6" y="12" width="1" height="1" fill={accent+"60"}/>
        {/* Pants */}
        <rect x="3" y="13" width="3" height="3" fill={accent+"CC"}/>
        <rect x="7" y="13" width="3" height="3" fill={accent+"CC"}/>
        {/* Shoes */}
        <rect x="2" y="16" width="3" height="2" fill="#1A1A1A"/>
        <rect x="7" y="16" width="3" height="2" fill="#1A1A1A"/>
      </svg>
      {/* Name label */}
      <div style={{
        fontSize: selected ? 8 : 7,
        fontWeight: selected ? 800 : 600,
        color: selected ? accent : color+"BB",
        fontFamily:"'JetBrains Mono',monospace",
        lineHeight:1,
        whiteSpace:"nowrap",
        maxWidth: size + 12,
        overflow:"hidden",
        textOverflow:"ellipsis",
        textAlign:"center",
        transition:"all 0.12s",
      }}>
        {name || initial}
      </div>
    </div>
  );
}

function DoctorSprite({ av, spot, isSel, sz, i, onSelect, selected }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const speed = 200 + (i % 4) * 50; // vary speed per doctor
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), speed);
    return () => clearInterval(interval);
  }, [i]);

  return (
    <div className="press"
      onClick={() => onSelect(isSel ? null : av)}
      style={{
        position:"absolute",
        left:`${spot.x}%`, top:`${spot.y}%`,
        transform:"translate(-50%,-100%)",
        transition:"all 0.15s",
        zIndex: isSel ? 100 : Math.round(spot.y),
      }}>
      <img src={`/sprites/doctor/frame_00${frame}.png`} alt={av.name}
        width={sz} height={sz}
        style={{
          imageRendering:"pixelated", display:"block",
          filter: isSel ? `drop-shadow(0 0 4px ${av.color}) brightness(1.1)` : "none",
        }}/>
      {isSel && (
        <div style={{
          position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",
          background:av.color,color:"#fff",fontSize:10,fontWeight:800,
          padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap",
          fontFamily:"'JetBrains Mono',monospace",
          boxShadow:`0 2px 6px ${av.color}80`,
        }}>
          {av.name.split(" ").slice(-1)[0]}
        </div>
      )}
    </div>
  );
}

function BuildingCard({ building, avatars, selected, onSelect, T }) {
  const { id, label, accent, desc, sprite, floorSpots } = building;
  const count = avatars.length;

  // ── Sprite-based scene ──
  if (sprite && floorSpots) {
    return (
      <div className="anim" style={{position:"relative"}}>
        {/* Name — simple text */}
        <div style={{fontSize:11,fontWeight:700,color:T.text,fontFamily:"'Bricolage Grotesque',sans-serif",marginBottom:4,textAlign:"center"}}>
          {label}
        </div>

        {/* Scene: building + avatars, transparent bg */}
        <div style={{position:"relative"}}>
          <img src={sprite} alt={label} style={{
            width:"100%",height:"auto",display:"block",
            imageRendering:"pixelated",
          }}/>
          {avatars.slice(0, floorSpots.length).map((av, i) => {
            const spot = floorSpots[i];
            const isSel = selected?.name === av.name;
            const sz = isSel ? 72 : 60;
            // Cycle through 4 frames with different speed per doctor
            const frameIdx = Math.floor(Date.now() / (180 + i * 30)) % 4;
            return (
              <DoctorSprite key={av.name} av={av} spot={spot} isSel={isSel} sz={sz} i={i}
                onSelect={onSelect} selected={selected}/>
            );
          })}
          {avatars.length > floorSpots.length && (
            <div style={{
              position:"absolute",bottom:4,right:4,
              background:"#00000088",color:"#fff",fontSize:8,fontWeight:700,
              padding:"2px 5px",borderRadius:4,
              fontFamily:"'JetBrains Mono',monospace",
            }}>
              +{avatars.length - floorSpots.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Fallback: no sprite yet ──
  return (
    <div className="anim" style={{position:"relative"}}>
      <div style={{fontSize:11,fontWeight:700,color:T.text,fontFamily:"'Bricolage Grotesque',sans-serif",marginBottom:4,textAlign:"center"}}>
        {label}
      </div>
      <div style={{
        aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",
        borderRadius:10,border:`1px dashed ${T.border}`,background:T.surface+"40",
      }}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:T.muted}}>{count > 0 ? count+" becado"+(count!==1?"s":"") : "Vac\u00edo"}</div>
        </div>
      </div>
    </div>
  );
}




function getBecadoColor(name, allBecados) {
  const idx = allBecados.indexOf(name);
  if (idx < 0) return "#64748B";
  if (idx < 5) return "#8B73FF";
  if (idx < 10) return "#13C045";
  if (idx < 15) return "#348FFF";
  if (idx < 21) return "#8B73FF";
  if (idx < 27) return "#13C045";
  if (idx < 33) return "#348FFF";
  return "#FB923C";
}

function getCurrentActivity(items, nowMin) {
  if (!items?.length) return null;
  let cur = null;
  for (const it of items) {
    if (t2m(it.time) <= nowMin) cur = it; else break;
  }
  return cur;
}

function activityToBuilding(text) {
  if (!text) return null;
  const a = text.toLowerCase();
  if (a.includes("almuerzo") || a.includes("fin de jornada") || a.includes("pase de visita")) return null;
  if (a.includes("artroscop")) return "jofre";
  if (a.includes("pabellón") || a.includes("pabellon")) return "pabellones";
  if (a.includes("policlínico") || a.includes("policlinico")) return "policlinicos";
  if (a.includes("seminario") || a.includes("reunión") || a.includes("reunion")) return "jofre";
  return "pabellones";
}

function resolveBecadoBuilding(schedItems, turno, seminario, nowMin) {
  if (seminario && nowMin >= 450 && nowMin < 480) return "jofre";
  if (turno?.artroCode === "A" && nowMin >= 780 && nowMin < 840) return "jofre";
  if (turno?.diaCode === "P" && nowMin >= 840 && nowMin < 1080) return "policlinicos";
  if (turno?.diaCode === "D" && nowMin >= 840 && nowMin < 1200) return "urgencia";
  if (turno?.nocheCode === "N" && nowMin >= 1200) return "urgencia";
  const act = getCurrentActivity(schedItems, nowMin);
  return act ? activityToBuilding(act.activity) : null;
}

function MapaVivo({ becados, T, onBack }) {
  const realToday = useMemo(() => todayISO(), []);
  const [date, setDate] = useState(realToday);
  const [simMin, setSimMin] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  const isLive = !demoMode && date === realToday && (() => {
    const now = new Date();
    return Math.abs(simMin - (now.getHours()*60+now.getMinutes())) < 5;
  })();

  const goToday = () => {
    const now = new Date();
    setDate(realToday);
    setSimMin(now.getHours()*60+now.getMinutes());
  };

  const activeBecados = demoMode ? DEMO_MAP_NAMES : becados;

  // Fetch data only when DATE or demoMode changes — not on time slider
  useEffect(() => {
    setLoading(true);
    setSelected(null);
    (async () => {
      try {
        let summary, monthly;

        if (demoMode) {
          await new Promise(r => setTimeout(r, 150));
          summary = demoSummary(date);
          monthly = demoMonthly(date.slice(0,7));
        } else {
          [summary, monthly] = await Promise.all([
            apiGet({ route:"summary", date, token:API_TOKEN }),
            apiGet({ route:"monthly", month:date.slice(0,7), token:API_TOKEN }),
          ]);
        }

        if (!summary.ok || !summary.groups) { setRawData(null); setLoading(false); return; }

        const turnoLookup = {};
        if (monthly.ok !== false) {
          (monthly.entries || []).forEach(e => {
            if (e.date !== date) return;
            if (!turnoLookup[e.name]) turnoLookup[e.name] = {};
            if (e.type === "P" || e.type === "D") turnoLookup[e.name].diaCode = e.type;
            if (e.type === "N") turnoLookup[e.name].nocheCode = "N";
            if (e.type === "A") turnoLookup[e.name].artroCode = "A";
          });
        }

        const scheduledRots = ["H","M","CyP","R","TyP","Col"];
        const rotSchedules = {};

        if (demoMode) {
          scheduledRots.forEach(r => {
            if (!summary.groups[r]?.length) return;
            const acts = DEMO_ACTIVITIES[r] || [];
            const [dy,dm,dd] = date.split("-").map(Number);
            const dow = new Date(dy,dm-1,dd).getDay();
            const hasSem = [2,3,4].includes(dow);
            rotSchedules[r] = {
              items: acts.map(([time, activity]) => ({ time, activity })),
              seminario: hasSem ? { presenter:summary.groups[r][0], title:"Presentación demo", tag:"Seminario", time:"07:30" } : null,
            };
          });
        } else {
          await Promise.all(
            scheduledRots.filter(r => summary.groups[r]?.length > 0).map(async r => {
              try {
                const daily = await apiGet({ route:"daily", becado:summary.groups[r][0], date, token:API_TOKEN });
                if (daily.ok !== false) rotSchedules[r] = { items:daily.items||[], seminario:daily.seminario||null };
              } catch {}
            })
          );
        }

        setRawData({ summary, turnoLookup, rotSchedules });
      } catch(e) {
        console.error("Map error:", e);
        setRawData(null);
      }
      setLoading(false);
    })();
  }, [date, becados, demoMode]);

  // Resolve buildings from time — instant, no API calls
  const buildingMap = useMemo(() => {
    const result = {};
    MAP_BUILDINGS.forEach(b => { result[b.id] = []; });
    if (!rawData?.summary?.groups) return result;

    for (const [rotCode, names] of Object.entries(rawData.summary.groups)) {
      const sched = rawData.rotSchedules[rotCode] || { items:[], seminario:null };
      for (const name of names) {
        if (name === DEMO_BECADO) continue;
        const turno = rawData.turnoLookup[name] || {};
        const building = resolveBecadoBuilding(sched.items, turno, sched.seminario, simMin);
        if (building && result[building]) {
          result[building].push({
            name,
            initial: name.charAt(0).toUpperCase(),
            color: getBecadoColor(name, activeBecados),
            rotation: rotCode,
            rotName: ROT[rotCode]?.name || rotCode,
          });
        }
      }
    }
    return result;
  }, [rawData, simMin, activeBecados]);

  const totalVisible = Object.values(buildingMap).reduce((s, a) => s + a.length, 0);
  const selectedBuilding = selected
    ? MAP_BUILDINGS.find(b => (buildingMap[b.id]||[]).some(a => a.name === selected.name))
    : null;

  // Time presets
  const TIME_PRESETS = [
    { label:"07:30", min:450 },
    { label:"09:00", min:540 },
    { label:"12:00", min:720 },
    { label:"13:00", min:780 },
    { label:"14:00", min:840 },
    { label:"17:00", min:1020 },
    { label:"20:00", min:1200 },
  ];

  return (
    <div style={{minHeight:"100vh",position:"relative",zIndex:1}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>
          {isLive ? "En vivo" : "Simulación"}
        </div>
        <button className="press" onClick={onBack} style={{background:"none",border:"none",padding:0,textAlign:"left",marginBottom:10}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>Mapa del Hospital</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para volver</div>
        </button>

        {/* Date nav */}
        <DateNav date={date} today={realToday}
          onPrev={() => setDate(d => offsetDate(d, -1))}
          onNext={() => setDate(d => offsetDate(d, 1))}
          onToday={goToday} T={T}/>

        {/* Time control */}
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:600,color:T.accent||"#348FFF",minWidth:48}}>
              {m2t(simMin)}
            </span>
            <input type="range" min={420} max={1380} step={15} value={simMin}
              onChange={e => setSimMin(Number(e.target.value))}
              style={{flex:1,height:4,appearance:"none",WebkitAppearance:"none",background:`linear-gradient(to right, ${T.accent||"#348FFF"} ${((simMin-420)/(1380-420))*100}%, ${T.border} ${((simMin-420)/(1380-420))*100}%)`,borderRadius:99,outline:"none",cursor:"pointer",accentColor:T.accent||"#348FFF"}}
            />
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {TIME_PRESETS.map(tp => {
              const active = Math.abs(simMin - tp.min) < 15;
              return (
                <button key={tp.label} className="press" onClick={() => setSimMin(tp.min)}
                  style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${active ? (T.accent||"#348FFF")+"60" : T.border}`,background:active ? (T.accent||"#348FFF")+"18" : T.surface2,fontSize:10,fontWeight:active?700:400,fontFamily:"'JetBrains Mono',monospace",color:active ? (T.accent||"#348FFF") : T.muted,transition:"all 0.12s"}}>
                  {tp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status bar */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {isLive ? (
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#13C045",boxShadow:"0 0 8px #13C045",animation:"neonPulseA 2s ease-in-out infinite"}}/>
              <span style={{fontSize:11,fontWeight:600,color:"#13C045"}}>En vivo</span>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:T.accent||"#348FFF"}}/>
              <span style={{fontSize:11,fontWeight:600,color:T.accent||"#348FFF"}}>{m2t(simMin)}</span>
            </div>
          )}
          <span style={{fontSize:11,color:T.muted}}>·</span>
          <span style={{fontSize:11,color:T.muted}}>{totalVisible} becado{totalVisible!==1?"s":""} en el hospital</span>
          <span style={{fontSize:11,color:T.muted}}>·</span>
          <button className="press" onClick={() => setDemoMode(d => !d)}
            style={{fontSize:10,fontWeight:600,color:demoMode?T.accent||"#348FFF":T.muted,background:demoMode?(T.accent||"#348FFF")+"18":"transparent",border:`1px solid ${demoMode?(T.accent||"#348FFF")+"50":T.border}`,borderRadius:6,padding:"2px 8px"}}>
            {demoMode ? "✦ Demo" : "Demo"}
          </button>
        </div>
      </div>

      <div style={{padding:"0 16px",paddingBottom:40}}>
        {loading ? <Spinner color={T.accent||"#348FFF"}/> : (
          <>
            {/* Building cards — 2x2 grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {MAP_BUILDINGS.map((b, i) => (
                <BuildingCard
                  key={b.id}
                  building={b}
                  avatars={buildingMap[b.id] || []}
                  selected={selected}
                  onSelect={setSelected}
                  T={T}
                />
              ))}
            </div>

            {/* Selected avatar detail */}
            {selected && selectedBuilding && (
              <div className="anim" style={{
                marginTop:10,
                background:T.surface,
                border:`1px solid ${selected.color}40`,
                borderLeft:`3px solid ${selected.color}`,
                borderRadius:12,
                padding:"12px 16px",
                position:"relative",
              }}>
                <button className="press" onClick={() => setSelected(null)}
                  style={{position:"absolute",top:8,right:12,background:"none",border:"none",fontSize:16,color:T.muted,lineHeight:1}}>✕</button>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <PixelAvatar color={selected.color} initial={selected.initial} name={selected.name.split(" ").slice(-1)[0]} size={32} selected={false} onClick={()=>{}}/>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:T.text}}>{selected.name}</div>
                    <div style={{fontSize:11,color:T.muted}}>{selected.rotName}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:selectedBuilding.accent,boxShadow:`0 0 6px ${selectedBuilding.accent}`}}/>
                  <span style={{fontSize:12,fontWeight:600,color:selectedBuilding.accent}}>{selectedBuilding.label}</span>
                  <span style={{fontSize:11,color:T.muted}}>· {selectedBuilding.desc}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


// ── SelectScreen ──────────────────────────────────────────────────────────────
function SelectScreen({ becados, onSelect, onShowRotaciones, onShowTurnos, error, T }) {
  const [univ, setUniv] = useState("UNAB");
  const univCfg  = UNIVERSIDADES[univ];
  const groups   = univCfg.getGroups(becados);

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40}}>
      <div style={{position:"fixed",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"#348FFF08",filter:"blur(50px)",pointerEvents:"none",zIndex:0}}/>

      <div style={{padding:"calc(var(--sat) + 56px) 16px 14px",position:"relative",zIndex:1}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",marginBottom:6}}>
          Traumatología · Becados
        </div>
        <p style={{fontSize:14,color:T.sub,lineHeight:1.5,marginBottom:12}}>
          Elige tu nombre para ver tu horario del día.
        </p>

        <div style={{display:"flex",gap:6,marginBottom:14,background:T.surface2,borderRadius:12,padding:4}}>
          {UNIV_ORDER.map(u => (
            <button key={u} className="press" onClick={() => setUniv(u)}
              style={{
                flex:1,height:32,borderRadius:9,border:"none",
                background: univ===u ? T.surface : "transparent",
                boxShadow: univ===u ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                fontSize:12,fontWeight:univ===u?700:500,
                color: univ===u ? T.text : T.muted,
                transition:"all 0.15s",
              }}>
              {u}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="press anim" onClick={onShowRotaciones}
            style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.sub,animationDelay:"80ms"}}>
            <span>⊞</span> Rotaciones de hoy
          </button>
          <button className="press anim" onClick={onShowTurnos}
            style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.sub,animationDelay:"180ms"}}>
            <span>◷</span> Turnos del mes
          </button>
        </div>
      </div>

      {error && <div style={{margin:"0 16px 12px",position:"relative",zIndex:1}}><ErrorBox msg={error} T={T}/></div>}

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        {groups.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:32,marginBottom:10,opacity:0.2}}>👤</div>
            <div style={{fontSize:14,color:T.muted}}>Sin becados registrados</div>
          </div>
        ) : groups.map((group, gi) => {
          const grpCfg = univCfg.groups[gi] || univCfg.groups[0];
          return (
            <div key={gi} className="anim" style={{marginBottom:20,animationDelay:`${gi*70+120}ms`}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:grpCfg.color,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:grpCfg.color}}/>
                {grpCfg.label}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {group.filter(name => name !== DEMO_BECADO).map(name => (
                  <button key={name} className="press"
                    style={{display:"flex",alignItems:"center",gap:11,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 13px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Inter',sans-serif"}}
                    onClick={() => onSelect(name)}
                  >
                    <span style={{width:32,height:32,borderRadius:8,background:`${grpCfg.color}18`,color:grpCfg.color,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span style={{fontSize:14,fontWeight:500,color:T.text,flex:1}}>{name}</span>
                    <span style={{fontSize:15,color:T.muted}}>›</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="anim" style={{marginBottom:20,animationDelay:"320ms"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:T.muted}}/>
            Modo demo
          </div>
          <button className="press"
            style={{display:"flex",alignItems:"center",gap:11,background:T.surface,border:`1px dashed ${T.border}`,borderRadius:12,padding:"10px 13px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Inter',sans-serif"}}
            onClick={() => onSelect(DEMO_BECADO)}
          >
            <span style={{width:32,height:32,borderRadius:8,background:`${T.muted}18`,color:T.muted,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              ✦
            </span>
            <span style={{fontSize:14,fontWeight:500,color:T.sub,flex:1}}>{DEMO_BECADO}</span>
            <span style={{fontSize:15,color:T.muted}}>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Mi horario ───────────────────────────────────────────────────────────
function TabHorario({ becado, onChangeBecado, T }) {
  const today = useMemo(()=>todayISO(),[]);
  const [date, setDate] = useState(today);
  const [daily, setDaily] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState("");
  const isOnline = useOnline();
  const scrollRef = useRef(null);

  const load = useCallback((targetDate) => {
    const params = {route:"daily",becado,date:targetDate,token:API_TOKEN};
    setError("");
    const bail = setTimeout(() => {
      setDaily(prev => prev ?? { ok:false, rotationCode:"", items:[] });
      setError("No se pudo conectar. Comprueba tu conexión.");
    }, 12000);
    apiSWR(
      params,
      (data) => { clearTimeout(bail); setDaily(data); setIsStale(true); },
      (data, stale) => { clearTimeout(bail); setDaily(data); setIsStale(stale); }
    ).catch(e => { clearTimeout(bail); setDaily(prev => prev ?? { ok:false, rotationCode:"", items:[] }); setError(String(e.message||e)); });
  }, [becado]);

  useEffect(() => { load(date); }, [date, load]);

  useEffect(() => {
    const monday = getWeekDates(today)[0];
    prefetchWeek(becado, monday);
    const nextMonday = offsetDate(monday, 7);
    setTimeout(() => prefetchWeek(becado, nextMonday), 2000);
    if (new Date().getHours() >= 18) {
      prefetch({route:"daily",becado,date:offsetDate(today,1),token:API_TOKEN});
    }
  }, [becado, today]);

  const ptr = usePullToRefresh(() => {
    const params = {route:"daily",becado,date,token:API_TOKEN};
    setError("");
    apiGet(params)
      .then(fresh => { cacheSet(params, fresh); setDaily(fresh); setIsStale(false); })
      .catch(() => {});
  }, scrollRef);

  const c = daily?.rotationCode ? rot(daily.rotationCode) : rot("");
  const grouped = daily ? groupItems(resolveItems(daily.rotationCode, daily.items, date)) : null;

  return (
    <div
      ref={scrollRef}
      style={{position:"relative",overflowY:"auto",minHeight:"100vh"}}
      onTouchStart={ptr.onTouchStart}
      onTouchMove={ptr.onTouchMove}
      onTouchEnd={ptr.onTouchEnd}
    >
      <PullIndicator pullY={ptr.pullY} triggered={ptr.triggered} T={T}/>

      {daily?.rotationCode && (
        <div style={{position:"fixed",top:0,right:0,width:240,height:240,borderRadius:"50%",background:c.glow,filter:"blur(70px)",pointerEvents:"none",zIndex:0}}/>
      )}

      <div style={{padding:"calc(var(--sat) + 20px) 16px 0",position:"relative",zIndex:1}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi horario</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,lineHeight:1.1,
              background:T.accent==="#E8186A" ? "linear-gradient(135deg,#FF1A75,#E8186A,#FF4D94)" : "none",
              WebkitBackgroundClip:T.accent==="#E8186A" ? "text" : "unset",
              WebkitTextFillColor:T.accent==="#E8186A" ? "transparent" : "unset",
              color:T.accent==="#E8186A" ? "transparent" : T.text,
              filter:T.accent==="#E8186A" ? "drop-shadow(0 0 8px #E8186A50)" : "none",
            }}>{becado}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
          </button>
          {daily?.rotationCode && (
            <div style={{display:"flex",alignItems:"center",gap:6,background:c.light,border:`1px solid ${c.accent}30`,borderRadius:99,padding:"5px 11px",flexShrink:0,marginTop:16}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:c.accent,display:"inline-block",boxShadow:`0 0 6px ${c.accent}`}}/>
              <span style={{fontSize:12,fontWeight:600,color:c.accent}}>{c.name}</span>
            </div>
          )}
        </div>
        <DateNav date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)} T={T}/>
      </div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        <OfflineBanner isOnline={isOnline} isStale={isStale} T={T}/>
        <ErrorBox msg={error} T={T}/>
        {grouped === null ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} index={i} T={T}/>)}
          </div>
        ) : (() => {
          const manana   = grouped.filter(it => t2m(it.from) < t2m("13:00"));
          const mediodia = grouped.filter(it => t2m(it.from) >= t2m("13:00") && t2m(it.from) < t2m("14:00"));
          const tarde    = grouped.filter(it => t2m(it.from) >= t2m("14:00"));
          const diaCode  = daily?.turno?.diaCode  || null;
          const nocheCode= daily?.turno?.nocheCode || null;
          const artroCode= daily?.turno?.artroCode || null;
          const hasAny   = manana.length || mediodia.length || tarde.length || diaCode || nocheCode || artroCode;
          if (!hasAny && !error) return (
            <div style={{textAlign:"center",padding:"60px 0"}}>
              <div style={{fontSize:38,marginBottom:10,opacity:0.2}}>📭</div>
              <div style={{fontSize:14,color:T.muted,fontWeight:500}}>Sin actividades este día</div>
            </div>
          );
          const sem = daily?.seminario || null;
          let cardIdx = 0;
          return (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {sem && <SemCard key="sem" presenter={sem.presenter} title={sem.title} tag={sem.tag} index={cardIdx++} T={T}/>}
              {manana.length > 0 && <SectionDivider label="Mañana" T={T}/>}
              {manana.map(it => <ActivityCard key={cardIdx} index={cardIdx++} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>)}

              {(mediodia.length > 0 || artroCode) && <SectionDivider label="Mediodía" T={T}/>}
              {mediodia.map(it => <ActivityCard key={cardIdx} index={cardIdx++} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>)}
              {artroCode && <TurnoCard key="turno-artro" tipo={artroCode} index={cardIdx++} T={T}/>}

              {(tarde.length > 0 || diaCode) && <SectionDivider label="Tarde" T={T}/>}
              {tarde.map(it => <ActivityCard key={cardIdx} index={cardIdx++} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>)}
              {diaCode && <TurnoCard key="turno-dia" tipo={diaCode} index={cardIdx++} T={T}/>}

              {nocheCode && <SectionDivider label="Noche" T={T}/>}
              {nocheCode && <TurnoCard key="turno-noche" tipo={nocheCode} index={cardIdx++} T={T}/>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Tab: Rotaciones ───────────────────────────────────────────────────────────
function TabRotaciones({ onChangeBecado, T }) {
  const today = useMemo(()=>todayISO(),[]);
  const [date, setDate] = useState(today);
  const [summary, setSummary] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState("");
  const isOnline = useOnline();
  const scrollRef = useRef(null);

  const load = useCallback((targetDate) => {
    const params = {route:"summary",date:targetDate,token:API_TOKEN};
    setError("");
    const bail = setTimeout(() => {
      setSummary(prev => prev ?? { ok:false, groups:{} });
      setError("No se pudo conectar. Comprueba tu conexión.");
    }, 12000);
    apiSWR(
      params,
      (data) => { clearTimeout(bail); setSummary(data); setIsStale(true); },
      (data, stale) => { clearTimeout(bail); setSummary(data); setIsStale(stale); }
    ).catch(e => { clearTimeout(bail); setSummary(prev => prev ?? { ok:false, groups:{} }); setError(String(e.message||e)); });
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  useEffect(() => {
    [-1, 1].forEach(offset => prefetch({route:"summary",date:offsetDate(today,offset),token:API_TOKEN}));
  }, [today]);

  const ptr = usePullToRefresh(() => {
    const params = {route:"summary",date,token:API_TOKEN};
    setError("");
    apiGet(params)
      .then(fresh => { cacheSet(params, fresh); setSummary(fresh); setIsStale(false); })
      .catch(() => {});
  }, scrollRef);

  const entries = summary?.groups
    ? ROT_ORDER.filter(k=>summary.groups[k]).map(k=>[k,summary.groups[k]])
    : [];

  return (
    <div
      ref={scrollRef}
      style={{position:"relative",overflowY:"auto",minHeight:"100vh"}}
      onTouchStart={ptr.onTouchStart}
      onTouchMove={ptr.onTouchMove}
      onTouchEnd={ptr.onTouchEnd}
    >
      <PullIndicator pullY={ptr.pullY} triggered={ptr.triggered} T={T}/>

      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Vista general</div>
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>Rotaciones</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para volver</div>
          </button>
        </div>
        <DateNav date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)} T={T}/>
      </div>

      <div style={{padding:"0 16px"}}>
        <OfflineBanner isOnline={isOnline} isStale={isStale} T={T}/>
        <ErrorBox msg={error} T={T}/>
        {summary === null && !error ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[0,1,2,3,4,5].map(i=>(
              <div key={i} className="fade" style={{animationDelay:`${i*45}ms`,background:T.surface,border:`1px solid ${T.border}`,borderTop:`3px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
                  <SkeletonLine width={80} height={13} T={T}/>
                  <SkeletonLine width={60} height={12} T={T}/>
                </div>
                <div style={{padding:"9px 14px 11px",display:"flex",flexDirection:"column",gap:6}}>
                  <SkeletonLine width="60%" height={12} T={T}/>
                  <SkeletonLine width="45%" height={12} T={T}/>
                </div>
              </div>
            ))}
          </div>
        ) : entries.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {entries.map(([code,names],i)=>{
              const c = rot(code);
              return (
                <div key={code} className="anim"
                  style={{animationDelay:`${i*45}ms`,background:T.surface,border:`1px solid ${T.border}`,borderTop:`3px solid ${c.accent}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",background:c.light,borderBottom:`1px solid ${c.accent}18`}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:c.accent,boxShadow:`0 0 6px ${c.accent}`,display:"inline-block"}}/>
                      <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:13,fontWeight:700,color:c.accent}}>{c.name}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:c.accent,background:`${c.accent}18`,border:`1px solid ${c.accent}30`,borderRadius:99,padding:"2px 9px"}}>
                      {names.length} becado{names.length!==1?"s":""}
                    </span>
                  </div>
                  <div style={{padding:"9px 14px 11px",display:"flex",flexDirection:"column",gap:5}}>
                    {names.map((name,ni)=>(
                      <div key={ni} style={{fontSize:13,color:T.sub,display:"flex",alignItems:"center",gap:7}}>
                        <span style={{width:4,height:4,borderRadius:"50%",background:c.accent,opacity:0.55,flexShrink:0}}/>
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !error && (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:38,marginBottom:10,opacity:0.2}}>🗓</div>
            <div style={{fontSize:14,color:T.muted}}>Sin datos para este día</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Mi semana ────────────────────────────────────────────────────────────
function TabSemana({ becado, onChangeBecado, T }) {
  const today = useMemo(()=>todayISO(),[]);
  const [refDate, setRefDate] = useState(today);
  const [lookup, setLookup] = useState({});
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const weekDates = useMemo(()=>getWeekDates(refDate),[refDate]);

  const loadWeek = (dates, force = false) => {
    const cached = {};
    dates.forEach(date => {
      const c = cacheGet({route:"daily", becado, date, token:API_TOKEN});
      if (c && c.ok !== false) cached[date] = c;
    });
    if (Object.keys(cached).length > 0) setLookup(prev => ({...prev, ...cached}));

    const allCached = dates.every(d => !!cacheGet({route:"daily",becado,date:d,token:API_TOKEN}));
    if (allCached && !force) { setLoading(false); return; }
    setLoading(true);
    const monday = dates[0];
    apiGet({ route:"week", becado, start:monday, token:API_TOKEN })
      .then(res => {
        if (!res.ok || !res.days) return;
        const next = {};
        res.days.forEach(day => {
          if (day.ok !== false) {
            cacheSet({route:"daily",becado,date:day.date,token:API_TOKEN}, day);
            next[day.date] = day;
          }
        });
        setLookup(prev => ({...prev, ...next}));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadWeek(weekDates); }, [becado, weekDates]);

  const ptr = usePullToRefresh(() => {
    const monday = weekDates[0];
    apiGet({ route:"week", becado, start:monday, token:API_TOKEN })
      .then(res => {
        if (!res.ok || !res.days) return;
        const next = {};
        res.days.forEach(day => {
          if (day.ok !== false) {
            cacheSet({route:"daily",becado,date:day.date,token:API_TOKEN}, day);
            next[day.date] = day;
          }
        });
        setLookup(prev => ({...prev, ...next}));
      })
      .catch(() => {});
  }, scrollRef);

  const isThisWeek = weekDates.includes(today);
  const days = weekDates.map(date => {
    const d = lookup[date];
    if (!d) return {date, rotationCode:"", items:[], turno:{diaCode:null,nocheCode:null,artroCode:null}, seminario:null};
    return {date, ok:d.ok!==false, rotationCode:d.rotationCode||"", items:d.items||[], turno:d.turno||{diaCode:null,nocheCode:null,artroCode:null}, seminario:d.seminario||null};
  });
  const hasAnyData = Object.keys(lookup).some(k => weekDates.includes(k));

  return (
    <div
      ref={scrollRef}
      style={{position:"relative",overflowY:"auto",minHeight:"100vh"}}
      onTouchStart={ptr.onTouchStart}
      onTouchMove={ptr.onTouchMove}
      onTouchEnd={ptr.onTouchEnd}
    >
      <PullIndicator pullY={ptr.pullY} triggered={ptr.triggered} T={T}/>

      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi semana</div>
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>{becado}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button className="press" onClick={()=>setRefDate(d=>offsetDate(d,-7))}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text}}>{weekRangeLabel(weekDates)}</div>
          <button className="press" onClick={()=>setRefDate(d=>offsetDate(d,7))}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
          {!isThisWeek && (
            <button className="press" onClick={()=>setRefDate(today)}
              style={{height:32,padding:"0 11px",borderRadius:8,border:`1px solid ${T?.accent||"#348FFF"}60`,background:`${T?.accent||"#348FFF"}14`,fontSize:11,fontWeight:700,color:T?.accent||"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
              HOY
            </button>
          )}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        {!hasAnyData && loading ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[0,1,2,3,4,5,6].map(i => <SkeletonWeekCard key={i} index={i} T={T}/>)}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {days.map((day,i)=>{
              const c = rot(day.rotationCode);
              const grouped = groupItems(day.items);
              const isToday = day.date === today;
              return (
                <div key={day.date} className="anim"
                  style={{animationDelay:`${i*35}ms`,background:T.surface,border:`1px solid ${isToday ? c.accent+"60" : T.border}`,borderLeft:`3px solid ${day.rotationCode ? c.accent : T.border}`,borderRadius:12,overflow:"hidden",boxShadow:isToday?`0 0 0 1px ${c.accent}30`:"none"}}>
                  <div style={{padding:"9px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",background: isToday ? c.light : "transparent", borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:12,fontWeight:700,color: isToday ? c.accent : T.sub,textTransform:"capitalize",fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                        {weekLabel(day.date)}
                      </span>
                      {isToday && <span style={{fontSize:9,fontWeight:700,background:c.accent,color:"#fff",borderRadius:99,padding:"1px 6px",letterSpacing:"0.05em"}}>HOY</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {day.rotationCode ? (
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{width:6,height:6,borderRadius:"50%",background:c.accent,display:"inline-block",boxShadow:`0 0 5px ${c.accent}`}}/>
                          <span style={{fontSize:11,fontWeight:600,color:c.accent}}>{c.name}</span>
                        </div>
                      ) : (
                        <span style={{fontSize:11,color:T.muted}}>Sin rotación</span>
                      )}
                      {day.turno?.diaCode && (() => { const t=TURNO[day.turno.diaCode]; return t ? <span style={{fontSize:10,fontWeight:700,color:t.accent,background:t.light,borderRadius:99,padding:"1px 7px",border:`1px solid ${t.accent}30`}}>{t.label}</span> : null; })()}
                      {day.turno?.nocheCode && (() => { const t=TURNO[day.turno.nocheCode]; return t ? <span style={{fontSize:10,fontWeight:700,color:t.accent,background:t.light,borderRadius:99,padding:"1px 7px",border:`1px solid ${t.accent}30`}}>{t.label}</span> : null; })()}
                      {day.turno?.artroCode && (() => { const t=TURNO[day.turno.artroCode]; return t ? <span style={{fontSize:10,fontWeight:700,color:t.accent,background:t.light,borderRadius:99,padding:"1px 7px",border:`1px solid ${t.accent}30`}}>{t.label}</span> : null; })()}
                    </div>
                  </div>
                  {day.seminario && (
                    <div style={{padding:"6px 13px 0",display:"flex",alignItems:"baseline",gap:8}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#E879F9",opacity:0.8,flexShrink:0,minWidth:40}}>07:30</span>
                      <span style={{fontSize:12,color:"#E879F9",lineHeight:1.3,fontWeight:500}}>
                        {day.seminario.presenter}: {day.seminario.title}
                        <span style={{fontSize:10,opacity:0.65,marginLeft:5}}>{day.seminario.tag}</span>
                      </span>
                    </div>
                  )}
                  {grouped.length > 0 ? (
                    <div style={{padding:"8px 13px 10px",display:"flex",flexDirection:"column",gap:4}}>
                      {grouped.map((it,gi)=>(
                        <div key={gi} style={{display:"flex",alignItems:"baseline",gap:8}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:c.accent,opacity:0.7,flexShrink:0,minWidth:40}}>{it.from}</span>
                          <span style={{fontSize:12,color:T.sub,lineHeight:1.3}}>{it.activity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{padding:"7px 13px 9px"}}>
                      <span style={{fontSize:12,color:T.muted}}>{day.seminario ? "" : "Sin actividades"}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function abbrevName(name) {
  if (!name) return "";
  return name.length > 6 ? name.slice(0, 6) : name;
}

// ── Tab: Turnos del mes ───────────────────────────────────────────────────────
const TURNO_COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00" };
const SEMINAR_COLOR = "#E879F9";
const WEEKDAY_LABELS = ["L","M","X","J","V","S","D"];

function getMonthDates(year, month) {
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDow  = (firstDay.getDay() + 6) % 7;
  const slots = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) { slots.push(null); continue; }
    const d = new Date(year, month, dayNum);
    slots.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }
  let last = 41;
  while (last > 0 && slots[last] === null) last--;
  return slots.slice(0, Math.ceil((last + 1) / 7) * 7);
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("es-CL", { month:"long", year:"numeric" });
}

function CalendarGrid({ slots, today, renderCell, T }) {
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {WEEKDAY_LABELS.map(d => (
          <div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.04em",padding:"2px 0"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {slots.map((iso, i) => iso ? renderCell(iso, i) : <div key={i}/>)}
      </div>
    </>
  );
}

const TURNO_TABS = [
  { id:"P", label:"Poli",      color:"#06B6D4" },
  { id:"D", label:"Día",       color:"#F59E0B" },
  { id:"N", label:"Noche",     color:"#4F6EFF" },
  { id:"A", label:"Artro",     color:"#72FF00" },
  { id:"S", label:"Seminarios",color:"#E879F9" },
];

function TabTurnos({ onBack, T }) {
  const today = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);
  const [sub, setSub]     = useState("P");
  const [data, setData]   = useState(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedSem, setSelectedSem] = useState(null);

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;

  const loadData = (mStr) => {
    const params = { route:"monthly", month: mStr, token: API_TOKEN };
    setError("");
    const cached = cacheGet(params);
    if (!cached) setLoading(true);
    apiSWR(params,
      (d) => { setData(d); setLoading(false); },
      (d) => { setData(d); setLoading(false); }
    ).catch(e => { setError(String(e.message||e)); setLoading(false); });
  };

  useEffect(() => { loadData(monthStr); }, [monthStr]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setError("");
    const params = { route:"monthly", month: monthStr, token: API_TOKEN };
    apiGet({ route:"invalidate_cache", token: API_TOKEN })
      .catch(() => {})
      .finally(() => {
        // No borrar caché local — datos viejos visibles hasta que lleguen los nuevos
        apiGet(params)
          .then(fresh => {
            if (!fresh?.ok) { setRefreshing(false); return; }
            cacheSet(params, fresh);
            setData(fresh);
            setRefreshing(false);
          })
          .catch(() => { setRefreshing(false); });
      });
  };

  const prevMonth = () => { setSelectedSem(null); month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1); };
  const nextMonth = () => { setSelectedSem(null); month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1); };

  const slots  = useMemo(() => getMonthDates(year, month), [year, month]);
  const turnoColor = TURNO_TABS.find(t=>t.id===sub)?.color || "#64748B";

  const lookup = useMemo(() => {
    if (!data?.ok) return {};
    const map = {};
    (data.entries||[]).forEach(e => {
      if (e.type !== sub) return;
      if (sub === "S") {
        if (!map[e.date]) map[e.date] = { presenter: e.name, title: e.title, tag: e.tag, time: e.time };
      } else {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push(e.name);
      }
    });
    return map;
  }, [data, sub]);

  const SEM_COLOR = "#E879F9";

  return (
    <div style={{minHeight:"100vh",paddingBottom:24,position:"relative",zIndex:1}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Turnos del mes</div>
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onBack} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>
              {monthLabel(year, month)}
            </div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para volver</div>
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
          <button className="press" onClick={handleRefresh} disabled={refreshing}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:refreshing?0.5:1}}>
            <div style={{width:14,height:14,border:`2px solid ${T.muted}`,borderTopColor:refreshing?"#348FFF":T.muted,borderRadius:"50%",animation:refreshing?"spin 0.7s linear infinite":"none",transition:"border-top-color 0.2s"}}/>
          </button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {TURNO_TABS.map(t => (
            <button key={t.id} className="press" onClick={() => { setSub(t.id); setSelectedSem(null); }}
              style={{flex:1,height:34,borderRadius:9,border:`1px solid ${sub===t.id?t.color+"60":T.border}`,background:sub===t.id?`${t.color}18`:T.surface2,fontSize:11,fontWeight:sub===t.id?700:400,color:sub===t.id?t.color:T.muted,transition:"all 0.15s"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <ErrorBox msg={error} T={T}/>

        {sub === "S" ? (
          loading && !data ? <Spinner color={SEM_COLOR}/> : (
            <>
              <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso, i) => {
                const dayNum  = Number(iso.split("-")[2]);
                const isToday = iso === today;
                const sem     = lookup[iso] || null;
                const isSelected = selectedSem?.date === iso;
                return (
                  <div key={iso}
                    className="press"
                    onClick={() => sem && setSelectedSem(isSelected ? null : { date: iso, sem })}
                    style={{
                      background: isSelected ? `${SEM_COLOR}25` : sem ? `${SEM_COLOR}12` : isToday ? T.surface2 : "transparent",
                      border: `1px solid ${isSelected ? SEM_COLOR+"80" : sem ? SEM_COLOR+"35" : isToday ? SEM_COLOR+"40" : T.border}`,
                      borderRadius: 6, padding: "3px 2px", minHeight: 44,
                      display: "flex", flexDirection: "column", gap: 1,
                      cursor: sem ? "pointer" : "default",
                    }}>
                    <div style={{fontSize:9,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?SEM_COLOR:"transparent",color:isToday?"#fff":sem?SEM_COLOR:T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                    {sem && (
                      <div style={{fontSize:8,fontWeight:600,color:SEM_COLOR,background:`${SEM_COLOR}20`,borderRadius:3,padding:"1px 2px",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {sem.presenter?.split(" ").slice(-1)[0] || sem.presenter}
                      </div>
                    )}
                  </div>
                );
              }}/>

              {selectedSem && (
                <div className="anim" style={{marginTop:14,background:T.surface,border:`1px solid ${SEM_COLOR}40`,borderLeft:`3px solid ${SEM_COLOR}`,borderRadius:12,padding:"14px 16px",position:"relative"}}>
                  <button className="press" onClick={() => setSelectedSem(null)}
                    style={{position:"absolute",top:10,right:12,background:"none",border:"none",fontSize:16,color:T.muted,lineHeight:1}}>✕</button>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:SEM_COLOR,marginBottom:8}}>
                    {formatDate(selectedSem.date)}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:SEM_COLOR,opacity:0.8}}>{selectedSem.sem.time || "07:30"}</span>
                    <span style={{width:1,height:16,background:`${SEM_COLOR}30`}}/>
                    <span style={{fontSize:14,fontWeight:600,color:SEM_COLOR}}>{selectedSem.sem.presenter}</span>
                  </div>
                  <div style={{fontSize:14,color:T.text,lineHeight:1.4,marginBottom:6}}>{selectedSem.sem.title}</div>
                  {selectedSem.sem.tag && (
                    <div style={{display:"inline-flex",alignItems:"center",background:`${SEM_COLOR}15`,border:`1px solid ${SEM_COLOR}30`,borderRadius:99,padding:"3px 10px"}}>
                      <span style={{fontSize:11,color:SEM_COLOR,fontWeight:500}}>{selectedSem.sem.tag}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )
        ) : (
          loading && !data ? <Spinner color={turnoColor}/> : (
            <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso, i) => {
              const dayNum  = Number(iso.split("-")[2]);
              const isToday = iso === today;
              const names   = lookup[iso] || [];
              const has     = names.length > 0;
              return (
                <div key={iso} style={{animationDelay:`${(i%7)*20}ms`,background:has?`${turnoColor}15`:isToday?T.surface2:"transparent",border:`1px solid ${isToday?turnoColor+"60":has?turnoColor+"30":T.border}`,borderRadius:6,padding:"3px 2px",minHeight:44,display:"flex",flexDirection:"column",gap:1}}>
                  <div style={{fontSize:9,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?turnoColor:"transparent",color:isToday?"#fff":has?turnoColor:T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                  {names.slice(0,3).map((name,ni) => (
                    <div key={ni} style={{fontSize:8,fontWeight:600,color:turnoColor,background:`${turnoColor}20`,borderRadius:3,padding:"1px 2px",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{abbrevName(name)}</div>
                  ))}
                  {names.length > 3 && <div style={{fontSize:8,color:turnoColor,opacity:0.6,paddingLeft:1}}>+{names.length-3}</div>}
                </div>
              );
            }}/>
          )
        )}
      </div>
    </div>
  );
}

// ── Tab: Mi mes ───────────────────────────────────────────────────────────────
function TabMes({ becado, onChangeBecado, T }) {
  const today = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);
  const [lookup, setLookup] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshingMes, setRefreshingMes] = useState(false);
  const [error, setError]   = useState("");

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;

  const applyMonthData = (data) => {
    if (!data?.ok || !data.days) return;
    const map = {};
    data.days.forEach(day => { map[day.date] = day; });
    setLookup(map);
    setLoading(false);
  };

  useEffect(() => {
    setError("");
    const params = { route:"personal-month", becado, month:monthStr, token:API_TOKEN };
    const cached = cacheGet(params);
    if (!cached) setLoading(true);
    apiSWR(params, applyMonthData, applyMonthData)
      .catch(e => { setError("Error cargando el mes"); setLoading(false); });
  }, [becado, monthStr]);

  const handleRefreshMes = () => {
    if (refreshingMes) return;
    setRefreshingMes(true);
    const params = { route:"personal-month", becado, month:monthStr, token:API_TOKEN };
    apiGet({ route:"invalidate_cache", token: API_TOKEN })
      .catch(() => {})
      .finally(() => {
        // No borrar caché local — datos viejos visibles hasta que lleguen los nuevos
        apiGet(params)
          .then(fresh => { cacheSet(params, fresh); applyMonthData(fresh); setRefreshingMes(false); })
          .catch(() => { setRefreshingMes(false); });
      });
  };

  const prevMonth = () => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1);

  const slots = useMemo(() => getMonthDates(year, month), [year, month]);

  return (
    <div style={{minHeight:"100vh",paddingBottom:90,position:"relative",zIndex:1}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi mes</div>
        <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left",marginBottom:12}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>{becado}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
          <button className="press" onClick={handleRefreshMes} disabled={refreshingMes}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:refreshingMes?0.5:1}}>
            <div style={{width:14,height:14,border:`2px solid ${T.muted}`,borderTopColor:refreshingMes?"#348FFF":T.muted,borderRadius:"50%",animation:refreshingMes?"spin 0.7s linear infinite":"none",transition:"border-top-color 0.2s"}}/>
          </button>
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {[["P","Poli","#06B6D4"],["D","Día","#F59E0B"],["N","Noche","#4F6EFF"],["A","Artro","#72FF00"],["S","Seminario","#E879F9"]].map(([id,label,color])=>(
            <div key={id} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:color}}/>
              <span style={{fontSize:10,color:T.muted}}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <ErrorBox msg={error} T={T}/>
        {loading && Object.keys(lookup).length === 0 ? <Spinner color="#348FFF"/> : (
          <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso, i) => {
            const dayNum  = Number(iso.split("-")[2]);
            const isToday = iso === today;
            const day     = lookup[iso] || {};
            const diaCode   = day.diaCode   || day.turno?.diaCode   || null;
            const nocheCode = day.nocheCode || day.turno?.nocheCode || null;
            const artroCode = day.artroCode || day.turno?.artroCode || null;
            const hasSem    = day.hasSeminar || !!day.seminario;
            const badges  = [];
            if (diaCode === "P") badges.push({ label:"P", color:"#06B6D4" });
            if (diaCode === "D") badges.push({ label:"D", color:"#F59E0B" });
            if (artroCode === "A") badges.push({ label:"A", color:"#72FF00" });
            if (nocheCode === "N") badges.push({ label:"N", color:"#4F6EFF" });
            if (hasSem) badges.push({ label:"S", color:"#E879F9" });
            const rotC = day.rotationCode ? (ROT[day.rotationCode]?.accent || "#64748B") : null;

            return (
              <div key={iso} style={{background:isToday?T.surface2:"transparent",border:`1px solid ${isToday?"#348FFF60":T.border}`,borderTop:rotC?`2px solid ${rotC}`:`1px solid ${T.border}`,borderRadius:6,padding:"3px 2px",minHeight:48,display:"flex",flexDirection:"column",gap:2}}>
                <div style={{fontSize:9,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?"#348FFF":"transparent",color:isToday?"#fff":T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:1}}>
                  {badges.map((b,bi)=>(
                    <div key={bi} style={{fontSize:8,fontWeight:700,color:b.color,background:`${b.color}25`,borderRadius:3,padding:"1px 3px",lineHeight:1.3}}>{b.label}</div>
                  ))}
                </div>
              </div>
            );
          }}/>
        )}
      </div>
    </div>
  );
}

// ── TabBar ────────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, T }) {
  const isPink = T.accent === "#E8186A";
  const tabs = [
    { id:"horario",    icon:"◑", label:"Mi Horario" },
    { id:"semana",     icon:"▦", label:"Semana" },
    { id:"mes",        icon:"▦□", label:"Mes" },
  ];
  return (
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,
      background: isPink ? "rgba(255,214,234,0.88)" : T.tabBg,
      backdropFilter:"blur(24px)",
      WebkitBackdropFilter:"blur(24px)",
      borderTop: isPink ? "1px solid #F4A8CE60" : `1px solid ${T.border}`,
      display:"flex",
      paddingBottom:"calc(var(--sab) + 8px)",
      zIndex:50,
      boxShadow: isPink ? "0 -4px 24px #E8186A18" : "none",
    }}>
      {tabs.map(tab=>{
        const isActive = active===tab.id;
        return (
          <button key={tab.id} className="press"
            style={{flex:1,border:"none",background:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              color: isPink ? (isActive ? "#E8186A" : "#CF6A9C") : (isActive?T.text:T.muted)
            }}
            onClick={()=>onChange(tab.id)}
          >
            <span style={{
              fontSize:18, lineHeight:1,
              filter: isPink && isActive ? "drop-shadow(0 0 6px #E8186A80)" : "none",
              transition:"filter 0.2s",
            }}>{tab.icon}</span>
            <span style={{fontSize:10,fontWeight:isActive?700:400,letterSpacing:"0.04em",fontFamily:"'Bricolage Grotesque',sans-serif"}}>{tab.label}</span>
            <span style={{
              width:isActive?22:0,height:isPink?3:2,borderRadius:99,
              background: isPink ? "linear-gradient(90deg,#FF4D94,#E8186A)" : (T.accent||"#348FFF"),
              boxShadow: isPink && isActive ? "0 0 8px #E8186A80" : "none",
              transition:"width 0.22s ease",marginTop:1
            }}/>
          </button>
        );
      })}
    </div>
  );
}

// ── Splash screen ─────────────────────────────────────────────────────────────
const SPLASH_TTL = 8 * 60 * 60 * 1000;

function useSplash() {
  const [visible, setVisible] = useState(() => {
    try {
      const raw = localStorage.getItem("lastSeen");
      if (!raw) return true;
      return Date.now() - Number(raw) > SPLASH_TTL;
    } catch { return true; }
  });

  useEffect(() => {
    if (!visible) return;
    try { localStorage.setItem("lastSeen", String(Date.now())); } catch {}
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      try {
        const raw = localStorage.getItem("lastSeen");
        if (!raw || Date.now() - Number(raw) > SPLASH_TTL) {
          localStorage.setItem("lastSeen", String(Date.now()));
          setVisible(true);
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return visible;
}

function Particle({ angle, distance, delay, size, color }) {
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  return (
    <div style={{
      position:"absolute",
      top:"50%", left:"50%",
      width:size, height:size,
      borderRadius:"50%",
      background:color,
      transform:"translate(-50%,-50%)",
      animation:`particle-out 1.4s ${delay}s cubic-bezier(0.15,0.85,0.35,1) both`,
      "--tx":`${x}px`, "--ty":`${y}px`,
    }}/>
  );
}

function MimeFace({ phase }) {
  const fill = "#E6EDF3";
  return (
    <div style={{position:"relative", width:160, height:160, display:"flex", alignItems:"center", justifyContent:"center"}}>
      {phase >= 1 && Array.from({length:14}).map((_,i) => {
        const angle  = (i / 14) * Math.PI * 2 + 0.2;
        const dist   = 78 + (i % 4) * 10;
        const colors = ["#348FFF","#7CB9FF","#ffffff","#348FFF","#B3D4FF","#ffffff"];
        const sizes  = [4,3,5,3,4,3,5];
        return <Particle key={i} angle={angle} distance={dist} delay={0.25 + i*0.045} size={sizes[i%7]} color={colors[i%6]}/>;
      })}

      <svg width="160" height="160" viewBox="180 160 660 720" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: phase >= 1 ? "scale(1) rotate(0deg)" : "scale(0.3) rotate(-15deg)",
          opacity:   phase >= 1 ? 1 : 0,
          transition:"transform 0.65s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        }}>
        <path fill={fill} d="M343.812012,213.738068 C362.727814,201.535263 383.692627,196.350342 405.136353,192.742050 C436.050659,187.540176 467.101715,187.989548 498.254913,190.457138 C529.387268,192.923065 559.961487,198.204666 590.041321,206.518723 C591.253906,206.853882 592.558594,207.467499 594.207031,206.690186 C593.130798,198.308273 592.717041,189.850647 598.079102,182.422485 C601.353882,177.885956 605.366394,174.176559 610.710571,172.193726 C623.099548,167.597153 636.990906,171.167038 644.612305,182.199890 C654.794739,196.940170 650.033752,210.194366 638.386108,222.043610 C640.644409,224.687317 643.616882,225.447205 646.278320,226.662018 C679.531311,241.840607 710.506042,260.551300 737.357178,285.597107 C750.471252,297.829407 761.874268,311.454132 770.424011,327.339600 C777.804138,341.051941 781.785645,355.522736 778.927490,371.061981 C775.319214,390.678986 759.661865,403.724976 738.175720,406.384735 C727.366699,407.722748 716.963806,406.197662 706.603943,403.474640 C701.958923,402.253693 699.314514,403.870880 698.478760,408.559631 C698.304993,409.534607 698.361267,410.552948 698.338013,411.551941 C698.164551,418.988159 698.214355,418.821075 705.567566,420.916382 C724.491577,426.308868 735.214722,439.755005 737.966309,458.358124 C742.725403,490.534332 734.185669,519.093445 710.521851,542.249084 C700.576355,551.981018 688.400757,556.930725 674.457947,557.041077 C670.837769,557.069641 668.829346,557.956360 667.371887,561.616272 C656.377258,589.225525 640.257690,613.515015 619.027222,634.319946 C615.559143,637.718567 613.944702,641.173340 614.068787,646.118896 C614.394653,659.109924 614.432373,672.121460 614.063049,685.109985 C613.917419,690.230042 615.593994,692.364441 620.533142,693.668823 C650.137329,701.487244 679.725525,709.385681 709.171387,717.775757 C723.243408,721.785339 737.113220,726.549683 750.120728,733.546631 C776.164246,747.555786 790.663879,770.300171 799.229309,797.630737 C803.121704,810.050476 806.025696,822.681274 806.325684,835.758118 C806.562866,846.098694 800.600952,852.252441 790.135925,852.352844 C774.304871,852.504883 758.471436,852.428467 742.639038,852.428223 C607.152283,852.426147 471.665558,852.419556 336.178833,852.413940 C303.516846,852.412598 270.854858,852.395813 238.192886,852.427429 C234.475174,852.431030 230.846176,852.138977 227.529922,850.336609 C222.664230,847.692261 219.385757,843.866699 219.648544,838.022400 C221.129120,805.094116 230.709808,775.096924 253.190140,750.343445 C263.031281,739.507141 275.601807,732.137939 289.211212,726.574036 C310.563568,717.844666 333.021210,712.865967 355.153046,706.781982 C372.638123,701.975342 390.156342,697.285706 407.701508,692.703674 C411.352570,691.750183 412.800537,690.043152 412.739136,686.131653 C412.522003,672.302551 412.569519,658.466980 412.714233,644.635986 C412.750397,641.179260 411.636871,638.570679 409.209930,636.227478 C387.291016,615.064331 371.265167,589.947876 359.779816,561.865723 C358.338318,558.341187 356.417023,557.213745 352.722198,557.224731 C339.294434,557.264648 327.670349,552.232605 317.730225,543.443787 C300.033142,527.796387 291.567505,507.345367 287.664764,484.594055 C286.007324,474.931946 286.527252,465.354401 288.616882,455.833038 C293.059998,435.588348 305.528076,423.449646 326.054688,420.009094 C329.961090,419.354340 330.941986,417.987457 330.906677,414.327545 C330.721771,395.164001 330.635712,375.997772 330.745209,356.833832 C330.797485,347.678223 331.193024,338.515289 331.759094,329.375824 C332.043945,324.776459 330.729675,321.125275 328.051971,317.387970 C317.732300,302.984772 311.574188,287.089905 311.476990,269.083069 C311.363434,248.038589 320.204132,231.540619 336.497528,218.718979 C338.716614,216.972748 341.155670,215.506134 343.812012,213.738068 M669.666260,427.574249 C669.630005,411.396820 666.526428,395.874725 660.243042,380.923553 C658.807800,377.508606 656.867676,375.591888 653.444885,374.400635 C632.673950,367.171814 611.502808,361.404816 590.054993,356.600525 C549.491760,347.514374 508.413910,342.684113 466.862610,342.535919 C448.896423,342.471832 430.917480,343.670441 413.035706,345.556305 C403.299469,346.583099 393.534088,347.809601 384.088043,350.633331 C382.048126,351.243134 379.898010,351.673187 378.766541,353.935059 C370.634674,370.190918 362.798248,386.617310 359.343323,404.592804 C356.592377,418.905884 358.014465,433.503479 358.035980,447.965424 C358.082581,479.292877 362.721893,509.913269 373.302948,539.535828 C390.378204,587.339539 417.910767,626.373169 464.474426,649.872131 C485.990051,660.730164 508.115173,666.854309 532.353638,661.707581 C545.070251,659.007324 556.517334,653.420166 567.741211,647.093933 C586.200073,636.689819 602.819336,624.116699 616.317810,607.625732 C633.738464,586.343079 646.088867,562.376648 654.648071,536.319458 C666.154663,501.289246 669.662964,465.173615 669.666260,427.574249 M457.856659,722.628845 C478.050690,735.171936 499.920319,740.206604 523.619690,737.800659 C547.361023,735.390381 567.784302,726.173340 584.784912,709.346008 C589.749878,704.431763 592.505920,699.112366 592.024414,691.735107 C591.385986,681.952271 591.865417,672.097961 591.799133,662.274841 C591.788330,660.679993 592.247070,658.972961 591.191650,657.461792 C589.509338,657.309265 588.370117,658.434509 587.109436,659.130127 C576.756348,664.843567 566.203796,670.177124 555.253113,674.619690 C536.378784,682.276794 516.851257,684.799255 496.597870,681.673706 C476.021027,678.498230 457.412415,670.341309 439.584167,660.013306 C438.099670,659.153259 436.781464,657.550476 434.204926,658.338745 C434.204926,671.710083 434.196167,685.163574 434.215302,698.617065 C434.217865,700.413879 435.428741,701.655273 436.450500,702.968811 C442.331573,710.529236 449.408539,716.794250 457.856659,722.628845 M638.651367,810.574768 C638.555969,800.354980 639.897400,801.148499 629.302856,801.134521 C582.159485,801.072266 535.016052,801.059998 487.872650,801.047546 C457.554291,801.039551 427.235962,801.054260 396.917603,801.077148 C388.155365,801.083801 388.158081,801.112915 388.108612,809.637512 C388.080597,814.468262 388.005341,819.299133 388.016602,824.129822 C388.034546,831.847534 388.057526,831.858032 395.689301,831.858032 C462.822815,831.858032 529.956360,831.851807 597.089844,831.853210 C608.584106,831.853455 620.078430,831.920105 631.572510,831.881897 C638.616821,831.858459 638.626953,831.795166 638.656372,824.545166 C638.673950,820.214050 638.653320,815.882751 638.651367,810.574768 M623.491028,770.785461 C626.988281,770.778870 630.490356,770.655762 633.981506,770.799011 C637.408508,770.939697 638.755066,769.500488 638.694031,766.074951 C638.560547,758.583496 638.666748,751.087891 638.659363,743.593994 C638.651917,736.089844 638.643738,736.043579 630.877258,736.005798 C618.222473,735.944275 605.559021,736.201050 592.917114,735.783020 C588.834106,735.647949 585.597107,736.414124 582.217773,738.587402 C560.801208,752.360840 537.211487,759.357910 511.831726,759.074829 C488.093384,758.810181 465.910309,752.176941 445.488586,739.885376 C442.541443,738.111572 439.897125,735.452820 436.161224,735.439270 C421.839844,735.387512 407.518158,735.441772 393.196564,735.431763 C389.741425,735.429321 388.033508,736.821289 388.129089,740.540894 C388.304382,747.364197 388.148621,754.195312 388.191376,761.022827 C388.258728,771.779968 386.845764,770.726807 397.677063,770.732178 C472.615967,770.768982 547.554871,770.769836 623.491028,770.785461 M509.640594,304.082092 C495.652283,301.807678 481.526215,300.889435 467.400330,300.398621 C446.748505,299.681000 426.082947,299.865448 405.529510,302.382111 C389.471436,304.348328 373.702087,307.710144 358.440186,313.201050 C356.913483,313.750336 354.681091,313.999786 354.614288,315.924988 C354.393402,322.292419 354.531006,328.672272 354.531006,335.554810 C359.155273,334.133636 362.934509,332.933075 366.736664,331.810089 C388.873566,325.272034 411.788055,325.047974 434.520966,324.085999 C465.153046,322.789825 495.730255,324.145050 526.265747,327.458405 C561.486694,331.280151 595.914368,338.582397 629.709900,348.979309 C648.290161,354.695312 666.479309,361.560242 684.477600,368.907410 C632.234375,331.945038 573.019226,313.671387 509.640594,304.082092 M701.509216,831.906799 C705.502686,831.913452 709.496094,831.924622 713.489563,831.925964 C735.286926,831.933350 757.084351,831.953796 778.881714,831.935242 C785.957581,831.929199 785.760742,831.903748 784.992004,825.070679 C784.241455,818.398560 782.095154,812.120300 780.349915,805.714294 C779.426941,802.326416 777.603027,800.833435 773.950928,800.904602 C764.303894,801.092712 754.650879,800.968994 745.000244,800.984253 C727.695618,801.011597 710.390381,801.144531 693.086914,801.017212 C688.763916,800.985413 687.042053,802.484741 687.342651,806.842896 C687.616699,810.817322 687.404114,814.825623 687.396667,818.819031 C687.372253,831.944275 687.370605,831.944275 701.509216,831.906799 M290.500000,831.949219 C304.814575,831.961853 319.130371,831.873657 333.442902,832.050964 C337.516846,832.101379 339.129822,830.735596 338.981079,826.576233 C338.737274,819.760254 338.723999,812.924011 338.953186,806.107727 C339.089783,802.044739 337.318695,800.896667 333.591187,801.003235 C327.604156,801.174500 321.608276,801.041016 315.616150,801.030823 C294.810181,800.995483 274.004181,800.934692 253.198273,800.948975 C250.472321,800.950806 247.396301,800.381348 246.235092,804.170410 C244.041595,811.327942 242.005722,818.489929 241.238419,825.992615 C240.763840,830.632996 242.462494,832.109802 247.057007,832.036560 C261.201538,831.810852 275.351898,831.951233 290.500000,831.949219 M342.670868,503.681305 C341.659576,498.129395 340.541077,492.594513 339.658234,487.022247 C337.472717,473.227814 336.064545,459.356110 335.404938,445.394867 C335.122070,439.407776 333.745514,438.530853 327.834869,439.504425 C317.212494,441.254089 311.377991,448.128143 308.368927,457.951660 C304.921265,469.207184 306.537323,480.309479 309.331635,491.389709 C313.444824,507.699860 321.344788,521.623962 335.006622,531.832520 C339.391754,535.109192 344.180023,537.585449 350.558044,536.830078 C347.311035,525.937500 344.853027,515.275757 342.670868,503.681305 M693.219666,439.507111 C690.784302,440.582825 691.414429,442.807800 691.309265,444.719116 C690.073242,467.168182 687.621399,489.467682 682.811829,511.454010 C681.011841,519.682495 678.834778,527.828491 676.675659,536.640625 C684.344116,536.493774 690.425964,533.681824 695.466125,528.968689 C715.324768,510.398529 721.406189,486.854706 718.358215,460.767944 C716.710754,446.668213 706.391113,438.469910 693.219666,439.507111 M293.499939,771.658813 C306.809387,771.650879 320.120605,771.517639 333.427185,771.708679 C337.607666,771.768738 339.021515,770.204163 338.936157,766.172974 C338.763702,758.024841 338.691803,749.863342 338.974548,741.721191 C339.130432,737.232117 337.342163,735.614136 333.121948,736.173218 C331.647339,736.368530 330.152100,736.525757 328.719788,736.903503 C320.207611,739.148438 311.704163,741.427429 303.210968,743.743408 C289.184296,747.568176 277.352478,754.934265 267.795746,765.900085 C266.656830,767.207031 264.896118,768.260681 265.505493,771.658386 C274.368744,771.658386 283.434357,771.658386 293.499939,771.658813 M702.582275,771.657532 C722.292908,771.657532 742.003479,771.657532 762.404846,771.657532 C759.795227,766.626953 756.682861,763.427063 753.309814,760.496582 C736.404114,745.808838 715.237244,741.432495 694.399719,736.281555 C693.926636,736.164734 693.400452,736.283325 692.905457,736.231445 C689.563232,735.880859 687.998657,737.187073 688.094849,740.730774 C688.252869,746.554932 688.130432,752.386597 688.127625,758.215088 C688.121216,771.633606 688.121521,771.633606 702.582275,771.657532 z"/>
        <path fill={fill} d="M615.170288,461.787567 C609.934937,472.750122 601.266602,477.960571 589.850037,477.309662 C580.139160,476.755951 570.695190,469.805328 567.784851,461.070007 C564.176392,450.239166 566.814697,440.171722 575.131470,433.035889 C583.022583,426.265289 596.337036,425.698517 605.474976,431.744202 C615.772278,438.556885 619.141846,448.739471 615.170288,461.787567 z"/>
        <path fill={fill} d="M454.078278,472.216827 C436.328308,483.256104 416.534424,474.567474 413.268066,454.636841 C410.927063,440.352478 424.476135,426.478485 439.866760,427.400299 C450.626007,428.044708 459.695831,434.193237 462.393738,444.110687 C465.247589,454.601532 463.631073,464.613678 454.078278,472.216827 z"/>
        <path fill={fill} d="M626.552979,406.514496 C622.949097,405.782349 620.678772,403.395874 617.959412,401.825867 C605.442993,394.599396 591.901245,391.036072 577.547119,390.327606 C570.379150,389.973816 565.960876,386.282776 565.933167,380.507263 C565.904114,374.435730 570.413574,370.532898 577.828369,370.693024 C598.481384,371.139038 616.252808,379.195190 632.252136,391.732422 C635.737000,394.463196 636.330444,398.255035 634.951965,402.109070 C633.690430,405.635986 630.690491,407.039825 626.552979,406.514496 z"/>
        <path fill={fill} d="M435.426575,373.232361 C442.455688,371.408203 449.157104,370.249725 456.045959,370.619110 C461.799347,370.927673 465.711121,374.429718 466.178070,379.691193 C466.596863,384.410095 463.160034,388.731110 457.561127,389.568970 C450.341492,390.649353 443.055542,391.092163 435.895874,392.813904 C426.876221,394.982941 418.521667,398.456085 410.820099,403.575500 C410.265625,403.944061 409.723022,404.334045 409.147675,404.666992 C404.587799,407.305695 400.445068,406.940857 397.873840,403.687378 C395.065338,400.133698 395.665039,395.916565 399.766418,392.246368 C409.982635,383.104248 421.583557,376.493958 435.426575,373.232361 z"/>
        <path fill={fill} d="M498.775146,597.517944 C491.270508,595.561584 485.452332,591.407410 479.903015,586.865112 C476.468628,584.053955 475.381714,578.837463 477.702972,576.241577 C480.733734,572.852356 484.481934,573.196777 488.182312,575.098755 C489.496216,575.774048 490.637451,576.800110 491.819214,577.715576 C507.193481,589.624023 528.206421,585.469971 538.096985,568.556946 C539.434814,566.269287 540.545837,563.818420 543.211670,562.648071 C546.801208,561.072266 549.332520,561.806885 550.592041,565.746765 C552.377563,571.331848 550.672668,576.181824 547.574097,580.796021 C539.272095,593.158936 517.139038,603.267517 498.775146,597.517944 z"/>
        <path fill={fill} d="M446.651062,528.753052 C442.862823,531.572388 438.985992,532.730347 434.632538,532.267822 C427.960968,531.559326 422.515320,526.294800 422.554138,519.839600 C422.626526,507.805969 429.726837,498.935547 436.443329,488.637939 C443.926086,498.381805 449.718262,507.547821 451.158783,518.776550 C451.643982,522.558777 449.781830,525.883362 446.651062,528.753052 z"/>
        <path fill={fill} d="M599.787720,498.281372 C603.678223,504.736420 607.252319,510.918243 607.611450,518.365784 C608.001038,526.445923 602.620667,532.016235 594.086975,532.282166 C585.567688,532.547729 578.688538,526.841919 579.110107,519.089050 C579.735718,507.583801 586.446472,498.853241 592.937927,489.788666 C596.248474,492.270905 597.838562,495.190033 599.787720,498.281372 z"/>
      </svg>
    </div>
  );
}

function SplashScreen() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"#0D1117",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      opacity: phase === 2 ? 0 : 1,
      transition: phase === 2 ? "opacity 0.6s ease" : "none",
      pointerEvents:"none",
    }}>
      <style>{`
        @keyframes particle-out {
          0%   { transform:translate(-50%,-50%) translate(0,0) scale(0); opacity:1; }
          70%  { opacity:0.8; }
          100% { transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(1.2); opacity:0; }
        }
        @keyframes title-in {
          0%   { opacity:0; transform:translateY(20px) scale(0.9); }
          100% { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes sub-in {
          0%   { opacity:0; letter-spacing:0.3em; }
          100% { opacity:0.55; letter-spacing:0.12em; }
        }
        @keyframes glow-pulse {
          0%,100% { transform:translate(-50%,-50%) scale(1); opacity:0.12; }
          50%      { transform:translate(-50%,-50%) scale(1.2); opacity:0.2; }
        }
      `}</style>

      <div style={{
        position:"absolute", top:"40%", left:"50%",
        width:300, height:300, borderRadius:"50%",
        background:"#348FFF",
        filter:"blur(80px)",
        animation: phase >= 1 ? "glow-pulse 2s ease infinite" : "none",
        opacity:0.12,
        pointerEvents:"none",
      }}/>

      <MimeFace phase={phase}/>

      <div style={{
        fontFamily:"'Bricolage Grotesque',sans-serif",
        fontSize:40, fontWeight:800,
        color:"#ffffff",
        letterSpacing:"-0.03em",
        marginTop:16,
        textShadow:"0 0 24px #348FFF, 0 0 48px #348FFF80, 0 2px 8px rgba(0,0,0,0.4)",
        animation: phase >= 1 ? "title-in 0.65s 0.18s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
        opacity: phase >= 1 ? undefined : 0,
      }}>
        MimApp
      </div>

      <div style={{
        fontFamily:"'Inter',sans-serif",
        fontSize:11, fontWeight:400,
        color:"#348FFF",
        marginTop:8,
        animation: phase >= 1 ? "sub-in 0.7s 0.38s cubic-bezier(0.4,0,0.2,1) both" : "none",
        opacity: phase >= 1 ? undefined : 0,
      }}>
        created by Mimo
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const showSplash = useSplash();
  const [previewSplash, setPreviewSplash] = useState(false);
  const [theme, setTheme]             = useState(() => safeStorage.get("theme") || "dark");
  const [showSettings, setShowSettings] = useState(false);
  const [becado, setBecado]           = useState(() => safeStorage.get("selectedBecado") || "");
  const [becados, setBecados]         = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError]     = useState("");
  const [activeTab, setActiveTab]     = useState(() => safeStorage.get("activeTab") || "horario");
  const [showTurnos, setShowTurnos]       = useState(false);
  const [showRotaciones, setShowRotaciones] = useState(false);
  const [showMapa, setShowMapa]           = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const ACCENT = ACCENT_MAP[theme] || "#348FFF";
  const T = { ...THEMES[theme], accent: ACCENT };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    safeStorage.set("activeTab", tab);
    // Scroll al top al cambiar de tab
    const root = document.getElementById("root");
    if (root) root.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const toggleTapCount = useRef(0);
  const toggleTapTimer = useRef(null);

  const applyTheme = (next) => {
    setTheme(next);
    safeStorage.set("theme", next);
    const bg = THEME_BG[next] || "#0D1117";
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", bg);
    document.body.style.background = bg;
    document.body.classList.toggle("theme-pink", next === "pink");
    ["ocean","sunset","forest","aurora","neon","synthwave","cryo","cosmos","tormenta"].forEach(t =>
      document.body.classList.toggle("theme-"+t, next === t)
    );
  };

  const toggleTheme = () => {
    const isSecret = ["pink","ocean","sunset","forest","aurora","neon","synthwave","cryo","cosmos","tormenta"].includes(theme);
    if (!isSecret) {
      toggleTapCount.current += 1;
      clearTimeout(toggleTapTimer.current);
      if (toggleTapCount.current >= 5) {
        toggleTapCount.current = 0;
        setShowThemePicker(true);
        return;
      }
      toggleTapTimer.current = setTimeout(() => { toggleTapCount.current = 0; }, 3000);
    }
    const next = theme === "light" ? "dark" : "light";
    applyTheme(next);
  };

  useEffect(() => {
    const bg = THEME_BG[theme] || "#0D1117";
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", bg);
    document.body.style.background = bg;
    document.body.classList.toggle("theme-pink", theme === "pink");
    ["ocean","sunset","forest","aurora","neon","synthwave","cryo","cosmos","tormenta"].forEach(t =>
      document.body.classList.toggle("theme-"+t, theme === t)
    );
    // Bloquear zoom — PWA no lo necesita
    const vp = document.querySelector("meta[name='viewport']");
    if (vp) vp.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover");
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => purgeCacheStorage());
    } else {
      setTimeout(() => purgeCacheStorage(), 2000);
    }
    // Chequear si el Sheet fue editado — si sí, limpia caché local
    checkDataVersion();
  }, []);

  useEffect(() => {
    const params = {route:"becados",token:API_TOKEN};
    apiSWR(
      params,
      (data) => { if (data.ok && data.becados) { setBecados([...data.becados, DEMO_BECADO]); setLoadingInit(false); } },
      (data) => { if (data.ok && data.becados) { setBecados([...data.becados, DEMO_BECADO]); setLoadingInit(false); } }
    ).catch(e => { setInitError(String(e.message||e)); setLoadingInit(false); });
  }, []);

  useEffect(() => {
    prefetch({route:"summary",date:todayISO(),token:API_TOKEN});
  }, []);

  const handleSelect = name => { safeStorage.set("selectedBecado", name); setBecado(name); };
  const handleChange = () => {
    safeStorage.remove("selectedBecado");
    safeStorage.remove("activeTab");
    setBecado("");
    setActiveTab("horario");
  };
  const handleShowRotaciones = () => { setShowRotaciones(true); };
  const handleShowTurnos     = () => { setShowTurnos(true); };
  const handleShowMapa       = () => { setShowMapa(true); };

  if (loadingInit) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style><Spinner/>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh",
      background: theme === "pink"
        ? "linear-gradient(145deg, #FFD6EA 0%, #FEE6F2 35%, #FCDAED 70%, #FFB3D1 100%)"
        : T.bg,
      maxWidth:480,
      margin:"0 auto",
      fontFamily:"'Inter',sans-serif",
      paddingBottom: becado ? 72 : 0,
      position:"relative",
    }}>
      <style>{CSS}</style>
      {theme === "pink" && <SakuraPetals/>}
      {(showSplash || previewSplash) && <SplashScreen/>}

      <GearBtn onClick={()=>setShowSettings(s=>!s)} T={T}/>
      {showSettings && (
        <SettingsPanel theme={theme} onToggle={toggleTheme} onClose={()=>setShowSettings(false)} onPreviewSplash={()=>{setShowSettings(false);setPreviewSplash(true);setTimeout(()=>setPreviewSplash(false),2700);}} onSwapTurnos={()=>{setShowSettings(false);setShowSwap(true);}} T={T}/>
      )}
      {showSwap && <SwapTurnos becados={becados} onClose={()=>setShowSwap(false)} T={T}/>}
      {showThemePicker && <ThemePicker current={theme} onSelect={applyTheme} onClose={()=>setShowThemePicker(false)} onShowMapa={()=>{setShowThemePicker(false);setShowMapa(true);}}/>}
      {theme === "ocean"  && <OceanBubbles/>}
      {theme === "aurora" && <AuroraEffect/>}
      {theme === "forest" && <ForestFireflies/>}
      {theme === "sunset" && <SunsetEmbers/>}
      {theme === "neon"      && <NeonGrid/>}
      {theme === "synthwave" && <SynthwaveEffect/>}
      {theme === "cryo"      && <CryoEffect/>}
      {theme === "cosmos"    && <CosmosEffect/>}
      {theme === "tormenta" && <StormEffect/>}

      {!becado ? (
        showRotaciones
          ? <TabRotaciones onChangeBecado={()=>setShowRotaciones(false)} T={T}/>
        : showTurnos
          ? <TabTurnos onBack={() => setShowTurnos(false)} T={T}/>
        : showMapa
          ? <MapaVivo becados={becados} T={T} onBack={() => setShowMapa(false)}/>
          : <SelectScreen becados={becados} onSelect={handleSelect} onShowRotaciones={handleShowRotaciones} onShowTurnos={handleShowTurnos} error={initError} T={T}/>

      ) : (
        <>
          <div className={activeTab==="horario"?"tab-in":""} style={{display:activeTab==="horario"?"block":"none"}}><TabHorario becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <div className={activeTab==="semana"?"tab-in":""} style={{display:activeTab==="semana"?"block":"none"}}><TabSemana becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <div className={activeTab==="mes"?"tab-in":""} style={{display:activeTab==="mes"?"block":"none"}}><TabMes becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <TabBar active={activeTab} onChange={handleTabChange} T={T}/>
        </>
      )}
    </div>
  );
}
