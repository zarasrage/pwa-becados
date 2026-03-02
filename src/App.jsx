import { useEffect, useMemo, useState } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbz9Zme-RquoB2GVh6yj9v9Yl2xFAq2JKO5RnM_Cm5-EYgEQV6CWsD5H4ai3ZtmKiq4U/exec";
const API_TOKEN = "queseyo_calendriobecados2026";

const ROTATION_COLORS = {
  H:   { accent: "#3B82F6", light: "#DBEAFE" },
  M:   { accent: "#16A34A", light: "#DCFCE7" },
  CyP: { accent: "#EA580C", light: "#FFEDD5" },
  R:   { accent: "#9333EA", light: "#F3E8FF" },
  TyP: { accent: "#E11D48", light: "#FFE4E6" },
  Col: { accent: "#0D9488", light: "#CCFBF1" },
  default: { accent: "#64748B", light: "#E2E8F0" },
};

const ROTATION_NAMES = {
  H: "Hombro", M: "Mano", CyP: "Cadera",
  R: "Rodilla", TyP: "Tobillo y Pie", Col: "Columna"
};

const ROT_ORDER = ["H","M","CyP","R","TyP","Col","Sin rotación"];
const YEAR_LABELS = ["1er año", "2do año", "3er año"];
const YEAR_COLORS = ["#3B82F6", "#9333EA", "#0D9488"];

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

function groupItems(items) {
  if (!items?.length) return [];
  const groups = [];
  let current = null;
  for (const item of items) {
    if (current && current.activity === item.activity) {
      current.endMins = timeToMinutes(item.time) + 59;
    } else {
      if (current) groups.push(current);
      current = { activity: item.activity, startMins: timeToMinutes(item.time), endMins: timeToMinutes(item.time) + 59 };
    }
  }
  if (current) groups.push(current);
  return groups.map(g => ({ activity: g.activity, range: `${minutesToTime(g.startMins)} – ${minutesToTime(g.endMins)}` }));
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ accent = "#64748B" }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
      <div style={{ width:24, height:24, border:"3px solid #E2E8F0", borderTopColor:accent, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── DateNav compartido ────────────────────────────────────────────────────────
function DateNav({ date, today, onPrev, onNext, onToday }) {
  const isToday = date === today;
  return (
    <div style={{ display:"flex", gap:8, padding:"10px 16px" }}>
      <button style={s.navBtn} onClick={onPrev}>‹</button>
      <button style={{ ...s.navBtn, fontSize:12, fontWeight:600, width:"auto", padding:"0 12px", color:"#0F172A", opacity:isToday?0.35:1 }} disabled={isToday} onClick={onToday}>Hoy</button>
      <button style={s.navBtn} onClick={onNext}>›</button>
    </div>
  );
}

// ── Pantalla selección becado ─────────────────────────────────────────────────
function BecadoScreen({ becados, onSelect, error }) {
  const groups = [becados.slice(0,5), becados.slice(5,10), becados.slice(10,15)].filter(g => g.length > 0);

  return (
    <div style={s.page}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ padding:"28px 20px 10px", textAlign:"center" }}>
        <div style={{ fontSize:34, marginBottom:6 }}>🏥</div>
        <h1 style={s.title}>Becados</h1>
        <p style={{ fontSize:13, color:"#64748B", margin:0 }}>Toca tu nombre para ver tu horario.</p>
      </div>

      {error && <div style={{ ...s.errorBox, margin:"8px 16px" }}>{error}</div>}

      <div style={{ padding:"8px 16px 40px" }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:YEAR_COLORS[gi], marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:YEAR_COLORS[gi], display:"inline-block" }}/>
              {YEAR_LABELS[gi]}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {group.map(name => (
                <button key={name} className="card-btn" style={s.becadoBtn} onClick={() => onSelect(name)}>
                  <span style={{ width:30, height:30, borderRadius:8, background:YEAR_COLORS[gi]+"18", color:YEAR_COLORS[gi], fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontSize:14, fontWeight:500, color:"#1E293B" }}>{name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tarjeta actividad ─────────────────────────────────────────────────────────
function ActivityCard({ range, activity, accent, light, index }) {
  const [pressed, setPressed] = useState(false);
  const [start, end] = range.split("–").map(x => x.trim());
  return (
    <div
      style={{ background:pressed?light:"#fff", border:`1.5px solid ${pressed?accent:"#F1F5F9"}`, borderRadius:12, padding:"11px 13px", display:"flex", alignItems:"center", gap:11, cursor:"pointer", transition:"all 0.12s", animation:"fadeUp 0.25s ease both", animationDelay:`${index*45}ms`, userSelect:"none", boxShadow:pressed?`0 0 0 3px ${light}`:"0 1px 3px rgba(0,0,0,0.05)" }}
      onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)}
    >
      <div style={{ background:pressed?"#fff":light, borderRadius:8, padding:"5px 7px", minWidth:54, textAlign:"center", flexShrink:0, transition:"background 0.12s" }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:accent, fontWeight:600, lineHeight:1.3 }}>{start}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:accent, opacity:0.6, lineHeight:1.3 }}>{end}</div>
      </div>
      <div style={{ fontSize:14, color:"#1E293B", lineHeight:1.4, fontWeight:500 }}>{activity}</div>
    </div>
  );
}

