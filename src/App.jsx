import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbz9Zme-RquoB2GVh6yj9v9Yl2xFAq2JKO5RnM_Cm5-EYgEQV6CWsD5H4ai3ZtmKiq4U/exec";
const API_TOKEN = "queseyo_calendriobecados2026";

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
  "":  { accent:"#64748B", glow:"#64748B28", light:"#64748B12", dark:"#64748B22", name:"Sin rotación" },
};
const ROT_ORDER = ["H","M","CyP","R","TyP","Col","I","A","rx","F","V",""];

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
      // localStorage lleno → limpiar caché expirado e intentar de nuevo
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

// Elimina entradas de caché expiradas del localStorage
// Se llama al iniciar la app y cuando el storage se llena
function purgeCacheStorage() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("cache:"));
    let removed = 0;
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const { ts, ttl } = JSON.parse(raw);
        const expired = Date.now() - ts > (ttl || 30 * 60 * 1000);
        // También eliminar entradas de días pasados aunque no hayan expirado
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

// ── Sistema de caché ──────────────────────────────────────────────────────────
// ── Caché inteligente con TTL dinámico ───────────────────────────────────────
// daily → expira a medianoche (los horarios no cambian durante el día)
// summary/monthly → expira en 4h (rotaciones cambian poco)
// becados → expira en 24h (la lista rara vez cambia)
// Por defecto → 1h

function cacheTTL(params) {
  const route = (params.route || "").toLowerCase();
  if (route === "daily") {
    // Expira a medianoche del día pedido
    const dateStr = params.date || todayISO();
    const [y,m,d] = dateStr.split("-").map(Number);
    const midnight = new Date(y, m-1, d+1, 0, 0, 0).getTime();
    return midnight - Date.now();
  }
  if (route === "summary")  return 24 * 60 * 60 * 1000; // 24h
  if (route === "monthly")  return 24 * 60 * 60 * 1000; // 24h
  if (route === "becados")  return  7 * 24 * 60 * 60 * 1000; // 7 días
  return 24 * 60 * 60 * 1000; // 24h por defecto
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
    if (ttl <= 0) return; // ya expiró (ej. día pasado)
    safeStorage.set(cacheKey(params), JSON.stringify({ data, ts: Date.now(), ttl }));
  } catch {}
}

// ── API ───────────────────────────────────────────────────────────────────────
async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Cache-first: mostrar caché instantáneamente, revalidar en background
// solo UNA vez por sesión por clave (no en cada cambio de tab)
const _revalidatedThisSession = new Set();

function cacheAge(params) {
  try {
    const raw = safeStorage.get(cacheKey(params));
    if (!raw) return Infinity;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts;
  } catch { return Infinity; }
}

// SWR_REVALIDATE_AFTER ya no se usa para tabs — solo para decidir si
// vale la pena revalidar en segundo plano por primera vez en la sesión
const SWR_REVALIDATE_AFTER = 5 * 60 * 1000; // 5 min mínimo para revalidar

