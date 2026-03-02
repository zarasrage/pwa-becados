import { useEffect, useMemo, useState } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbz9Zme-RquoB2GVh6yj9v9Yl2xFAq2JKO5RnM_Cm5-EYgEQV6CWsD5H4ai3ZtmKiq4U/exec";
const API_TOKEN = "queseyo_calendriobecados2026";

// ── Paleta clínica refinada ───────────────────────────────────────────────────
const ROT = {
  H:   { accent:"#2563EB", light:"#EFF6FF", pill:"#BFDBFE", name:"Hombro" },
  M:   { accent:"#059669", light:"#ECFDF5", pill:"#A7F3D0", name:"Mano" },
  CyP: { accent:"#D97706", light:"#FFFBEB", pill:"#FDE68A", name:"Cadera" },
  R:   { accent:"#7C3AED", light:"#F5F3FF", pill:"#DDD6FE", name:"Rodilla" },
  TyP: { accent:"#DC2626", light:"#FEF2F2", pill:"#FECACA", name:"Tobillo y Pie" },
  Col: { accent:"#0891B2", light:"#ECFEFF", pill:"#A5F3FC", name:"Columna" },
  "":  { accent:"#64748B", light:"#F8FAFC", pill:"#E2E8F0", name:"Sin rotación" },
};
const ROT_ORDER = ["H","M","CyP","R","TyP","Col",""];

const YEAR_COLORS = ["#2563EB","#7C3AED","#0891B2"];
const YEAR_LABELS = ["1er año","2do año","3er año"];

function rot(code) { return ROT[code] || ROT[""]; }

// ── Utilidades ────────────────────────────────────────────────────────────────
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
async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  return (await fetch(url.toString())).json();
}
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

// ── CSS global ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { background: #F0F4F8; font-family: 'Outfit', sans-serif; }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  .anim { animation: fadeSlide 0.3s ease both; }

  .btn-press { transition: transform 0.1s, box-shadow 0.1s; -webkit-tap-highlight-color: transparent; }
  .btn-press:active { transform: scale(0.96); }

  .tab-btn { transition: color 0.2s; -webkit-tap-highlight-color: transparent; }

  ::-webkit-scrollbar { width: 0; }
`;

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = "#2563EB" }) {
  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"52px 0"}}>
      <div style={{width:22,height:22,border:"2.5px solid #E2E8F0",borderTopColor:color,borderRadius:"50%",animation:"spin 0.65s linear infinite"}}/>
    </div>
  );
}

// ── Chip de fecha ─────────────────────────────────────────────────────────────
function DateStrip({ date, today, onPrev, onNext, onToday }) {
  const isToday = date === today;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 16px 10px"}}>
      <button className="btn-press" onClick={onPrev}
        style={{width:30,height:30,borderRadius:8,border:"1px solid #DDE3EC",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#64748B"}}>
        ‹
      </button>
      <div style={{flex:1,textAlign:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1E293B",textTransform:"capitalize",letterSpacing:"0.01em"}}>
          {formatDate(date)}
        </div>
      </div>
      <button className="btn-press" onClick={onNext}
        style={{width:30,height:30,borderRadius:8,border:"1px solid #DDE3EC",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#64748B"}}>
        ›
      </button>
      {!isToday && (
        <button className="btn-press" onClick={onToday}
          style={{height:30,padding:"0 10px",borderRadius:8,border:"1px solid #2563EB",background:"#EFF6FF",cursor:"pointer",fontSize:11,fontWeight:700,color:"#2563EB",letterSpacing:"0.04em"}}>
          HOY
        </button>
      )}
    </div>
  );
}

// ── Tarjeta de actividad ──────────────────────────────────────────────────────
function ActivityCard({ from, to, activity, accent, light, index }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="btn-press anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: pressed ? light : "#fff",
        border: `1px solid ${pressed ? accent+"44" : "#E8EDF4"}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        padding: "11px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        boxShadow: pressed ? `0 0 0 3px ${accent}18` : "0 1px 3px rgba(15,23,42,0.06)",
        userSelect: "none",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:52,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:accent,lineHeight:1.2}}>{from}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:accent,opacity:0.55,lineHeight:1.2,marginTop:1}}>{to}</div>
      </div>
      <div style={{width:1,height:28,background:`${accent}30`,flexShrink:0}}/>
      <div style={{fontSize:14,color:"#1E293B",fontWeight:500,lineHeight:1.35}}>{activity}</div>
    </div>
  );
}

