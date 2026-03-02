import { useEffect, useMemo, useState } from "react";

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
  "":  { accent:"#64748B", glow:"#64748B28", light:"#64748B12", dark:"#64748B22", name:"Sin rotación" },
};
const ROT_ORDER = ["H","M","CyP","R","TyP","Col",""];

// Año: azul institucional, verde, morado
const YEAR_COLORS = ["#348FFF","#13C045","#8B73FF"];
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
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  .anim  { animation: fadeUp 0.28s ease both; }
  .fade  { animation: fadeIn 0.2s ease both; }
  .press { transition: transform 0.1s, opacity 0.1s; -webkit-tap-highlight-color: transparent; cursor: pointer; }
  .press:active { transform: scale(0.96); opacity: 0.82; }
  ::-webkit-scrollbar { width: 0; }
`;

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({ theme, onToggle, onClose, T }) {
  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.3)"}}/>
      {/* Panel */}
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
        <button className="press"
          onClick={onToggle}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:16}}>{theme==="dark" ? "🌙" : "☀️"}</span>
            <span style={{fontSize:13,fontWeight:500,color:T.text}}>{theme==="dark" ? "Dark" : "Light"}</span>
          </div>
          {/* Toggle pill */}
          <div style={{width:36,height:20,borderRadius:99,background:theme==="dark"?"#348FFF":T.border,position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:theme==="dark"?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </button>
      </div>
    </>
  );
}

// ── Gear button (esquina sup derecha) ─────────────────────────────────────────
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

// ── Select screen ─────────────────────────────────────────────────────────────
function SelectScreen({ becados, onSelect, onShowRotaciones, error, T }) {
  const groups = [becados.slice(0,5),becados.slice(5,10),becados.slice(10,15)].filter(g=>g.length>0);
  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40}}>
      {/* Glow decorativo */}
      <div style={{position:"fixed",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"#348FFF08",filter:"blur(50px)",pointerEvents:"none",zIndex:0}}/>

      <div style={{padding:"56px 16px 16px",position:"relative",zIndex:1}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",marginBottom:6}}>
          Traumatología · Becados
        </div>
        <p style={{fontSize:14,color:T.sub,lineHeight:1.5,marginBottom:14}}>
          Elige tu nombre para ver tu horario del día.
        </p>
        <button className="press anim" onClick={onShowRotaciones}
          style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.sub,animationDelay:"80ms"}}>
          <span>⊞</span> Ver rotaciones de hoy
        </button>
      </div>

      {error && <div style={{margin:"0 16px 12px",position:"relative",zIndex:1}}><ErrorBox msg={error} T={T}/></div>}

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        {groups.map((group,gi) => (
          <div key={gi} className="anim" style={{marginBottom:20,animationDelay:`${gi*70+120}ms`}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:YEAR_COLORS[gi],marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:YEAR_COLORS[gi]}}/>
              {YEAR_LABELS[gi]}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {group.map(name => (
                <button key={name} className="press"
                  style={{display:"flex",alignItems:"center",gap:11,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 13px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Inter',sans-serif"}}
                  onClick={() => onSelect(name)}
                >
                  <span style={{width:32,height:32,borderRadius:8,background:`${YEAR_COLORS[gi]}18`,color:YEAR_COLORS[gi],fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{fontSize:14,fontWeight:500,color:T.text,flex:1}}>{name}</span>
                  <span style={{fontSize:15,color:T.muted}}>›</span>
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
function TabHorario({ becado, onChangeBecado, T }) {
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

  const c = daily?.rotationCode ? rot(daily.rotationCode) : rot("");
  const grouped = groupItems(daily?.items);

  return (
    <>
      {/* Glow de rotación */}
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
        <ErrorBox msg={error} T={T}/>
        {loading ? <Spinner color={c.accent}/> : grouped.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {grouped.map((it,i)=>(
              <ActivityCard key={i} index={i} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>
            ))}
          </div>
        ) : !error && (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:38,marginBottom:10,opacity:0.2}}>📭</div>
            <div style={{fontSize:14,color:T.muted,fontWeight:500}}>Sin actividades este día</div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Tab: Rotaciones ───────────────────────────────────────────────────────────
function TabRotaciones({ T }) {
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
    <>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Vista general</div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,marginBottom:12}}>Rotaciones</div>
        <DateNav date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)} T={T}/>
      </div>

      <div style={{padding:"0 16px"}}>
        <ErrorBox msg={error} T={T}/>
        {loading ? <Spinner/> : entries.length ? (
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
    </>
  );
}

// ── Tab: Mi semana ────────────────────────────────────────────────────────────
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

function TabSemana({ becado, T }) {
  const today = useMemo(()=>todayISO(),[]);
  const [refDate, setRefDate] = useState(today);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const weekDates = useMemo(()=>getWeekDates(refDate),[refDate]);

  useEffect(()=>{
    (async()=>{
      setLoading(true); setDays([]);
      const results = await Promise.all(
        weekDates.map(date =>
          apiGet({route:"daily",becado,date,token:API_TOKEN})
            .then(d=>({date, ok:d.ok!==false, rotationCode:d.rotationCode||"", rotationName:d.rotationName||"", items:d.items||[]}))
            .catch(()=>({date, ok:false, rotationCode:"", rotationName:"", items:[]}))
        )
      );
      setDays(results);
      setLoading(false);
    })();
  },[becado, weekDates]);

  const prevWeek = () => setRefDate(d=>offsetDate(d,-7));
  const nextWeek = () => setRefDate(d=>offsetDate(d,7));
  const thisWeek = () => setRefDate(today);
  const isThisWeek = weekDates.includes(today);

  return (
    <>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi semana</div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,marginBottom:12}}>{becado}</div>

        {/* Nav semana */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button className="press" onClick={prevWeek}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text}}>{weekRangeLabel(weekDates)}</div>
          <button className="press" onClick={nextWeek}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
          {!isThisWeek && (
            <button className="press" onClick={thisWeek}
              style={{height:32,padding:"0 11px",borderRadius:8,border:"1px solid #348FFF60",background:"#348FFF14",fontSize:11,fontWeight:700,color:"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
              HOY
            </button>
          )}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        {loading ? <Spinner/> : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {days.map((day,i)=>{
              const c = rot(day.rotationCode);
              const grouped = groupItems(day.items);
              const isToday = day.date === today;
              return (
                <div key={day.date} className="anim"
                  style={{animationDelay:`${i*35}ms`,background:T.surface,border:`1px solid ${isToday ? c.accent+"60" : T.border}`,borderLeft:`3px solid ${day.rotationCode ? c.accent : T.border}`,borderRadius:12,overflow:"hidden",boxShadow:isToday?`0 0 0 1px ${c.accent}30`:"none"}}>
                  {/* Header del día */}
                  <div style={{padding:"9px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",background: isToday ? c.light : "transparent", borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:12,fontWeight:700,color: isToday ? c.accent : T.sub,textTransform:"capitalize",fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                        {weekLabel(day.date)}
                      </span>
                      {isToday && <span style={{fontSize:9,fontWeight:700,background:c.accent,color:"#fff",borderRadius:99,padding:"1px 6px",letterSpacing:"0.05em"}}>HOY</span>}
                    </div>
                    {day.rotationCode ? (
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:c.accent,display:"inline-block",boxShadow:`0 0 5px ${c.accent}`}}/>
                        <span style={{fontSize:11,fontWeight:600,color:c.accent}}>{c.name}</span>
                      </div>
                    ) : (
                      <span style={{fontSize:11,color:T.muted}}>Sin rotación</span>
                    )}
                  </div>

                  {/* Actividades compactas */}
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
                      <span style={{fontSize:12,color:T.muted}}>Sin actividades</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}


function TabBar({ active, onChange, T }) {
  const tabs = [
    { id:"horario",    icon:"◑", label:"Mi Horario" },
    { id:"semana",     icon:"▦", label:"Semana" },
    { id:"rotaciones", icon:"⊞", label:"Rotaciones" },
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
  const [theme, setTheme] = useState(()=>localStorage.getItem("theme")||"dark");
  const [showSettings, setShowSettings] = useState(false);
  const [becado, setBecado] = useState(()=>localStorage.getItem("selectedBecado")||"");
  const [becados, setBecados] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState("");
  const [activeTab, setActiveTab] = useState("horario");

  const T = THEMES[theme];

  const toggleTheme = () => {
    const next = theme==="dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

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
  const handleShowRotaciones = () => { setBecado("__rotaciones__"); };

  if(loadingInit) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style><Spinner/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom: becado&&becado!=="__rotaciones__" ? 72 : 0, position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Gear button — siempre visible */}
      <GearBtn onClick={()=>setShowSettings(s=>!s)} T={T}/>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel theme={theme} onToggle={()=>{ toggleTheme(); }} onClose={()=>setShowSettings(false)} T={T}/>
      )}

      {/* Contenido según estado */}
      {loadingInit ? <Spinner/> :
       !becado ? (
         <SelectScreen becados={becados} onSelect={handleSelect} onShowRotaciones={handleShowRotaciones} error={initError} T={T}/>
       ) : becado==="__rotaciones__" ? (
         <>
           <div style={{paddingBottom:72}}>
             <TabRotaciones T={T}/>
           </div>
           <TabBar active="rotaciones" onChange={tab=>{ if(tab==="horario") setBecado(""); else setActiveTab(tab); }} T={T}/>
         </>
       ) : (
         <>
           {activeTab==="horario" && <TabHorario becado={becado} onChangeBecado={handleChange} T={T}/>}
           {activeTab==="semana" && <TabSemana becado={becado} T={T}/>}
           {activeTab==="rotaciones" && <TabRotaciones T={T}/>}
           <TabBar active={activeTab} onChange={setActiveTab} T={T}/>
         </>
       )
      }
    </div>
  );
}