async function apiSWR(params, onImmediate, onFresh) {
  const cached = cacheGet(params);
  const key    = cacheKey(params);

  if (cached) {
    // Mostrar caché inmediatamente — el usuario no espera nada
    onImmediate(cached, true);

    // Revalidar en background solo si:
    // 1) No lo hemos revalidado ya en esta sesión, Y
    // 2) El caché tiene más de 5 minutos (evita calls al abrir recién)
    if (!_revalidatedThisSession.has(key) && cacheAge(params) > SWR_REVALIDATE_AFTER) {
      _revalidatedThisSession.add(key);
      apiGet(params)
        .then(fresh => { cacheSet(params, fresh); onFresh(fresh, false); })
        .catch(() => { onFresh(cached, false); }); // silencioso, ya tiene datos
    } else {
      onFresh(cached, false);
    }
    return cached;
  }

  // Sin caché → fetch obligatorio
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

// Prefetch silencioso
function prefetch(params) {
  if (cacheGet(params)) return;
  apiGet(params)
    .then(d => { if (d.ok !== false) cacheSet(params, d); })
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
  html, body { background: #0D1117; }
  html { -webkit-text-size-adjust: 100%; }
  body { overscroll-behavior-y: contain; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .anim  { animation: fadeUp 0.28s ease both; }
  .fade  { animation: fadeIn 0.2s ease both; }
  .press { transition: transform 0.1s, opacity 0.1s; -webkit-tap-highlight-color: transparent; cursor: pointer; user-select: none; }
  .press:active { transform: scale(0.96); opacity: 0.82; }
  ::-webkit-scrollbar { width: 0; }
`;

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

  const onTouchStart = useCallback((e) => {
    const el = scrollRef?.current;
    if (el && el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [scrollRef]);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || startY.current === null) return;
    const el = scrollRef?.current;
    if (el && el.scrollTop > 0) { pulling.current = false; startY.current = null; return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) return;
    const y = Math.min(delta * 0.45, PTR_THRESHOLD + 20);
    setPullY(y);
    if (y >= PTR_THRESHOLD && !triggered) setTriggered(true);
    if (y < PTR_THRESHOLD && triggered) setTriggered(false);
  }, [triggered, scrollRef]);

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

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({ theme, onToggle, onClose, onPreviewSplash, T }) {
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
        <button className="press" onClick={onPreviewSplash}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>🎭</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Ver intro</span>
        </button>
        <button className="press" onClick={onToggle}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:16}}>{theme==="dark" ? "🌙" : "☀️"}</span>
            <span style={{fontSize:13,fontWeight:500,color:T.text}}>{theme==="dark" ? "Dark" : "Light"}</span>
          </div>
          <div style={{width:36,height:20,borderRadius:99,background:theme==="dark"?"#348FFF":T.border,position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:theme==="dark"?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
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
          style={{height:32,padding:"0 11px",borderRadius:8,border:"1px solid #348FFF60",background:"#348FFF14",fontSize:11,fontWeight:700,color:"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
          HOY
        </button>
      )}
    </div>
  );
}

// ── Activity card ─────────────────────────────────────────────────────────────
function ActivityCard({ from, to, activity, accent, light, glow, index, T }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: pressed ? light : T.surface,
        border: `1px solid ${pressed ? accent+"50" : T.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: pressed ? `0 0 14px ${glow}` : "none",
        transition: "all 0.12s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:48,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:accent,lineHeight:1.2}}>{from}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:accent,opacity:0.45,lineHeight:1.2,marginTop:2}}>{to}</div>
      </div>
      <div style={{width:1,height:28,background:`${accent}25`,flexShrink:0}}/>
      <div style={{fontSize:14,color:T.text,fontWeight:400,lineHeight:1.35,flex:1}}>{activity}</div>
    </div>
  );
}


// ── Colores de turno ──────────────────────────────────────────────────────────
const TURNO = {
  P: { accent:"#06B6D4", light:"#06B6D412", glow:"#06B6D428", label:"Turno Poli",  desde:"14:00", hasta:"17:59" },
  D: { accent:"#F59E0B", light:"#F59E0B12", glow:"#F59E0B28", label:"Turno Día",   desde:"14:00", hasta:"19:59" },
  N: { accent:"#818CF8", light:"#818CF812", glow:"#818CF828", label:"Turno Noche", desde:"20:00", hasta:"--"    },
};

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider({ label, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0 4px"}}>
      <div style={{height:1,flex:1,background:T.border}}/>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted}}>{label}</span>
      <div style={{height:1,flex:1,background:T.border}}/>
    </div>
  );
}

// ── Turno card ────────────────────────────────────────────────────────────────
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
const SEMINAR_ACCENT = "#E879F9"; // violeta-rosa brillante
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
    // Los becados se asignan por posición desde la lista de la API: primeros 15
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
    // UANDES: posiciones 15-32 (18 becados, 6 por año)
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
    // IST: posiciones 33-35
    getGroups: (becados) => [
      becados.slice(33,36),
    ].filter(g => g.length > 0),
  },
};
const UNIV_ORDER = ["UNAB","UANDES","IST"];

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

        {/* Pill selector universidades */}
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

        {/* Botones de acceso rápido */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="press anim" onClick={onShowRotaciones}
            style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.sub,animationDelay:"80ms"}}>
            <span>⊞</span> Rotaciones de hoy
          </button>
          <button className="press anim" onClick={onShowTurnos}
            style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.sub,animationDelay:"130ms"}}>
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
                {group.map(name => (
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
    apiSWR(
      params,
      (data) => { setDaily(data); setIsStale(true); },
      (data, stale) => { setDaily(data); setIsStale(stale); }
    ).catch(e => setError(String(e.message||e)));
  }, [becado]);

  useEffect(() => { load(date); }, [date, load]);

  // Prefetch semana + día siguiente si es tarde
  useEffect(() => {
    const weekDates = getWeekDates(today);
    weekDates.forEach(d => prefetch({route:"daily",becado,date:d,token:API_TOKEN}));
    if (new Date().getHours() >= 18) {
      prefetch({route:"daily",becado,date:offsetDate(today,1),token:API_TOKEN});
    }
  }, [becado, today]);

  const ptr = usePullToRefresh(() => {
    const params = {route:"daily",becado,date,token:API_TOKEN};
    safeStorage.remove(cacheKey(params));
    load(date);
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

      <div style={{padding:"20px 16px 0",position:"relative",zIndex:1}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi horario</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>{becado}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
          </button>
          {daily?.rotationCode && (
            <div style={{display:"flex",alignItems:"center",gap:6,background:c.light,border:`1px solid ${c.accent}30`,borderRadius:99,padding:"5px 11px",flexShrink:0,marginTop:6}}>
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
          const manana   = grouped.filter(it => t2m(it.from) < t2m("14:00"));
          const tarde    = grouped.filter(it => t2m(it.from) >= t2m("14:00"));
          const diaCode  = daily?.turno?.diaCode  || null;
          const nocheCode= daily?.turno?.nocheCode || null;
          const hasAny   = manana.length || tarde.length || diaCode || nocheCode;
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
    apiSWR(
      params,
      (data) => { setSummary(data); setIsStale(true); },
      (data, stale) => { setSummary(data); setIsStale(stale); }
    ).catch(e => setError(String(e.message||e)));
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  useEffect(() => {
    [-1, 1].forEach(offset => prefetch({route:"summary",date:offsetDate(today,offset),token:API_TOKEN}));
  }, [today]);

  const ptr = usePullToRefresh(() => {
    const params = {route:"summary",date,token:API_TOKEN};
    safeStorage.remove(cacheKey(params));
    load(date);
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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>Rotaciones</div>
          {onChangeBecado && (
            <button className="press" onClick={onChangeBecado}
              style={{background:"none",border:"none",padding:0,textAlign:"right",marginTop:4}}>
              <div style={{fontSize:13,fontWeight:600,color:T.sub}}>← Becados</div>
            </button>
          )}
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
  const [days, setDays] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnline();
  const scrollRef = useRef(null);

  const weekDates = useMemo(()=>getWeekDates(refDate),[refDate]);

  const sessionKey = `semana:${becado}:${weekDates[0]}`;

  const load = useCallback((forceRefresh = false) => {
    const cached = weekDates.map(date => cacheGet({route:"daily",becado,date,token:API_TOKEN}));
    const hasCached = cached.some(Boolean);

    // Mostrar caché inmediatamente — nunca borrar lo que hay
    if (hasCached) {
      setDays(weekDates.map((date,i) => cached[i]
        ? {date,ok:cached[i].ok!==false,rotationCode:cached[i].rotationCode||"",items:cached[i].items||[],turno:cached[i].turno||{diaCode:null,nocheCode:null},seminario:cached[i].seminario||null}
        : {date,ok:false,rotationCode:"",items:[],turno:{diaCode:null,nocheCode:null},seminario:null}
      ));
    }

    // Ir a la red solo si: es refresh forzado (pull), O es la primera vez en esta sesión
    if (!forceRefresh && _revalidatedThisSession.has(sessionKey)) {
      setIsStale(false);
      return;
    }
    _revalidatedThisSession.add(sessionKey);

    if (!hasCached) setDays(null); // solo mostrar spinner si no hay nada

    Promise.all(
      weekDates.map(date =>
        apiGet({route:"daily",becado,date,token:API_TOKEN})
          .then(d => { cacheSet({route:"daily",becado,date,token:API_TOKEN},d); return {date,ok:d.ok!==false,rotationCode:d.rotationCode||"",items:resolveItems(d.rotationCode,d.items||[],date),turno:d.turno||{diaCode:null,nocheCode:null},seminario:d.seminario||null}; })
          .catch(() => {
            const c = cacheGet({route:"daily",becado,date,token:API_TOKEN});
            return c ? {date,ok:true,rotationCode:c.rotationCode||"",items:resolveItems(c.rotationCode,c.items||[],date),turno:c.turno||{diaCode:null,nocheCode:null},seminario:c.seminario||null} : {date,ok:false,rotationCode:"",items:[],turno:{diaCode:null,nocheCode:null},seminario:null};
          })
      )
    ).then(results => { setDays(results); setIsStale(false); });
  }, [becado, weekDates, sessionKey]);

  useEffect(() => { load(); }, [load]);

  const ptr = usePullToRefresh(() => {
    weekDates.forEach(date => {
      safeStorage.remove(cacheKey({route:"daily",becado,date,token:API_TOKEN}));
    });
    _revalidatedThisSession.delete(sessionKey);
    load(true);
  }, scrollRef);

  const isThisWeek = weekDates.includes(today);

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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>{becado}</div>
          <button className="press" onClick={onChangeBecado}
            style={{background:"none",border:"none",padding:0,textAlign:"right",marginTop:4}}>
            <div style={{fontSize:13,fontWeight:600,color:T.sub}}>← Becados</div>
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
              style={{height:32,padding:"0 11px",borderRadius:8,border:"1px solid #348FFF60",background:"#348FFF14",fontSize:11,fontWeight:700,color:"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
              HOY
            </button>
          )}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <OfflineBanner isOnline={isOnline} isStale={isStale} T={T}/>
        {days === null ? (
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


// Abrevia un apellido a máximo 6 caracteres (sin puntos)
function abbrevName(name) {
  if (!name) return "";
  return name.length > 6 ? name.slice(0, 6) : name;
}

// ── Tab: Turnos del mes ───────────────────────────────────────────────────────
// ── Colores de turnos ─────────────────────────────────────────────────────────
const TURNO_COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#818CF8" };
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

// ── Componente grid calendario reutilizable ───────────────────────────────────
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

// ── Tab: Turnos generales (para pantalla de selección) ────────────────────────
const TURNO_TABS = [
  { id:"P", label:"Poli",      color:"#06B6D4" },
  { id:"D", label:"Día",       color:"#F59E0B" },
  { id:"N", label:"Noche",     color:"#818CF8" },
  { id:"S", label:"Seminarios",color:"#E879F9" },
];

function TabTurnos({ onBack, T }) {
  const today = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);
  const [sub, setSub]     = useState("P");
  const [data, setData]   = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSem, setSelectedSem] = useState(null); // { date, sem } for detail panel

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;

  // Load turno data (Poli/Día/Noche)
  useEffect(() => {
    setLoading(true); setError("");
    const params = { route:"monthly", month: monthStr, token: API_TOKEN };
    apiSWR(params,
      (d) => { setData(d); setLoading(false); },
      (d) => { setData(d); setLoading(false); }
    ).catch(e => { setError(String(e.message||e)); setLoading(false); });
  }, [monthStr]);



  const prevMonth = () => { setSelectedSem(null); month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1); };
  const nextMonth = () => { setSelectedSem(null); month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1); };

  const slots  = useMemo(() => getMonthDates(year, month), [year, month]);
  const turnoColor = TURNO_TABS.find(t=>t.id===sub)?.color || "#64748B";

  // Para P/D/N: map date → [names]
  // Para S:     map date → { presenter, title, tag, time }
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
    <div style={{minHeight:"100vh",background:T.bg,paddingBottom:24}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Turnos del mes</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>
            {monthLabel(year, month)}
          </div>
          <button className="press" onClick={onBack} style={{background:"none",border:"none",padding:0,marginTop:6}}>
            <div style={{fontSize:13,fontWeight:600,color:T.sub}}>← Volver</div>
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
        </div>
        {/* Sub-tabs */}
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

        {/* ── Seminarios grid ── */}
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

              {/* Detail panel — aparece al tocar un día con seminario */}
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
          /* ── Turnos grid (Poli / Día / Noche) ── */
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

// ── Tab: Mi mes (calendario personal del becado) ──────────────────────────────
function TabMes({ becado, T }) {
  const today = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);
  const [lookup, setLookup] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;

  useEffect(() => {
    setError("");
    const [y, m] = monthStr.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const allDates = Array.from({length: daysInMonth}, (_, i) => {
      const d = i + 1;
      return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    });

    // Mostrar inmediatamente lo que ya está en caché
    const cached = {};
    allDates.forEach(date => {
      const c = cacheGet({route:"daily", becado, date, token:API_TOKEN});
      if (c && c?.ok !== false) cached[date] = c;
    });
    if (Object.keys(cached).length > 0) {
      setLookup(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Pedir en background solo los días que no están en caché
    const missing = allDates.filter(date =>
      !cacheGet({route:"daily", becado, date, token:API_TOKEN})
    );
    if (missing.length === 0) { setLoading(false); return; }

    // Pedir de a 5 en paralelo para no saturar Apps Script
    const chunks = [];
    for (let i = 0; i < missing.length; i += 5) chunks.push(missing.slice(i, i+5));
    (async () => {
      try {
        for (const chunk of chunks) {
          const results = await Promise.all(
            chunk.map(date =>
              apiGet({route:"daily", becado, date, token:API_TOKEN})
                .then(d => { cacheSet({route:"daily",becado,date,token:API_TOKEN}, d); return [date, d]; })
                .catch(() => [date, null])
            )
          );
          setLookup(prev => {
            const next = {...prev};
            results.forEach(([date, d]) => { if (d?.ok !== false && d) next[date] = d; });
            return next;
          });
        }
      } catch(e) { setError("Error cargando el mes"); }
      finally { setLoading(false); }
    })();
  }, [becado, monthStr]);

  const prevMonth = () => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1);

  const slots = useMemo(() => getMonthDates(year, month), [year, month]);

  return (
    <div style={{minHeight:"100vh",background:T.bg,paddingBottom:90}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi mes</div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,marginBottom:12,textTransform:"capitalize"}}>
          {monthLabel(year, month)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
        </div>

        {/* Leyenda */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {[["P","Poli","#06B6D4"],["D","Día","#F59E0B"],["N","Noche","#818CF8"],["S","Seminario","#E879F9"]].map(([id,label,color])=>(
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
            const turno   = day.turno || {};
            const badges  = [];
            if (turno.diaCode === "P") badges.push({ label:"P", color:"#06B6D4" });
            if (turno.diaCode === "D") badges.push({ label:"D", color:"#F59E0B" });
            if (turno.nocheCode === "N") badges.push({ label:"N", color:"#818CF8" });
            if (day.seminario) badges.push({ label:"S", color:"#E879F9" });
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
  const tabs = [
    { id:"horario",    icon:"◑", label:"Mi Horario" },
    { id:"semana",     icon:"▦", label:"Semana" },
    { id:"mes",        icon:"▦□", label:"Mes" },
  ];
  return (
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,
      background:T.tabBg,
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderTop:`1px solid ${T.border}`,
      display:"flex",
      paddingBottom:"calc(var(--sab) + 8px)",
      zIndex:50,
    }}>
      {tabs.map(tab=>{
        const isActive = active===tab.id;
        return (
          <button key={tab.id} className="press"
            style={{flex:1,border:"none",background:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:isActive?T.text:T.muted}}
            onClick={()=>onChange(tab.id)}
          >
            <span style={{fontSize:18,lineHeight:1}}>{tab.icon}</span>
            <span style={{fontSize:10,fontWeight:isActive?700:400,letterSpacing:"0.04em",fontFamily:"'Bricolage Grotesque',sans-serif"}}>{tab.label}</span>
            <span style={{width:isActive?18:0,height:2,borderRadius:99,background:"#348FFF",transition:"width 0.22s ease",marginTop:1}}/>
          </button>
        );
      })}
    </div>
  );
}


// ── Splash screen ─────────────────────────────────────────────────────────────
const SPLASH_TTL = 8 * 60 * 60 * 1000; // 8 horas

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
    // Marcar timestamp al mostrar el splash
    try { localStorage.setItem("lastSeen", String(Date.now())); } catch {}
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [visible]);

  // Al volver a la app después de mucho tiempo
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

// Partícula individual animada
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
  const fill = "#E6EDF3"; // color del mimo
  return (
    <div style={{position:"relative", width:160, height:160, display:"flex", alignItems:"center", justifyContent:"center"}}>
      {/* Partículas */}
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
  // phase 0→1: entrada, 1→2: salida
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

      {/* Glow pulsante */}
      <div style={{
        position:"absolute", top:"40%", left:"50%",
        width:300, height:300, borderRadius:"50%",
        background:"#348FFF",
        filter:"blur(80px)",
        animation: phase >= 1 ? "glow-pulse 2s ease infinite" : "none",
        opacity:0.12,
        pointerEvents:"none",
      }}/>

      {/* Mimo */}
      <MimeFace phase={phase}/>

      {/* MimApp — entra con rebote y escala */}
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

      {/* created by Mimo — letras que se abren */}
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

  const T = THEMES[theme];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    safeStorage.set("activeTab", tab);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    safeStorage.set("theme", next);
    const bg = next === "dark" ? "#0D1117" : "#F4F7FB";
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", bg);
    document.body.style.background = bg;
  };

  useEffect(() => {
    const bg = theme === "dark" ? "#0D1117" : "#F4F7FB";
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", bg);
    document.body.style.background = bg;
    // Limpiar caché expirado cuando el browser esté idle (no bloquea la carga)
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => purgeCacheStorage());
    } else {
      setTimeout(() => purgeCacheStorage(), 2000);
    }
  }, []);

  // Cargar lista de becados con caché (SWR)
  useEffect(() => {
    const params = {route:"becados",token:API_TOKEN};
    apiSWR(
      params,
      (data) => { if (data.ok && data.becados) { setBecados(data.becados); setLoadingInit(false); } },
      (data) => { if (data.ok && data.becados) { setBecados(data.becados); setLoadingInit(false); } }
    ).catch(e => { setInitError(String(e.message||e)); setLoadingInit(false); });
  }, []);

  // Prefetch rotaciones de hoy en background
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

  if (loadingInit) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style><Spinner/>
    </div>
  );


  return (
    <div style={{
      minHeight:"100vh",
      background:T.bg,
      maxWidth:480,
      margin:"0 auto",
      fontFamily:"'Inter',sans-serif",
      paddingBottom: becado ? 72 : 0,
      position:"relative",
      overflow:"hidden",
    }}>
      <style>{CSS}</style>
      {(showSplash || previewSplash) && <SplashScreen/>}

      <GearBtn onClick={()=>setShowSettings(s=>!s)} T={T}/>
      {showSettings && (
        <SettingsPanel theme={theme} onToggle={toggleTheme} onClose={()=>setShowSettings(false)} onPreviewSplash={()=>{setShowSettings(false);setPreviewSplash(true);setTimeout(()=>setPreviewSplash(false),2700);}} T={T}/>
      )}

      {!becado ? (
        showRotaciones
          ? <>
              <div style={{paddingBottom:80}}><TabRotaciones onChangeBecado={handleChange} T={T}/></div>
              <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"12px 16px calc(var(--sab) + 20px)",background:T.tabBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,zIndex:50}}>
                <button className="press" onClick={()=>setShowRotaciones(false)} style={{width:"100%",height:40,borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,fontSize:13,fontWeight:600,color:T.sub}}>&#8592; Volver</button>
              </div>
            </>
        : showTurnos
          ? <TabTurnos onBack={() => setShowTurnos(false)} T={T}/>
          : <SelectScreen becados={becados} onSelect={handleSelect} onShowRotaciones={handleShowRotaciones} onShowTurnos={handleShowTurnos} error={initError} T={T}/>

      ) : (
        <>
          <div style={{display:activeTab==="horario"?"block":"none"}}><TabHorario becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <div style={{display:activeTab==="semana"?"block":"none"}}><TabSemana becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <div style={{display:activeTab==="mes"?"block":"none"}}><TabMes becado={becado} T={T}/></div>
          <TabBar active={activeTab} onChange={handleTabChange} T={T}/>
        </>
      )}
    </div>
  );
}