// ── Tab: Mi horario ───────────────────────────────────────────────────────────
function TabHorario({ becado, onChangeBecado }) {
  const today = useMemo(() => todayISO(), []);
  const [date, setDate] = useState(today);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setError(""); setDaily(null);
      try {
        const data = await apiGet({ route:"daily", becado, date, token:API_TOKEN });
        if (data.ok === false) throw new Error(data.error || "No se pudo obtener horario");
        setDaily(data);
      } catch(e) { setError(String(e.message||e)); }
      finally { setLoading(false); }
    })();
  }, [becado, date]);

  const colors = daily ? getColors(daily.rotationCode) : getColors("default");
  const isToday = date === today;
  const grouped = groupItems(daily?.items);

  return (
    <>
      <div style={{ padding:"20px 16px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
        <div>
          <button style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:"'DM Serif Display',serif", fontSize:22, color:"#0F172A", display:"flex", alignItems:"center", gap:3 }} onClick={onChangeBecado}>
            {becado} <span style={{ fontSize:13, color:"#94A3B8" }}>⌄</span>
          </button>
          <div style={{ fontSize:12, color:"#64748B", marginTop:1, display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ textTransform:"capitalize" }}>{formatDateDisplay(date)}</span>
            {isToday && <span style={s.todayPill}>Hoy</span>}
          </div>
        </div>
        {daily?.rotationCode && (
          <div style={{ fontSize:11, fontWeight:700, borderRadius:99, padding:"4px 10px", background:colors.light, color:colors.accent, flexShrink:0, alignSelf:"flex-start", marginTop:3, letterSpacing:"0.04em" }}>
            {daily.rotationName}
          </div>
        )}
      </div>

      <DateNav date={date} today={today} onPrev={() => setDate(d => offsetDate(d,-1))} onNext={() => setDate(d => offsetDate(d,1))} onToday={() => setDate(today)} />

      <div style={{ padding:"0 16px" }}>
        {error && <div style={s.errorBox}>{error}</div>}
        {loading ? <Spinner accent={colors.accent}/> : grouped.length ? (
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {grouped.map((it,i) => <ActivityCard key={i} index={i} range={it.range} activity={it.activity} accent={colors.accent} light={colors.light}/>)}
          </div>
        ) : !error && (
          <div style={s.empty}>
            <div style={{ fontSize:28, marginBottom:8 }}>📭</div>
            <div style={{ fontSize:14, color:"#94A3B8" }}>Sin actividades para este día</div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Tab: Rotaciones ───────────────────────────────────────────────────────────
function TabRotaciones() {
  const today = useMemo(() => todayISO(), []);
  const [date, setDate] = useState(today);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setError(""); setSummary(null);
      try {
        const data = await apiGet({ route:"summary", date, token:API_TOKEN });
        if (data.ok === false) throw new Error(data.error || "Error cargando resumen");
        setSummary(data);
      } catch(e) { setError(String(e.message||e)); }
      finally { setLoading(false); }
    })();
  }, [date]);

  const isToday = date === today;
  const entries = summary?.groups
    ? ROT_ORDER.filter(k => summary.groups[k]).map(k => [k, summary.groups[k]])
    : [];

  return (
    <>
      <div style={{ padding:"20px 16px 0" }}>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, margin:"0 0 2px", color:"#0F172A" }}>Rotaciones</h2>
        <div style={{ fontSize:12, color:"#64748B", display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ textTransform:"capitalize" }}>{formatDateDisplay(date)}</span>
          {isToday && <span style={s.todayPill}>Hoy</span>}
        </div>
      </div>

      <DateNav date={date} today={today} onPrev={() => setDate(d => offsetDate(d,-1))} onNext={() => setDate(d => offsetDate(d,1))} onToday={() => setDate(today)} />

      <div style={{ padding:"0 16px 40px" }}>
        {error && <div style={s.errorBox}>{error}</div>}
        {loading ? <Spinner/> : entries.length ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {entries.map(([code, names], i) => {
              const colors = getColors(code);
              const rotName = ROTATION_NAMES[code] || code;
              return (
                <div key={code} style={{ background:"#fff", border:`1.5px solid ${colors.light}`, borderRadius:12, overflow:"hidden", animation:"fadeUp 0.25s ease both", animationDelay:`${i*50}ms` }}>
                  <div style={{ background:colors.light, padding:"9px 13px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:colors.accent }}>{rotName}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:colors.accent, background:"#fff", borderRadius:99, padding:"1px 9px" }}>{names.length}</span>
                  </div>
                  <div style={{ padding:"9px 13px", display:"flex", flexDirection:"column", gap:5 }}>
                    {names.map((name, ni) => (
                      <div key={ni} style={{ fontSize:14, color:"#1E293B", display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:colors.accent, flexShrink:0 }}/>
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !error && (
          <div style={s.empty}>
            <div style={{ fontSize:28, marginBottom:8 }}>🗓</div>
            <div style={{ fontSize:14, color:"#94A3B8" }}>Sin datos para este día</div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id:"horario", label:"Mi Horario", icon:"📅" },
    { id:"rotaciones", label:"Rotaciones", icon:"🔄" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"1px solid #F1F5F9", display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
      {tabs.map(tab => (
        <button key={tab.id} style={{ flex:1, border:"none", background:"none", padding:"10px 0 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }} onClick={() => onChange(tab.id)}>
          <span style={{ fontSize:20 }}>{tab.icon}</span>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.03em", color: active===tab.id ? "#0F172A" : "#94A3B8" }}>{tab.label}</span>
          {active===tab.id && <span style={{ width:16, height:2, borderRadius:99, background:"#0F172A", marginTop:1 }}/>}
        </button>
      ))}
    </div>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  const [becado, setBecado] = useState(() => localStorage.getItem("selectedBecado") || "");
  const [becados, setBecados] = useState([]);
  const [loadingBecados, setLoadingBecados] = useState(true);
  const [initError, setInitError] = useState("");
  const [activeTab, setActiveTab] = useState("horario");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet({ route:"becados", token:API_TOKEN });
        if (!data.ok) throw new Error(data.error || "Error cargando becados");
        setBecados(data.becados);
      } catch(e) { setInitError(String(e.message||e)); }
      finally { setLoadingBecados(false); }
    })();
  }, []);

  const handleSelect = (name) => {
    localStorage.setItem("selectedBecado", name);
    setBecado(name);
  };

  const handleChangeBecado = () => {
    localStorage.removeItem("selectedBecado");
    setBecado("");
    setActiveTab("horario");
  };

  if (loadingBecados) return <div style={s.page}><style>{GLOBAL_CSS}</style><Spinner/></div>;
  if (!becado) return <BecadoScreen becados={becados} onSelect={handleSelect} error={initError}/>;

  return (
    <div style={{ ...s.page, paddingBottom:70 }}>
      <style>{GLOBAL_CSS}</style>
      {activeTab === "horario" && <TabHorario becado={becado} onChangeBecado={handleChangeBecado}/>}
      {activeTab === "rotaciones" && <TabRotaciones/>}
      <TabBar active={activeTab} onChange={setActiveTab}/>
    </div>
  );
}

// ── Estilos y CSS global ──────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #F8FAFC; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  .card-btn:active { transform: scale(0.97) !important; }
`;

const s = {
  page: {
    minHeight:"100vh",
    fontFamily:"'DM Sans',sans-serif",
    maxWidth:480,
    margin:"0 auto",
    background:"#F8FAFC",
  },
  title: {
    fontFamily:"'DM Serif Display',serif",
    fontSize:28, margin:"0 0 4px", color:"#0F172A"
  },
  becadoBtn: {
    display:"flex", alignItems:"center", gap:10,
    background:"#fff", border:"1.5px solid #F1F5F9",
    borderRadius:11, padding:"9px 13px", cursor:"pointer",
    textAlign:"left", width:"100%",
    fontFamily:"'DM Sans',sans-serif",
    boxShadow:"0 1px 2px rgba(0,0,0,0.04)",
    transition:"transform 0.15s",
  },
  todayPill: {
    fontSize:10, fontWeight:700, background:"#0F172A", color:"#fff",
    borderRadius:99, padding:"1px 7px", letterSpacing:"0.05em"
  },
  navBtn: {
    background:"#fff", border:"1.5px solid #E2E8F0",
    borderRadius:10, width:36, height:36,
    fontSize:18, cursor:"pointer", color:"#475569",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 1px 2px rgba(0,0,0,0.04)",
  },
  errorBox: {
    background:"#FFF1F2", border:"1px solid #FECDD3",
    borderRadius:11, padding:"11px 13px",
    fontSize:13, color:"#BE123C", marginBottom:10,
  },
  empty: {
    textAlign:"center", padding:"50px 20px"
  },
};
