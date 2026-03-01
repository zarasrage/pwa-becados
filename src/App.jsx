import { useEffect, useMemo, useState } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbyOunqjO7j6sfa6wXxGMcPabeu9a__sVWynew0UuLF_HSHypkfHKZ81tyYt1DNYo-nC/exec";
const API_TOKEN = "queseyo_calendriobecados2026";

const ROTATION_COLORS = {
  H:   { bg: "#EFF6FF", accent: "#3B82F6", light: "#DBEAFE" },
  M:   { bg: "#F0FDF4", accent: "#16A34A", light: "#DCFCE7" },
  CyP: { bg: "#FFF7ED", accent: "#EA580C", light: "#FFEDD5" },
  R:   { bg: "#FDF4FF", accent: "#9333EA", light: "#F3E8FF" },
  TyP: { bg: "#FFF1F2", accent: "#E11D48", light: "#FFE4E6" },
  Col: { bg: "#F0FDFA", accent: "#0D9488", light: "#CCFBF1" },
  default: { bg: "#F8FAFC", accent: "#64748B", light: "#E2E8F0" },
};

function getColors(code) {
  return ROTATION_COLORS[code] || ROTATION_COLORS.default;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDateDisplay(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("es-CL", { weekday:"long", day:"numeric", month:"long" });
}

function offsetDate(iso, days) {
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y,m-1,d+days);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}

async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString());
  return res.json();
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h,m] = t.split(":").map(Number);
  return h*60 + (m||0);
}

