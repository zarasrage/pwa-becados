import { useMemo, useRef, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { ROT } from "../constants/rotations.js";
import { TURNO } from "../constants/turnos.js";
import { todayISO } from "../utils/dates.js";
import { useApiData } from "../hooks/useApiData.js";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { OfflineBanner } from "../components/ui/OfflineBanner.jsx";
import { CalendarGrid } from "../components/ui/CalendarGrid.jsx";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { PullIndicator } from "../components/ui/PullIndicator.jsx";

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

function formatDayLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", { weekday:"long", day:"numeric", month:"long" });
}

export function TabMes({ becado, onChangeBecado, T }) {
  const today = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
  const params = useMemo(
    () => ({ route:"personal-month", becado, month: monthStr, token: API_TOKEN }),
    [becado, monthStr]
  );
  const { data, updating, error, refresh } = useApiData(params);

  const lookup = useMemo(() => {
    if (!data?.ok || !data.days) return {};
    const map = {};
    data.days.forEach(day => { map[day.date] = day; });
    return map;
  }, [data]);

  const prevMonth = () => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1);

  const slots = useMemo(() => getMonthDates(year, month), [year, month]);

  const scrollRef = useRef(null);
  const ptr = usePullToRefresh(refresh, scrollRef);

  return (
    <div
      ref={scrollRef}
      style={{position:"relative",overflowY:"auto",minHeight:"100vh",paddingBottom:90,zIndex:1}}
      onTouchStart={ptr.onTouchStart}
      onTouchMove={ptr.onTouchMove}
      onTouchEnd={ptr.onTouchEnd}
    >
      <PullIndicator pullY={ptr.pullY} triggered={ptr.triggered} T={T}/>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi mes</div>
        <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left",marginBottom:12}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>{becado}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          {(year !== Number(today.split("-")[0]) || month !== Number(today.split("-")[1])-1) && (
            <button className="press" onClick={()=>{setYear(Number(today.split("-")[0]));setMonth(Number(today.split("-")[1])-1);}}
              style={{height:32,padding:"0 11px",borderRadius:8,border:`1px solid ${T?.accent||"#348FFF"}60`,background:`${T?.accent||"#348FFF"}14`,fontSize:11,fontWeight:700,color:T?.accent||"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
              HOY
            </button>
          )}
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
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
        <OfflineBanner isOnline={true} isStale={updating} T={T}/>
        <ErrorBox msg={error} T={T}/>
        {!data ? <Spinner color="#348FFF"/> : (
          <>
            <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso, i) => {
              const dayNum  = Number(iso.split("-")[2]);
              const isToday = iso === today;
              const isSelected = selectedDay === iso;
              const day     = lookup[iso] || {};
              const diaCode   = day.diaCode   || day.turno?.diaCode   || null;
              const nocheCode = day.nocheCode || day.turno?.nocheCode || null;
              const artroCode = day.artroCode || day.turno?.artroCode || null;
              const hasSem    = day.hasSeminar || !!day.seminario;
              const isMySem = hasSem && day.seminario?.presenter === becado;
              const badges  = [];
              if (hasSem) badges.push({ label:"S", color: isMySem ? "#FF00FF" : "#E879F9", glow: isMySem });
              if (diaCode === "P") badges.push({ label:"P", color:"#06B6D4" });
              if (diaCode === "p") badges.push({ label:"P*", color:"#06B6D4" });
              if (diaCode === "D") badges.push({ label:"D", color:"#F59E0B" });
              if (artroCode === "A") badges.push({ label:"A", color:"#72FF00" });
              if (nocheCode === "N") badges.push({ label:"N", color:"#4F6EFF" });
              const rotC = day.rotationCode ? (ROT[day.rotationCode]?.accent || "#64748B") : null;
              const hasContent = badges.length > 0 || rotC;

              return (
                <div key={iso}
                  className={hasContent ? "press" : ""}
                  onClick={() => hasContent && setSelectedDay(isSelected ? null : iso)}
                  style={{
                    background: isSelected ? `${T.accent}20` : isToday ? T.surface2 : "transparent",
                    borderTop:    rotC ? `2px solid ${rotC}` : `1px solid ${isSelected ? T.accent+"60" : isToday ? "#348FFF60" : T.border}`,
                    borderRight:  `1px solid ${isSelected ? T.accent+"60" : isToday ? "#348FFF60" : T.border}`,
                    borderBottom: `1px solid ${isSelected ? T.accent+"60" : isToday ? "#348FFF60" : T.border}`,
                    borderLeft:   `1px solid ${isSelected ? T.accent+"60" : isToday ? "#348FFF60" : T.border}`,
                    borderRadius:6, padding:"3px 2px", minHeight:48,
                    display:"flex", flexDirection:"column", gap:2,
                    cursor: hasContent ? "pointer" : "default",
                  }}>
                  <div style={{fontSize:9,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?"#348FFF":"transparent",color:isToday?"#fff":T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:1}}>
                    {badges.map((b,bi)=>(
                      <div key={bi} style={{fontSize:11,fontWeight:700,color:b.color,background:`${b.color}${b.glow?"40":"25"}`,borderRadius:3,padding:"1px 3px",lineHeight:1.3,boxShadow:b.glow?`0 0 6px ${b.color}90`:"none"}}>{b.label}</div>
                    ))}
                  </div>
                </div>
              );
            }}/>

            {selectedDay && (() => {
              const day       = lookup[selectedDay] || {};
              const diaCode   = day.diaCode   || day.turno?.diaCode   || null;
              const nocheCode = day.nocheCode || day.turno?.nocheCode || null;
              const artroCode = day.artroCode || day.turno?.artroCode || null;
              const sem       = day.seminario || (day.hasSeminar ? {} : null);
              const rotInfo   = day.rotationCode ? ROT[day.rotationCode] : null;
              const turnoCodes = [diaCode, artroCode, nocheCode].filter(Boolean);
              const firstTurnoColor = turnoCodes.length > 0 ? (TURNO[turnoCodes[0]]?.accent || null) : null;
              const popupColor = rotInfo?.accent || firstTurnoColor || T.accent;

              return (
                <div className="anim" style={{marginTop:12,background:T.surface,border:`1px solid ${popupColor}30`,borderLeft:`3px solid ${popupColor}`,borderRadius:12,padding:"14px 16px",position:"relative"}}>
                  <button className="press" onClick={() => setSelectedDay(null)}
                    style={{position:"absolute",top:10,right:12,background:"none",border:"none",fontSize:16,color:T.muted,lineHeight:1,cursor:"pointer"}}>✕</button>

                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"capitalize",color:popupColor,marginBottom:10}}>
                    {formatDayLabel(selectedDay)}
                  </div>

                  {rotInfo && (
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:rotInfo.light,border:`1px solid ${rotInfo.accent}30`,borderRadius:99,padding:"4px 10px",marginBottom:10}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:rotInfo.accent,flexShrink:0,boxShadow:`0 0 6px ${rotInfo.accent}`}}/>
                      <span style={{fontSize:12,fontWeight:600,color:rotInfo.accent}}>{rotInfo.name}</span>
                    </div>
                  )}

                  {sem && (
                    <div style={{background:`#E879F912`,border:`1px solid #E879F930`,borderRadius:8,padding:"10px 12px",marginBottom: turnoCodes.length > 0 ? 8 : 0}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"#E879F9",marginBottom:6,opacity:0.7}}>
                        Seminario {sem.tag || ""}
                      </div>
                      {sem.presenter && (
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom: sem.title ? 6 : 0}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#E879F9",opacity:0.7}}>{sem.time || "07:30"}</span>
                          <span style={{width:1,height:14,background:"#E879F930"}}/>
                          <span style={{fontSize:14,fontWeight:700,color:"#E879F9"}}>{sem.presenter}</span>
                        </div>
                      )}
                      {sem.title && (
                        <div style={{fontSize:13,color:T.text,lineHeight:1.4}}>{sem.title}</div>
                      )}
                      {!sem.presenter && !sem.title && (
                        <div style={{fontSize:13,color:"#E879F9",opacity:0.7}}>Hay seminario este día</div>
                      )}
                    </div>
                  )}

                  {turnoCodes.length > 0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {turnoCodes.map(code => {
                        const t = TURNO[code];
                        if (!t) return null;
                        return (
                          <div key={code} style={{display:"flex",alignItems:"center",gap:10,background:`${t.accent}10`,border:`1px solid ${t.accent}25`,borderLeft:`3px solid ${t.accent}`,borderRadius:8,padding:"8px 12px"}}>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:t.accent,lineHeight:1.2,minWidth:44}}>
                              {t.desde}
                              <div style={{fontSize:9,opacity:0.5,marginTop:1}}>{t.hasta}</div>
                            </div>
                            <div style={{width:1,height:24,background:`${t.accent}25`}}/>
                            <div style={{fontSize:13,fontWeight:500,color:T.text}}>{t.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {turnoCodes.length === 0 && !sem && !rotInfo && (
                    <div style={{fontSize:13,color:T.muted}}>Sin turnos este día</div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
