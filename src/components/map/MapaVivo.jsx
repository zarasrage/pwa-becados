import { useEffect, useMemo, useState } from "react";
import { API_TOKEN } from "../../constants/api.js";
import { MAP_BUILDINGS } from "../../constants/map.js";
import { ROT } from "../../constants/rotations.js";
import { todayISO, offsetDate, m2t, t2m } from "../../utils/dates.js";
import { apiGet, apiSWR } from "../../utils/api.js";
import { DEMO_BECADO, DEMO_MAP_NAMES, DEMO_ACTIVITIES, demoSummary, demoMonthly } from "../../data/demo.js";
import { DateNav } from "../ui/DateNav.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { BuildingCard } from "./BuildingCard.jsx";
import { safeStorage } from "../../utils/storage.js";
import { PART_ORDER, PART_LABELS, getRecoloredFrames } from "./recolorSprites.js";

// Presets de color por parte (además del color picker libre)
const PART_PRESETS = {
  piel:    ["#FADCC3","#F1C27D","#E0AC69","#C68642","#8D5524","#5C3A21"],
  pelo:    ["#0A0A0A","#3D2B1F","#6A4E42","#B87333","#D4B896","#C8C8CE"],
  ojos:    ["#3E2A1E","#5B8C51","#3B7CC4","#7A8B99","#111111"],
  labios:  ["#F66C8F","#E8556F","#C94A5A","#B36A5E","#8D5524"],
  traje:   ["#2272C8","#0EA5A0","#16A34A","#7C3AED","#DB2777","#334155","#E2E8F0"],
  zapatos: ["#1A1A1A","#3D2B1F","#FFFFFF","#2272C8","#B00020"],
};

