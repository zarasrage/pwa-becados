import { useEffect, useMemo, useState } from "react";
import { API_TOKEN } from "../../constants/api.js";
import { MAP_BUILDINGS } from "../../constants/map.js";
import { ROT } from "../../constants/rotations.js";
import { todayISO, offsetDate, m2t, t2m } from "../../utils/dates.js";
import { apiGet } from "../../utils/api.js";
import { DEMO_BECADO, DEMO_MAP_NAMES, DEMO_ACTIVITIES, demoSummary, demoMonthly } from "../../data/demo.js";
import { DateNav } from "../ui/DateNav.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { PixelAvatar } from "./PixelAvatar.jsx";
import { BuildingCard } from "./BuildingCard.jsx";

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
  if (turno?.diaCode === "p" && nowMin >= 480 && nowMin < 660) return "policlinicos";
  if (turno?.diaCode === "D" && nowMin >= 840 && nowMin < 1200) return "urgencia";
  if (turno?.nocheCode === "N" && nowMin >= 1200) return "urgencia";
  const act = getCurrentActivity(schedItems, nowMin);
  return act ? activityToBuilding(act.activity) : null;
}

export function MapaVivo({ becados, T, onBack }) {
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
            if (e.type === "P" || e.type === "p" || e.type === "D") turnoLookup[e.name].diaCode = e.type;
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
