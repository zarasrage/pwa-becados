import { useEffect, useMemo, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { todayISO, offsetDate, getWeekDates, weekRangeLabel } from "../utils/dates.js";
import { useApiData } from "../hooks/useApiData.js";
import { apiSWR } from "../utils/api.js";
import { Spinner } from "../components/ui/Spinner.jsx";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("es-CL", { month:"long", year:"numeric" });
}

// Feriados chilenos 2025–2026
const FERIADOS = new Set([
  "2025-01-01","2025-04-18","2025-04-19","2025-05-01","2025-05-21",
  "2025-06-20","2025-06-29","2025-07-16","2025-08-15","2025-09-18",
  "2025-09-19","2025-10-12","2025-10-31","2025-11-01","2025-12-08","2025-12-25",
  "2026-01-01","2026-04-03","2026-04-04","2026-05-01","2026-05-21",
  "2026-06-29","2026-07-16","2026-08-15","2026-09-18","2026-09-19",
  "2026-10-12","2026-10-31","2026-11-01","2026-12-08","2026-12-25",
]);

const TIPO_COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00", S:"#E879F9" };

function isWeekend(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m-1, d).getDay();
  return dow === 0 || dow === 6;
}

function computeStats(entries) {
  const byBecado = {};
  (entries || []).forEach(e => {
    if (!["P","D","N","A","S"].includes(e.type)) return;
    const nombre = e.type === "S" ? e.presenter || e.name : e.name;
    if (!nombre) return;
    if (!byBecado[nombre]) byBecado[nombre] = { P:0, D:0, N:0, nFinde:0, nFeriado:0, A:0, S:0 };
    const b = byBecado[nombre];
    const finde   = isWeekend(e.date);
    const feriado = FERIADOS.has(e.date);
    if (e.type === "N") {
      b.N++;
      if (finde)   b.nFinde++;
      if (feriado) b.nFeriado++;
    } else {
      b[e.type]++;
    }
  });
  return Object.entries(byBecado).map(([name, s]) => {
    const nNormal = s.N - s.nFinde - s.nFeriado;
    const peso = s.P * 4 + s.D * 6 + nNormal * 12 + s.nFinde * 24 + s.nFeriado * 24 + s.A * 1 + s.S * 6;
    const total = s.P + s.D + s.N + s.A + s.S;
    return { name, ...s, nNormal, total, peso };
  }).sort((a, b) => b.peso - a.peso);
}

