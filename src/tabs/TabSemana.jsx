import { useEffect, useMemo, useRef, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { TURNO } from "../constants/turnos.js";
import { rot } from "../constants/rotations.js";
import { todayISO, offsetDate, getWeekDates, weekRangeLabel, weekLabel } from "../utils/dates.js";
import { apiGet } from "../utils/api.js";
import { cacheGet, cacheSet } from "../utils/cache.js";
import { groupItems } from "../utils/schedule.js";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { PullIndicator } from "../components/ui/PullIndicator.jsx";
import { SkeletonWeekCard } from "../components/ui/SkeletonCard.jsx";

export function TabSemana({ becado, onChangeBecado, T }) {
  const today = useMemo(()=>todayISO(),[]);
  const [refDate, setRefDate] = useState(today);
  const [lookup, setLookup] = useState({});
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const weekDates = useMemo(()=>getWeekDates(refDate),[refDate]);

  const loadWeek = (dates, force = false) => {
    const cached = {};
    dates.forEach(date => {
      const c = cacheGet({route:"daily", becado, date, token:API_TOKEN});
      if (c && c.ok !== false) cached[date] = c;
    });
    if (Object.keys(cached).length > 0) setLookup(prev => ({...prev, ...cached}));

    const allCached = dates.every(d => !!cacheGet({route:"daily",becado,date:d,token:API_TOKEN}));
    if (allCached && !force) { setLoading(false); return; }
    setLoading(true);
    const monday = dates[0];
    apiGet({ route:"week", becado, start:monday, token:API_TOKEN })
      .then(res => {
        if (!res.ok || !res.days) return;
        const next = {};
        res.days.forEach(day => {
          if (day.ok !== false) {
            cacheSet({route:"daily",becado,date:day.date,token:API_TOKEN}, day);
            next[day.date] = day;
          }
        });
        setLookup(prev => ({...prev, ...next}));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadWeek(weekDates); }, [becado, weekDates]);

  const ptr = usePullToRefresh(() => {
    const monday = weekDates[0];
    apiGet({ route:"week", becado, start:monday, token:API_TOKEN })
      .then(res => {
        if (!res.ok || !res.days) return;
        const next = {};
        res.days.forEach(day => {
          if (day.ok !== false) {
            cacheSet({route:"daily",becado,date:day.date,token:API_TOKEN}, day);
            next[day.date] = day;
          }
        });
        setLookup(prev => ({...prev, ...next}));
      })
      .catch(() => {});
  }, scrollRef);

  const isThisWeek = weekDates.includes(today);
  const days = weekDates.map(date => {
    const d = lookup[date];
    if (!d) return {date, rotationCode:"", items:[], turno:{diaCode:null,nocheCode:null,artroCode:null}, seminario:null};
    return {date, ok:d.ok!==false, rotationCode:d.rotationCode||"", items:d.items||[], turno:d.turno||{diaCode:null,nocheCode:null,artroCode:null}, seminario:d.seminario||null};
  });
  const hasAnyData = Object.keys(lookup).some(k => weekDates.includes(k));

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
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>{becado}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
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
              style={{height:32,padding:"0 11px",borderRadius:8,border:`1px solid ${T?.accent||"#348FFF"}60`,background:`${T?.accent||"#348FFF"}14`,fontSize:11,fontWeight:700,color:T?.accent||"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
              HOY
            </button>
          )}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        {!hasAnyData && loading ? (
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
                      {day.turno?.artroCode && (() => { const t=TURNO[day.turno.artroCode]; return t ? <span style={{fontSize:10,fontWeight:700,color:t.accent,background:t.light,borderRadius:99,padding:"1px 7px",border:`1px solid ${t.accent}30`}}>{t.label}</span> : null; })()}
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