// ── Pantalla de selección ─────────────────────────────────────────────────────
function SelectScreen({ becados, onSelect, error }) {
  const groups = [becados.slice(0,5), becados.slice(5,10), becados.slice(10,15)].filter(g=>g.length>0);
  return (
    <div style={{minHeight:"100vh",background:"#F0F4F8",fontFamily:"'Outfit',sans-serif",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E8EDF4",padding:"32px 20px 20px",position:"sticky",top:0,zIndex:10}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"#94A3B8",textTransform:"uppercase",marginBottom:4}}>
          Traumatología · Becados
        </div>
        <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:30,color:"#0F172A",fontWeight:400,lineHeight:1.1}}>
          ¿Quién eres?
        </h1>
      </div>

      {error && (
        <div style={{margin:"12px 16px",padding:"10px 13px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,fontSize:13,color:"#DC2626"}}>
          {error}
        </div>
      )}

      <div style={{padding:"12px 16px 40px"}}>
        {groups.map((group, gi) => (
          <div key={gi} className="anim" style={{marginBottom:20,animationDelay:`${gi*80}ms`}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:YEAR_COLORS[gi],marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:YEAR_COLORS[gi]}}/>
              {YEAR_LABELS[gi]}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:5}}>
              {group.map(name => (
                <button key={name} className="btn-press"
                  style={{display:"flex",alignItems:"center",gap:11,background:"#fff",border:"1px solid #E8EDF4",borderRadius:10,padding:"10px 13px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Outfit',sans-serif",boxShadow:"0 1px 2px rgba(15,23,42,0.04)"}}
                  onClick={() => onSelect(name)}
                >
                  <span style={{width:32,height:32,borderRadius:8,background:`${YEAR_COLORS[gi]}14`,color:YEAR_COLORS[gi],fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{fontSize:14,fontWeight:500,color:"#1E293B"}}>{name}</span>
                  <span style={{marginLeft:"auto",fontSize:16,color:"#CBD5E1"}}>›</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Mi horario ───────────────────────────────────────────────────────────
function TabHorario({ becado, onChangeBecado }) {
  const today = useMemo(()=>todayISO(),[]);
  const [date, setDate] = useState(today);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(()=>{
    (async()=>{
      setLoading(true); setError(""); setDaily(null);
      try{
        const d = await apiGet({route:"daily",becado,date,token:API_TOKEN});
        if(d.ok===false) throw new Error(d.error||"Error");
        setDaily(d);
      }catch(e){ setError(String(e.message||e)); }
      finally{ setLoading(false); }
    })();
  },[becado,date]);

  const c = daily ? rot(daily.rotationCode) : rot("");
  const grouped = groupItems(daily?.items);

  return (
    <div style={{paddingBottom:4}}>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E8EDF4",padding:"20px 16px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"#94A3B8",textTransform:"uppercase",marginBottom:2}}>Mi horario</div>
            <button style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"baseline",gap:5}}
              onClick={onChangeBecado}>
              <span style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:"#0F172A",fontWeight:400}}>{becado}</span>
              <span style={{fontSize:12,color:"#94A3B8",fontWeight:500}}>cambiar</span>
            </button>
          </div>
          {daily?.rotationCode && (
            <div style={{display:"flex",alignItems:"center",gap:6,background:c.light,border:`1px solid ${c.pill}`,borderRadius:99,padding:"5px 11px"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:c.accent,display:"inline-block"}}/>
              <span style={{fontSize:12,fontWeight:600,color:c.accent,letterSpacing:"0.02em"}}>{c.name}</span>
            </div>
          )}
        </div>
        <DateStrip date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)}/>
      </div>

      {/* Contenido */}
      <div style={{padding:"12px 16px"}}>
        {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 13px",fontSize:13,color:"#DC2626",marginBottom:10}}>{error}</div>}
        {loading ? <Spinner color={c.accent}/> : grouped.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {grouped.map((it,i)=>(
              <ActivityCard key={i} index={i} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light}/>
            ))}
          </div>
        ) : !error && (
          <div style={{textAlign:"center",padding:"52px 0"}}>
            <div style={{fontSize:36,marginBottom:10,opacity:0.4}}>📭</div>
            <div style={{fontSize:14,color:"#94A3B8",fontWeight:500}}>Sin actividades este día</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Rotaciones ───────────────────────────────────────────────────────────
function TabRotaciones() {
  const today = useMemo(()=>todayISO(),[]);
  const [date, setDate] = useState(today);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(()=>{
    (async()=>{
      setLoading(true); setError(""); setSummary(null);
      try{
        const d = await apiGet({route:"summary",date,token:API_TOKEN});
        if(d.ok===false) throw new Error(d.error||"Error");
        setSummary(d);
      }catch(e){ setError(String(e.message||e)); }
      finally{ setLoading(false); }
    })();
  },[date]);

  const entries = summary?.groups
    ? ROT_ORDER.filter(k=>summary.groups[k]).map(k=>[k,summary.groups[k]])
    : [];

  return (
    <div style={{paddingBottom:4}}>
      <div style={{background:"#fff",borderBottom:"1px solid #E8EDF4",padding:"20px 16px 14px"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"#94A3B8",textTransform:"uppercase",marginBottom:2}}>Vista general</div>
        <div style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:"#0F172A",fontWeight:400,marginBottom:10}}>Rotaciones</div>
        <DateStrip date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)}/>
      </div>

      <div style={{padding:"12px 16px"}}>
        {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 13px",fontSize:13,color:"#DC2626",marginBottom:10}}>{error}</div>}
        {loading ? <Spinner/> : entries.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {entries.map(([code,names],i)=>{
              const c = rot(code);
              return (
                <div key={code} className="anim" style={{animationDelay:`${i*50}ms`,background:"#fff",border:`1px solid #E8EDF4`,borderTop:`3px solid ${c.accent}`,borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(15,23,42,0.05)"}}>
                  <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #F1F5F9"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:c.accent,display:"inline-block"}}/>
                      <span style={{fontSize:13,fontWeight:700,color:"#1E293B",letterSpacing:"0.01em"}}>{c.name}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:c.accent,background:c.light,border:`1px solid ${c.pill}`,borderRadius:99,padding:"2px 9px"}}>
                      {names.length} becado{names.length!==1?"s":""}
                    </span>
                  </div>
                  <div style={{padding:"8px 14px 10px",display:"flex",flexDirection:"column",gap:4}}>
                    {names.map((name,ni)=>(
                      <div key={ni} style={{fontSize:13,color:"#475569",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
                        <span style={{width:4,height:4,borderRadius:"50%",background:c.accent,opacity:0.5,flexShrink:0}}/>
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !error && (
          <div style={{textAlign:"center",padding:"52px 0"}}>
            <div style={{fontSize:36,marginBottom:10,opacity:0.4}}>🗓</div>
            <div style={{fontSize:14,color:"#94A3B8",fontWeight:500}}>Sin datos para este día</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id:"horario",    icon:"◑", label:"Mi Horario" },
    { id:"rotaciones", icon:"⊞", label:"Rotaciones" },
  ];
  return (
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,
      background:"rgba(255,255,255,0.88)",
      backdropFilter:"blur(16px)",
      WebkitBackdropFilter:"blur(16px)",
      borderTop:"1px solid rgba(226,232,240,0.8)",
      display:"flex",
      paddingBottom:"env(safe-area-inset-bottom,8px)",
      zIndex:50,
    }}>
      {tabs.map(tab=>{
        const isActive = active === tab.id;
        return (
          <button key={tab.id} className="tab-btn"
            style={{flex:1,border:"none",background:"none",padding:"10px 0 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:isActive?"#2563EB":"#94A3B8"}}
            onClick={()=>onChange(tab.id)}
          >
            <span style={{fontSize:18,lineHeight:1}}>{tab.icon}</span>
            <span style={{fontSize:10,fontWeight:isActive?700:500,letterSpacing:"0.04em"}}>{tab.label}</span>
            <span style={{width:isActive?16:0,height:2,borderRadius:99,background:"#2563EB",transition:"width 0.2s ease",marginTop:1}}/>
          </button>
        );
      })}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [becado, setBecado] = useState(()=>localStorage.getItem("selectedBecado")||"");
  const [becados, setBecados] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState("");
  const [activeTab, setActiveTab] = useState("horario");

  useEffect(()=>{
    (async()=>{
      try{
        const d = await apiGet({route:"becados",token:API_TOKEN});
        if(!d.ok) throw new Error(d.error||"Error");
        setBecados(d.becados);
      }catch(e){ setInitError(String(e.message||e)); }
      finally{ setLoadingInit(false); }
    })();
  },[]);

  const handleSelect = name => { localStorage.setItem("selectedBecado",name); setBecado(name); };
  const handleChange = () => { localStorage.removeItem("selectedBecado"); setBecado(""); setActiveTab("horario"); };

  if(loadingInit) return (
    <div style={{minHeight:"100vh",background:"#F0F4F8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style>
      <Spinner/>
    </div>
  );

  if(!becado) return <SelectScreen becados={becados} onSelect={handleSelect} error={initError}/>;

  return (
    <div style={{minHeight:"100vh",background:"#F0F4F8",fontFamily:"'Outfit',sans-serif",maxWidth:480,margin:"0 auto",paddingBottom:72}}>
      <style>{CSS}</style>
      {activeTab==="horario" && <TabHorario becado={becado} onChangeBecado={handleChange}/>}
      {activeTab==="rotaciones" && <TabRotaciones/>}
      <TabBar active={activeTab} onChange={setActiveTab}/>
    </div>
  );
}