function minutesToTime(mins) {
  const h = Math.floor(mins/60);
  const m = mins%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

// Agrupa actividades consecutivas con el mismo nombre, cada bloque dura 1h (fin = inicio+59)
function groupItems(items) {
  if (!items?.length) return [];
  const groups = [];
  let current = null;
  for (const item of items) {
    if (current && current.activity === item.activity) {
      current.endMins = timeToMinutes(item.time) + 59;
    } else {
      if (current) groups.push(current);
      current = {
        activity: item.activity,
        startMins: timeToMinutes(item.time),
        endMins: timeToMinutes(item.time) + 59,
      };
    }
  }
  if (current) groups.push(current);
  return groups.map(g => ({
    activity: g.activity,
    range: `${minutesToTime(g.startMins)} – ${minutesToTime(g.endMins)}`,
  }));
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ accent = "#64748B" }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
      <div style={{
        width:26, height:26,
        border:"3px solid #E2E8F0",
        borderTopColor: accent,
        borderRadius:"50%",
        animation:"spin 0.7s linear infinite"
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Pantalla de selección de becado ──────────────────────────────────────────
const YEAR_LABELS = ["1er año", "2do año", "3er año"];
const YEAR_COLORS = ["#3B82F6", "#9333EA", "#0D9488"];

function BecadoScreen({ becados, onSelect, error }) {
  const groups = [
    becados.slice(0, 5),
    becados.slice(5, 10),
    becados.slice(10, 15),
  ].filter(g => g.length > 0);

  return (
    <div style={sc.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
        *{box-sizing:border-box} body{margin:0;background:#F8FAFC}
        .becado-btn:active{transform:scale(0.97)!important;background:#F8FAFC!important}
      `}</style>

      <div style={{ padding:"40px 20px 16px", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🏥</div>
        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, margin:"0 0 6px", color:"#0F172A" }}>
          Becados
        </h1>
        <p style={{ fontSize:14, color:"#64748B", margin:0 }}>
          Toca tu nombre para ver tu horario.
        </p>
      </div>

      {error && <div style={{ ...sc.errorBox, margin:"0 20px 16px" }}>{error}</div>}

      <div style={{ padding:"8px 16px 40px" }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom:24 }}>
            <div style={{
              fontSize:11, fontWeight:700, letterSpacing:"0.08em",
              textTransform:"uppercase", color: YEAR_COLORS[gi],
              marginBottom:10, display:"flex", alignItems:"center", gap:6
            }}>
              <span style={{
                width:6, height:6, borderRadius:"50%",
                background: YEAR_COLORS[gi], display:"inline-block"
              }}/>
              {YEAR_LABELS[gi]}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {group.map(name => (
                <button
                  key={name}
                  className="becado-btn"
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    background:"#fff", border:"1.5px solid #F1F5F9",
                    borderRadius:14, padding:"12px 16px", cursor:"pointer",
                    textAlign:"left", width:"100%",
                    fontFamily:"'DM Sans',sans-serif",
                    boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
                    transition:"transform 0.15s",
                  }}
                  onClick={() => onSelect(name)}
                >
                  <span style={{
                    width:36, height:36, borderRadius:10,
                    background: YEAR_COLORS[gi] + "18",
                    color: YEAR_COLORS[gi],
                    fontWeight:700, fontSize:15,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0,
                  }}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontSize:15, fontWeight:500, color:"#1E293B" }}>
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tarjeta de actividad ──────────────────────────────────────────────────────
function ActivityCard({ range, activity, accent, light, index }) {
  const [pressed, setPressed] = useState(false);
  const [start, end] = range.split("–").map(s => s.trim());
  return (
    <div
      style={{
        background: pressed ? light : "#fff",
        border: `1.5px solid ${pressed ? accent : "#F1F5F9"}`,
        borderRadius:14,
        padding:"14px 16px",
        display:"flex", alignItems:"center", gap:14,
        cursor:"pointer",
        transition:"all 0.12s ease",
        animation:`fadeUp 0.25s ease both`,
        animationDelay:`${index*50}ms`,
        userSelect:"none",
        boxShadow: pressed ? `0 0 0 3px ${light}` : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* Bloque de hora */}
      <div style={{
        background: pressed ? "#fff" : light,
        borderRadius:10,
        padding:"8px 10px",
        minWidth:64,
        textAlign:"center",
        flexShrink:0,
        transition:"background 0.12s",
      }}>
        <div style={{
          fontFamily:"'DM Mono',monospace",
          fontSize:13, color: accent, fontWeight:600, lineHeight:1.3
        }}>
          {start}
        </div>
        <div style={{
          fontFamily:"'DM Mono',monospace",
          fontSize:10, color: accent, opacity:0.65, lineHeight:1.3
        }}>
          {end}
        </div>
      </div>
      {/* Actividad */}
      <div style={{ fontSize:14, color:"#1E293B", lineHeight:1.4, fontWeight:500 }}>
        {activity}
      </div>
    </div>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  const today = useMemo(() => todayISO(), []);
  const [becado, setBecado] = useState(() => localStorage.getItem("selectedBecado") || "");
  const [becados, setBecados] = useState([]);
  const [loadingBecados, setLoadingBecados] = useState(true);
  const [date, setDate] = useState(today);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initError, setInitError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet({ route:"becados", token:API_TOKEN });
        if (!data.ok) throw new Error(data.error || "Error cargando becados");
        setBecados(data.becados);
      } catch(e) {
        setInitError(String(e.message || e));
      } finally {
        setLoadingBecados(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!becado) return;
    (async () => {
      setLoading(true);
      setError("");
      setDaily(null);
      try {
        const data = await apiGet({ route:"daily", becado, date, token:API_TOKEN });
        if (data.ok === false) throw new Error(data.error || "No se pudo obtener horario");
        setDaily(data);
      } catch(e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [becado, date]);

  const handleSelect = (name) => {
    localStorage.setItem("selectedBecado", name);
    setBecado(name);
  };

  const handleChangeBecado = () => {
    localStorage.removeItem("selectedBecado");
    setBecado("");
    setDaily(null);
    setDate(today);
  };

  if (loadingBecados) return <div style={sc.page}><Spinner /></div>;
  if (!becado) return <BecadoScreen becados={becados} onSelect={handleSelect} error={initError} />;

  const colors = daily ? getColors(daily.rotationCode) : getColors("default");
  const isToday = date === today;
  const grouped = groupItems(daily?.items);

  return (
    <div style={{ ...sc.page, paddingBottom:40 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
        *{box-sizing:border-box} body{margin:0;background:#F8FAFC}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      `}</style>

      {/* Header */}
      <div style={{ padding:"24px 16px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div>
          <button style={{
            background:"none", border:"none", padding:0, cursor:"pointer",
            fontFamily:"'DM Serif Display',serif", fontSize:24, color:"#0F172A",
            display:"flex", alignItems:"center", gap:4,
          }} onClick={handleChangeBecado}>
            {becado} <span style={{ fontSize:14, color:"#94A3B8" }}>⌄</span>
          </button>
          <div style={{ fontSize:13, color:"#64748B", marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ textTransform:"capitalize" }}>{formatDateDisplay(date)}</span>
            {isToday && (
              <span style={{
                fontSize:11, fontWeight:700, background:"#0F172A", color:"#fff",
                borderRadius:99, padding:"1px 8px", letterSpacing:"0.05em"
              }}>Hoy</span>
            )}
          </div>
        </div>
        {daily?.rotationCode && (
          <div style={{
            fontSize:12, fontWeight:700, borderRadius:99,
            padding:"5px 12px", background: colors.light, color: colors.accent,
            flexShrink:0, alignSelf:"flex-start", marginTop:4,
            letterSpacing:"0.04em",
          }}>
            {daily.rotationName}
          </div>
        )}
      </div>

      {/* Navegación de fechas */}
      <div style={{ display:"flex", gap:8, padding:"12px 16px" }}>
        <button style={sc.navBtn} onClick={() => setDate(d => offsetDate(d,-1))}>‹</button>
        <button
          style={{ ...sc.navBtn, fontSize:13, fontWeight:600, width:"auto", padding:"0 14px", color:"#0F172A", opacity: isToday ? 0.35 : 1 }}
          disabled={isToday}
          onClick={() => setDate(today)}
        >Hoy</button>
        <button style={sc.navBtn} onClick={() => setDate(d => offsetDate(d,1))}>›</button>
      </div>

      {/* Contenido */}
      <div style={{ padding:"0 16px" }}>
        {error && <div style={sc.errorBox}>{error}</div>}
        {loading ? (
          <Spinner accent={colors.accent} />
        ) : grouped.length ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {grouped.map((it, i) => (
              <ActivityCard
                key={i} index={i}
                range={it.range}
                activity={it.activity}
                accent={colors.accent}
                light={colors.light}
              />
            ))}
          </div>
        ) : !error && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
            <div style={{ fontSize:15, color:"#94A3B8" }}>Sin actividades para este día</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Estilos compartidos ───────────────────────────────────────────────────────
const sc = {
  page: {
    minHeight:"100vh",
    fontFamily:"'DM Sans',sans-serif",
    maxWidth:480,
    margin:"0 auto",
    background:"#F8FAFC",
  },
  navBtn: {
    background:"#fff", border:"1.5px solid #E2E8F0",
    borderRadius:10, width:38, height:38,
    fontSize:20, cursor:"pointer", color:"#475569",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 1px 2px rgba(0,0,0,0.04)",
  },
  errorBox: {
    background:"#FFF1F2", border:"1px solid #FECDD3",
    borderRadius:12, padding:"12px 14px",
    fontSize:14, color:"#BE123C", marginBottom:12,
  },
};
