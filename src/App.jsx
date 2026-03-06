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
    try { localStorage.setItem(key, value); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

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
  if (route === "summary")  return 4  * 60 * 60 * 1000; // 4h
  if (route === "monthly")  return 4  * 60 * 60 * 1000; // 4h
  if (route === "becados")  return 24 * 60 * 60 * 1000; // 24h
  return 60 * 60 * 1000; // 1h por defecto
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

// Stale-while-revalidate con revalidación inteligente:
// - Si el caché tiene menos de 5 min → mostrar y NO revalidar (evita calls innecesarios)
// - Si el caché tiene más de 5 min → mostrar y revalidar en background
// - Sin caché → fetch directo
const SWR_REVALIDATE_AFTER = 5 * 60 * 1000; // 5 minutos

function cacheAge(params) {
  try {
    const raw = safeStorage.get(cacheKey(params));
    if (!raw) return Infinity;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts;
  } catch { return Infinity; }
}

async function apiSWR(params, onImmediate, onFresh) {
  const cached = cacheGet(params);
  const age    = cacheAge(params);

  if (cached) {
    onImmediate(cached, true);
    // Si es reciente, no revalidar — ahorramos un call a la API
    if (age < SWR_REVALIDATE_AFTER) {
      onFresh(cached, false);
      return cached;
    }
  }
  try {
    const fresh = await apiGet(params);
    cacheSet(params, fresh);
    onFresh(fresh, false);
    return fresh;
  } catch(e) {
    if (cached) {
      onFresh(cached, false);
      return cached;
    }
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
function SettingsPanel({ theme, onToggle, onClose, T }) {
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.3)"}}/>
      <div style={{
        position:"fixed",top:44,right:12,zIndex:100,
        background:T.surface,border:`1px solid ${T.border}`,
        borderRadius:14,padding:"14px 16px",width:200,
        boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
        animation:"slideDown 0.2s ease both",
        fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>
          Apariencia
        </div>
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
      style={{position:"fixed",top:6,right:12,zIndex:80,width:32,height:32,borderRadius:9,background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
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

      <div style={{padding:"56px 16px 14px",position:"relative",zIndex:1}}>
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

      <div style={{padding:"20px 16px 0"}}>
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

  const load = useCallback(() => {
    const cached = weekDates.map(date => cacheGet({route:"daily",becado,date,token:API_TOKEN}));
    const hasCached = cached.some(Boolean);
    if (hasCached) {
      setDays(weekDates.map((date,i) => cached[i]
        ? {date,ok:cached[i].ok!==false,rotationCode:cached[i].rotationCode||"",items:cached[i].items||[],turno:cached[i].turno||{diaCode:null,nocheCode:null},seminario:cached[i].seminario||null}
        : {date,ok:false,rotationCode:"",items:[],turno:{diaCode:null,nocheCode:null},seminario:null}
      ));
      setIsStale(true);
    } else {
      setDays(null);
    }
    // Si todos los días tienen caché reciente, no ir a la red
    const allFresh = weekDates.every(date =>
      cacheAge({route:"daily",becado,date,token:API_TOKEN}) < SWR_REVALIDATE_AFTER
    );
    if (allFresh && hasCached) { setIsStale(false); return; }

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
  }, [becado, weekDates]);

  useEffect(() => { load(); }, [load]);

  const ptr = usePullToRefresh(() => {
    weekDates.forEach(date => {
      safeStorage.remove(cacheKey({route:"daily",becado,date,token:API_TOKEN}));
    });
    load();
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

      <div style={{padding:"20px 16px 0"}}>
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
const TURNO_TABS = [
  { id:"P", label:"Poli",  color:"#06B6D4" },
  { id:"D", label:"Día",   color:"#F59E0B" },
  { id:"N", label:"Noche", color:"#818CF8" },
];

const WEEKDAY_LABELS = ["L","M","X","J","V","S","D"];

function getMonthDates(year, month) {
  // Returns array of 42 slots (6 weeks) for the calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // Monday-first: getDay() 0=Sun→6, 1=Mon→0, ...
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const slots = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      slots.push(null);
    } else {
      const d = new Date(year, month, dayNum);
      slots.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
    }
  }
  // Trim trailing empty weeks
  let last = 41;
  while (last > 0 && slots[last] === null) last--;
  const rows = Math.ceil((last + 1) / 7);
  return slots.slice(0, rows * 7);
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("es-CL", { month:"long", year:"numeric" });
}

function TabTurnos({ onBack, T }) {
  const today    = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => { const [y] = today.split("-").map(Number); return y; });
  const [month, setMonth] = useState(() => { const [,m] = today.split("-").map(Number); return m - 1; });
  const [sub, setSub]     = useState("P");
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;

  useEffect(() => {
    setLoading(true); setError(""); setData(null);
    const params = { route:"monthly", month: monthStr, token: API_TOKEN };
    apiSWR(
      params,
      (d) => { setData(d); setLoading(false); },
      (d, stale) => { setData(d); if (!stale) setLoading(false); }
    ).catch(e => { setError(String(e.message||e)); setLoading(false); });
  }, [monthStr]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y-1); setMonth(11); }
    else setMonth(m => m-1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y+1); setMonth(0); }
    else setMonth(m => m+1);
  };

  const slots   = useMemo(() => getMonthDates(year, month), [year, month]);
  const turnoColor = TURNO_TABS.find(t => t.id === sub)?.color || "#64748B";

  // Build lookup: date → [names]
  const lookup = useMemo(() => {
    if (!data?.ok) return {};
    const map = {};
    (data.entries || []).forEach(e => {
      if (e.type === sub) {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push(e.name);
      }
    });
    return map;
  }, [data, sub]);

  return (
    <div style={{minHeight:"100vh",background:T.bg,paddingBottom:24}}>
      {/* Header */}
      <div style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Turnos del mes</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>
            {monthLabel(year, month)}
          </div>
          <button className="press" onClick={onBack}
            style={{background:"none",border:"none",padding:0,marginTop:4}}>
            <div style={{fontSize:13,fontWeight:600,color:T.sub}}>← Volver</div>
          </button>
        </div>

        {/* Navegación mes */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <button className="press" onClick={prevMonth}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>
            {monthLabel(year, month)}
          </div>
          <button className="press" onClick={nextMonth}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
        </div>

        {/* Sub-tabs Poli / Día / Noche */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {TURNO_TABS.map(t => (
            <button key={t.id} className="press" onClick={() => setSub(t.id)}
              style={{
                flex:1,height:34,borderRadius:9,border:`1px solid ${sub===t.id ? t.color+"60" : T.border}`,
                background: sub===t.id ? `${t.color}18` : T.surface2,
                fontSize:12,fontWeight:sub===t.id?700:400,
                color: sub===t.id ? t.color : T.muted,
                transition:"all 0.15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <ErrorBox msg={error} T={T}/>

        {loading && !data ? <Spinner color={turnoColor}/> : (
          <>
            {/* Cabecera días semana */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {WEEKDAY_LABELS.map(d => (
                <div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.04em",padding:"2px 0"}}>{d}</div>
              ))}
            </div>

            {/* Grid calendario */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {slots.map((iso, i) => {
                if (!iso) return <div key={i}/>;
                const dayNum   = Number(iso.split("-")[2]);
                const isToday  = iso === today;
                const names    = lookup[iso] || [];
                const hasData  = names.length > 0;
                return (
                  <div key={iso} className={hasData ? "anim" : ""}
                    style={{
                      animationDelay:`${(i%7)*20}ms`,
                      background: hasData
                        ? `${turnoColor}15`
                        : isToday ? T.surface2 : "transparent",
                      border: `1px solid ${isToday ? turnoColor+"60" : hasData ? turnoColor+"30" : T.border}`,
                      borderRadius: 6,
                      padding: "3px 2px",
                      minHeight: 44,
                      display:"flex",
                      flexDirection:"column",
                      gap: 1,
                    }}>
                    <div style={{
                      fontSize:9,fontWeight:700,
                      lineHeight:1,marginBottom:1,
                      background: isToday ? turnoColor : "transparent",
                      color: isToday ? "#fff" : hasData ? turnoColor : T.muted,
                      borderRadius: isToday ? 99 : 0,
                      width: isToday ? 16 : "auto",
                      height: isToday ? 16 : "auto",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      alignSelf: isToday ? "center" : "flex-start",
                      paddingLeft: isToday ? 0 : 1,
                    }}>{dayNum}</div>
                    {names.slice(0,3).map((name,ni) => (
                      <div key={ni} style={{
                        fontSize:8,fontWeight:600,color:turnoColor,
                        background:`${turnoColor}20`,
                        borderRadius:3,padding:"1px 2px",
                        lineHeight:1.25,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      }}>{abbrevName(name)}</div>
                    ))}
                    {names.length > 3 && (
                      <div style={{fontSize:8,color:turnoColor,opacity:0.6,paddingLeft:1}}>+{names.length-3}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
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
    { id:"rotaciones", icon:"⊞", label:"Rotaciones" },
    { id:"turnos",     icon:"◷", label:"Turnos" },
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
      paddingBottom:"env(safe-area-inset-bottom,8px)",
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

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme]             = useState(() => safeStorage.get("theme") || "dark");
  const [showSettings, setShowSettings] = useState(false);
  const [becado, setBecado]           = useState(() => safeStorage.get("selectedBecado") || "");
  const [becados, setBecados]         = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError]     = useState("");
  const [activeTab, setActiveTab]     = useState(() => safeStorage.get("activeTab") || "horario");
  const [showTurnos, setShowTurnos]   = useState(false);

  const T = THEMES[theme];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    safeStorage.set("activeTab", tab);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    safeStorage.set("theme", next);
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", next === "dark" ? "#0D1117" : "#F4F7FB");
  };

  useEffect(() => {
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0D1117" : "#F4F7FB");
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
  const handleShowRotaciones = () => { setBecado("__rotaciones__"); };
  const handleShowTurnos     = () => { setShowTurnos(true); };

  if (loadingInit) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style><Spinner/>
    </div>
  );

  const showRotacionesOnly = becado === "__rotaciones__";

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

      <GearBtn onClick={()=>setShowSettings(s=>!s)} T={T}/>
      {showSettings && (
        <SettingsPanel theme={theme} onToggle={toggleTheme} onClose={()=>setShowSettings(false)} T={T}/>
      )}

      {!becado ? (
        showTurnos
          ? <TabTurnos onBack={() => setShowTurnos(false)} T={T}/>
          : <SelectScreen becados={becados} onSelect={handleSelect} onShowRotaciones={handleShowRotaciones} onShowTurnos={handleShowTurnos} error={initError} T={T}/>

      ) : showRotacionesOnly ? (
        <>
          <div style={{paddingBottom:72}}>
            <TabRotaciones onChangeBecado={handleChange} T={T}/>
          </div>
          <TabBar
            active="rotaciones"
            onChange={tab => {
              if (tab === "horario") {
                const saved = safeStorage.get("selectedBecado");
                if (saved) { setBecado(saved); setActiveTab("horario"); }
                else handleChange();
              } else {
                handleTabChange(tab);
              }
            }}
            T={T}
          />
        </>

      ) : (
        <>
          {activeTab === "horario"    && <TabHorario becado={becado} onChangeBecado={handleChange} T={T}/>}
          {activeTab === "semana"     && <TabSemana becado={becado} onChangeBecado={handleChange} T={T}/>}
          {activeTab === "rotaciones" && <TabRotaciones onChangeBecado={handleChange} T={T}/>}
          {activeTab === "turnos"     && <TabTurnos onBack={() => handleTabChange("horario")} T={T}/>}
          <TabBar active={activeTab} onChange={handleTabChange} T={T}/>
        </>
      )}
    </div>
  );
}