function monthsUpTo(toYear, toMonth) {
  const result = [];
  let y = 2025, m = 1;
  while (y < toYear || (y === toYear && m <= toMonth)) {
    result.push(`${y}-${String(m).padStart(2,"0")}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return result;
}

const MODES = ["semana","mes","historico"];
const MODE_LABEL = { semana:"Semana", mes:"Mes", historico:"Histórico" };

export function TabEstadisticas({ onBack, T }) {
  const today = useMemo(() => todayISO(), []);
  const [viewMode, setViewMode] = useState("mes");

  // --- Mes ---
  const [year,  setYear]  = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);
  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
  const mesParams = useMemo(() => ({ route:"monthly", month: monthStr, token: API_TOKEN }), [monthStr]);
  const { data: mesData, error: mesError } = useApiData(mesParams);

  const prevMonth = () => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1);

  // --- Semana ---
  const [weekRef, setWeekRef] = useState(() => today);
  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef]);
  const weekDateSet = useMemo(() => new Set(weekDates), [weekDates]);
  const prevWeek = () => setWeekRef(d => offsetDate(d, -7));
  const nextWeek = () => setWeekRef(d => offsetDate(d,  7));

  // --- Multi-fetch (semana + historico) ---
  const [multiEntries, setMultiEntries] = useState(null);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError,   setMultiError]   = useState("");

  useEffect(() => {
    if (viewMode === "mes") return;
    setMultiLoading(true);
    setMultiEntries(null);
    setMultiError("");

    let months;
    if (viewMode === "semana") {
      const ms = new Set(weekDates.map(d => d.slice(0,7)));
      months = [...ms];
    } else {
      const [cy, cm] = today.split("-").map(Number);
      months = monthsUpTo(cy, cm);
    }

    Promise.all(
      months.map(ms => apiSWR({ route:"monthly", month: ms, token: API_TOKEN }, ()=>{}, ()=>{}).catch(() => ({ ok:false, entries:[] })))
    ).then(results => {
      setMultiEntries(results.flatMap(r => r.ok ? (r.entries || []) : []));
      setMultiLoading(false);
    }).catch(e => {
      setMultiError(String(e.message || e));
      setMultiLoading(false);
    });
  }, [viewMode, weekRef]);

  // --- Stats activas ---
  const activeStats = useMemo(() => {
    if (viewMode === "mes") {
      if (!mesData?.ok) return [];
      return computeStats(mesData.entries);
    }
    if (!multiEntries) return [];
    const entries = viewMode === "semana"
      ? multiEntries.filter(e => weekDateSet.has(e.date))
      : multiEntries;
    return computeStats(entries);
  }, [viewMode, mesData, multiEntries, weekDateSet]);

  const maxPeso = activeStats[0]?.peso || 1;

  const isLoading = viewMode === "mes" ? !mesData : multiLoading;
  const activeError = viewMode === "mes" ? mesError : multiError;

  // Título grande
  const bigTitle = viewMode === "semana"
    ? weekRangeLabel(weekDates)
    : viewMode === "mes"
    ? monthLabel(year, month)
    : "Todos los meses";

  return (
    <div style={{minHeight:"100vh", paddingBottom:32, position:"relative", zIndex:1}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>

        {/* Header row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase"}}>Estadísticas</div>
          <div style={{display:"flex",gap:4}}>
            {MODES.map(mode => (
              <button key={mode} className="press" onClick={() => setViewMode(mode)} style={{
                fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:99,
                border:`1px solid ${viewMode===mode ? T.accent : T.border}`,
                background: viewMode===mode ? `${T.accent}20` : T.surface2,
                color: viewMode===mode ? T.accent : T.muted,
              }}>
                {MODE_LABEL[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Título + volver */}
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onBack} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>
              {bigTitle}
            </div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para volver</div>
          </button>
        </div>

        {/* Navegación (semana / mes) */}
        {viewMode !== "historico" && (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <button className="press"
              onClick={viewMode==="semana" ? prevWeek : prevMonth}
              style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
            <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>
              {viewMode==="semana" ? weekRangeLabel(weekDates) : monthLabel(year, month)}
            </div>
            <button className="press"
              onClick={viewMode==="semana" ? nextWeek : nextMonth}
              style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
          </div>
        )}

        {/* Leyenda */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,padding:"10px 12px",background:T.surface2,borderRadius:10,border:`1px solid ${T.border}`}}>
          {[
            ["P","#06B6D4","Poli","4pts"],
            ["D","#F59E0B","Día","6pts"],
            ["N","#4F6EFF","Noche","12pts"],
            ["N","#4F6EFF","finde/fer","24pts"],
            ["A","#72FF00","Artro","1pt"],
            ["S","#E879F9","Seminario","6pts"],
          ].map(([,color,label,pts],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:color}}/>
              <span style={{fontSize:10,color:T.muted}}>{label}</span>
              <span style={{fontSize:10,color:T.muted,opacity:0.55}}>{pts}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <ErrorBox msg={activeError} T={T}/>

        {isLoading ? <Spinner color="#348FFF"/> :
         activeStats.length === 0 ? (
          <div style={{textAlign:"center",padding:"40px 0",color:T.muted,fontSize:14}}>Sin datos</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {activeStats.map((s, i) => {
              const barPct = (s.peso / maxPeso) * 100;
              const isTop  = i === 0;
              const accent = isTop ? "#FF5500" : i === 1 ? "#F59E0B" : i === activeStats.length-1 ? "#22D45A" : T.sub;

              return (
                <div key={s.name} style={{
                  background:T.surface,
                  border:`1px solid ${isTop ? "#FF550030" : T.border}`,
                  borderRadius:12,
                  padding:"10px 12px",
                  position:"relative",
                  overflow:"hidden",
                }}>
                  <div style={{
                    position:"absolute",left:0,top:0,bottom:0,
                    width:`${barPct}%`,
                    background: isTop ? "#FF550008" : `${T.accent}06`,
                    borderRadius:12,
                    pointerEvents:"none",
                  }}/>
                  <div style={{position:"relative",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{
                      width:22,height:22,borderRadius:6,flexShrink:0,
                      background: i===0?"#FF550022":i===1?"#F59E0B22":i===2?"#64748B22":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:11,fontWeight:800,
                      color: i===0?"#FF5500":i===1?"#F59E0B":i===2?"#94A3B8":T.muted,
                    }}>
                      {i+1}
                    </div>

                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {s.name}
                      </div>
                      <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                        {s.P > 0 && <span style={{fontSize:10,fontWeight:700,color:TIPO_COLOR.P,background:`${TIPO_COLOR.P}20`,borderRadius:99,padding:"1px 6px"}}>P×{s.P}</span>}
                        {s.D > 0 && <span style={{fontSize:10,fontWeight:700,color:TIPO_COLOR.D,background:`${TIPO_COLOR.D}20`,borderRadius:99,padding:"1px 6px"}}>D×{s.D}</span>}
                        {s.nNormal > 0 && <span style={{fontSize:10,fontWeight:700,color:TIPO_COLOR.N,background:`${TIPO_COLOR.N}20`,borderRadius:99,padding:"1px 6px"}}>N×{s.nNormal}</span>}
                        {s.nFinde > 0 && <span style={{fontSize:10,fontWeight:700,color:TIPO_COLOR.N,background:`${TIPO_COLOR.N}30`,borderRadius:99,padding:"1px 6px"}}>finde×{s.nFinde}</span>}
                        {s.nFeriado > 0 && <span style={{fontSize:10,fontWeight:700,color:TIPO_COLOR.N,background:`${TIPO_COLOR.N}30`,borderRadius:99,padding:"1px 6px"}}>fer×{s.nFeriado}</span>}
                        {s.A > 0 && <span style={{fontSize:10,fontWeight:700,color:TIPO_COLOR.A,background:`${TIPO_COLOR.A}20`,borderRadius:99,padding:"1px 6px"}}>A×{s.A}</span>}
                        {s.S > 0 && <span style={{fontSize:10,fontWeight:700,color:TIPO_COLOR.S,background:`${TIPO_COLOR.S}20`,borderRadius:99,padding:"1px 6px"}}>Sem×{s.S}</span>}
                      </div>
                    </div>

                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:800,color:accent,lineHeight:1}}>{s.peso}</div>
                      <div style={{fontSize:9,color:T.muted,marginTop:1}}>{s.total} turnos</div>
                      {s.nFeriado > 0 && (
                        <div style={{fontSize:9,fontWeight:700,color:"#FF5500",marginTop:2,background:"#FF550015",borderRadius:99,padding:"1px 5px",display:"inline-block"}}>
                          📅 {s.nFeriado} fer.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