// Preview estático (frame 0) del muñeco con los colores elegidos
function SpritePreview({ look, size = 44 }) {
  const [src, setSrc] = useState(`/sprites/doctorv2/frame_0.png`);
  const key = look ? JSON.stringify(look) : "";
  useEffect(() => {
    let alive = true;
    getRecoloredFrames(look)
      .then((urls) => { if (alive) setSrc(urls?.[0] || `/sprites/doctorv2/frame_0.png`); })
      .catch(() => {});
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return <img src={src} width={size} height={size} alt="preview" style={{imageRendering:"pixelated",display:"block"}}/>;
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
  if (turno?.diaCode === "p" && nowMin >= 480 && nowMin < 660) return "policlinicos";
  if (turno?.diaCode === "D" && nowMin >= 840 && nowMin < 1200) return "urgencia";
  if (turno?.nocheCode === "N" && nowMin >= 1200) return "urgencia";
  const act = getCurrentActivity(schedItems, nowMin);
  return act ? activityToBuilding(act.activity) : null;
}

// Limita la concurrencia de fetches para no saturar Supabase
async function mapLimit(items, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
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
  const [editMode, setEditMode] = useState(false);
  const [avatarLooks, setAvatarLooks] = useState(() => {
    try { return JSON.parse(safeStorage.get("avatarLooksV2") || "{}"); } catch { return {}; }
  });

  const updateLook = (name, part, hex) => {
    setAvatarLooks(prev => {
      const next = { ...prev, [name]: { ...(prev[name] || {}), [part]: hex } };
      safeStorage.set("avatarLooksV2", JSON.stringify(next));
      return next;
    });
  };
  const resetLook = (name) => {
    setAvatarLooks(prev => {
      const next = { ...prev };
      delete next[name];
      safeStorage.set("avatarLooksV2", JSON.stringify(next));
      return next;
    });
  };

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
          summary = await apiSWR({ route:"summary", date, token:API_TOKEN }, ()=>{}, ()=>{});
          monthly = { ok:false };
        }

        if (!summary.ok || !summary.groups) { setRawData(null); setLoading(false); return; }

        // Horario REAL de cada becado (no reutilizar el del líder del grupo)
        const becadoData = {};

        if (demoMode) {
          // Modo demo: usa actividades genéricas por rotación
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
          const [dy,dm,dd] = date.split("-").map(Number);
          const dow = new Date(dy,dm-1,dd).getDay();
          const hasSem = [2,3,4].includes(dow);
          for (const [rotCode, names] of Object.entries(summary.groups)) {
            const acts = DEMO_ACTIVITIES[rotCode] || [];
            names.forEach((name, ni) => {
              if (name === DEMO_BECADO) return;
              becadoData[name] = {
                items: acts.map(([time, activity]) => ({ time, activity })),
                turno: turnoLookup[name] || {},
                seminario: (hasSem && ni === 0) ? { presenter:name, title:"Presentación demo", tag:"Seminario", time:"07:30" } : null,
                rotationCode: rotCode,
              };
            });
          }
        } else {
          // Modo real: consulta getDaily por cada becado (concurrencia limitada)
          const allNames = [];
          for (const names of Object.values(summary.groups)) {
            for (const n of names) if (n !== DEMO_BECADO && !allNames.includes(n)) allNames.push(n);
          }
          await mapLimit(allNames, 8, async (name) => {
            try {
              const daily = await apiGet({ route:"daily", becado:name, date, token:API_TOKEN });
              if (daily.ok !== false) {
                becadoData[name] = {
                  items: daily.items || [],
                  turno: daily.turno || {},
                  seminario: daily.seminario || null,
                  rotationCode: daily.rotationCode || "",
                };
              }
            } catch {}
          });
        }

        setRawData({ summary, becadoData });
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
      for (const name of names) {
        if (name === DEMO_BECADO) continue;
        const bd = rawData.becadoData[name];
        if (!bd) continue;
        const building = resolveBecadoBuilding(bd.items, bd.turno, bd.seminario, simMin);
        if (building && result[building]) {
          result[building].push({
            name,
            initial: name.charAt(0).toUpperCase(),
            color: ROT[rotCode]?.accent || getBecadoColor(name, activeBecados),
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
                  avatarLooks={avatarLooks}
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
                {(() => {
                  const look = avatarLooks[selected.name] || {};
                  const hasCustom = !!avatarLooks[selected.name] && Object.keys(look).length > 0;
                  return (
                    <>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                        <SpritePreview look={look} size={44}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:T.text}}>{selected.name}</div>
                          <div style={{fontSize:11,color:T.muted}}>{selected.rotName}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:selectedBuilding.accent,boxShadow:`0 0 6px ${selectedBuilding.accent}`}}/>
                        <span style={{fontSize:12,fontWeight:600,color:selectedBuilding.accent}}>{selectedBuilding.label}</span>
                        <span style={{fontSize:11,color:T.muted}}>· {selectedBuilding.desc}</span>
                      </div>

                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:editMode?10:0}}>
                        <button className="press" onClick={() => setEditMode(e => !e)}
                          style={{fontSize:11,fontWeight:700,color:editMode?"#fff":T.accent||"#348FFF",background:editMode?(T.accent||"#348FFF"):(T.accent||"#348FFF")+"18",border:`1px solid ${(T.accent||"#348FFF")}50`,borderRadius:8,padding:"5px 12px"}}>
                          {editMode ? "✓ Listo" : "🎨 Editar apariencia"}
                        </button>
                        {hasCustom && (
                          <button className="press" onClick={() => resetLook(selected.name)}
                            style={{fontSize:11,fontWeight:600,color:T.muted,background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px"}}>
                            Restablecer
                          </button>
                        )}
                      </div>

                      {editMode && (
                        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:4}}>
                          {PART_ORDER.map((part) => (
                            <div key={part}>
                              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:T.muted,marginBottom:5}}>{PART_LABELS[part]}</div>
                              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                {(PART_PRESETS[part] || []).map((c) => {
                                  const active = (look[part] || "").toUpperCase() === c.toUpperCase();
                                  return (
                                    <button key={c} className="press" onClick={() => updateLook(selected.name, part, c)}
                                      style={{width:26,height:26,borderRadius:"50%",background:c,border:active?`2.5px solid ${T.accent||"#348FFF"}`:`1px solid ${T.border}`,boxShadow:active?`0 0 0 2px ${(T.accent||"#348FFF")}30`:"none",cursor:"pointer",flexShrink:0}}/>
                                  );
                                })}
                                <label className="press" style={{width:26,height:26,borderRadius:"50%",border:`1px dashed ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",overflow:"hidden",flexShrink:0}}>
                                  <span style={{fontSize:12,color:T.muted}}>+</span>
                                  <input type="color" value={look[part] || "#888888"} onChange={e => updateLook(selected.name, part, e.target.value)}
                                    style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}}/>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
