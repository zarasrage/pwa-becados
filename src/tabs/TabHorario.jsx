import { useEffect, useMemo, useRef, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { todayISO, offsetDate, getWeekDates, t2m } from "../utils/dates.js";
import { prefetch, prefetchWeek } from "../utils/api.js";
import { groupItems, resolveItems } from "../utils/schedule.js";
import { rot } from "../constants/rotations.js";
import { useOnline } from "../hooks/useOnline.js";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { useApiData } from "../hooks/useApiData.js";
import { DateNav } from "../components/ui/DateNav.jsx";
import { PullIndicator } from "../components/ui/PullIndicator.jsx";
import { OfflineBanner } from "../components/ui/OfflineBanner.jsx";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";
import { SkeletonCard } from "../components/ui/SkeletonCard.jsx";
import { SectionDivider } from "../components/ui/SectionDivider.jsx";
import { ActivityCard } from "../components/ui/ActivityCard.jsx";
import { TurnoCard } from "../components/ui/TurnoCard.jsx";
import { SemCard } from "../components/ui/SemCard.jsx";

export function TabHorario({ becado, onChangeBecado, T }) {
  const today = useMemo(()=>todayISO(),[]);
  const [date, setDate] = useState(today);
  const isOnline = useOnline();
  const scrollRef = useRef(null);

  const params = useMemo(
    () => ({ route:"daily", becado, date, token:API_TOKEN }),
    [becado, date]
  );
  const { data: daily, updating, error, refresh } = useApiData(params);

  // Prefetch días cercanos
  useEffect(() => {
    const monday = getWeekDates(today)[0];
    prefetchWeek(becado, monday);
    const nextMonday = offsetDate(monday, 7);
    setTimeout(() => prefetchWeek(becado, nextMonday), 2000);
    if (new Date().getHours() >= 18) {
      prefetch({route:"daily",becado,date:offsetDate(today,1),token:API_TOKEN});
    }
  }, [becado, today]);

  const ptr = usePullToRefresh(refresh, scrollRef);

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

      <div style={{padding:"calc(var(--sat) + 20px) 16px 0",position:"relative",zIndex:1}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi horario</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,lineHeight:1.1,
              background:T.accent==="#E8186A" ? "linear-gradient(135deg,#FF1A75,#E8186A,#FF4D94)" : "none",
              WebkitBackgroundClip:T.accent==="#E8186A" ? "text" : "unset",
              WebkitTextFillColor:T.accent==="#E8186A" ? "transparent" : "unset",
              color:T.accent==="#E8186A" ? "transparent" : T.text,
              filter:T.accent==="#E8186A" ? "drop-shadow(0 0 8px #E8186A50)" : "none",
            }}>{becado}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
          </button>
          {daily?.rotationCode && (
            <div style={{display:"flex",alignItems:"center",gap:6,background:c.light,border:`1px solid ${c.accent}30`,borderRadius:99,padding:"5px 11px",flexShrink:0,marginTop:16}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:c.accent,display:"inline-block",boxShadow:`0 0 6px ${c.accent}`}}/>
              <span style={{fontSize:12,fontWeight:600,color:c.accent}}>{c.name}</span>
            </div>
          )}
        </div>
        <DateNav date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)} T={T}/>
      </div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        <OfflineBanner isOnline={isOnline} isStale={updating} T={T}/>
        <ErrorBox msg={error} T={T}/>
        {grouped === null ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} index={i} T={T}/>)}
          </div>
        ) : (() => {
          const manana   = grouped.filter(it => t2m(it.from) < t2m("13:00"));
          const mediodia = grouped.filter(it => t2m(it.from) >= t2m("13:00") && t2m(it.from) < t2m("14:00"));
          const tarde    = grouped.filter(it => t2m(it.from) >= t2m("14:00"));
          const diaCode  = daily?.turno?.diaCode  || null;
          const nocheCode= daily?.turno?.nocheCode || null;
          const artroCode= daily?.turno?.artroCode || null;
          const hasAny   = manana.length || mediodia.length || tarde.length || diaCode || nocheCode || artroCode;
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

              {(mediodia.length > 0 || artroCode) && <SectionDivider label="Mediodía" T={T}/>}
              {mediodia.map(it => <ActivityCard key={cardIdx} index={cardIdx++} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>)}
              {artroCode && <TurnoCard key="turno-artro" tipo={artroCode} index={cardIdx++} T={T}/>}

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
