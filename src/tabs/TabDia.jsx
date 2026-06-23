import { useEffect, useMemo, useRef, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { todayISO, offsetDate, getWeekDates, t2m } from "../utils/dates.js";
import { prefetch, prefetchWeek } from "../utils/api.js";
import { groupItems, resolveItems } from "../utils/schedule.js";
import { isFeriado } from "../constants/feriados.js";
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
import { BecadoHeader } from "../components/ui/BecadoHeader.jsx";

export function TabDia({ becado, onChangeBecado, quickLinks, T }) {
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
        <BecadoHeader eyebrow="Mi día" name={becado} onTap={onChangeBecado} T={T}
          right={daily?.rotationCode && (
            <div style={{display:"flex",alignItems:"center",gap:6,background:c.light,border:`1px solid ${c.accent}30`,borderRadius:99,padding:"5px 11px",flexShrink:0,marginTop:2}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:c.accent,display:"inline-block",boxShadow:`0 0 6px ${c.accent}`}}/>
              <span style={{fontSize:13,fontWeight:600,color:c.accent}}>{c.name}</span>
            </div>
          )}/>
        <DateNav date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)} T={T}/>
        {isFeriado(date) && (
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"#F59E0B18",border:"1px solid #F59E0B40",borderRadius:99,padding:"4px 10px",marginTop:8}}>
            <span style={{fontSize:14}}>🎉</span>
            <span style={{fontSize:12,fontWeight:700,color:"#F59E0B",letterSpacing:"0.04em"}}>Feriado</span>
          </div>
        )}
      </div>

      <div style={{position:"relative",zIndex:1}}>{quickLinks}</div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        <OfflineBanner isOnline={isOnline} isStale={updating} T={T}/>
        <ErrorBox msg={error} T={T}/>
        {grouped === null ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} index={i} T={T}/>)}
          </div>
        ) : (() => {
          const manana   = grouped.filter(it => t2m(it.from) < t2m("13:00"));
          const mediodia = grouped.filter(it => t2m(it.from) >= t2m("13:00") && t2m(it.from) < t2m("14:00"));
          const tarde    = grouped.filter(it => t2m(it.from) >= t2m("14:00"));
          const diaCode  = daily?.turno?.diaCode  || null;
          const nocheCode= daily?.turno?.nocheCode || null;
          const artroCode= daily?.turno?.artroCode || null;
          const isPoliAM = diaCode === "p";
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
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {sem && <SemCard key="sem" presenter={sem.presenter} title={sem.title} tag={sem.tag} time={sem.time} index={cardIdx++} T={T}/>}
              {(manana.length > 0 || isPoliAM) && <SectionDivider label="Mañana" T={T}/>}
              {manana.map(it => <ActivityCard key={cardIdx} index={cardIdx++} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>)}
              {isPoliAM && <TurnoCard key="turno-dia" tipo={diaCode} index={cardIdx++} T={T}/>}

              {(mediodia.length > 0 || artroCode) && <SectionDivider label="Mediodía" T={T}/>}
              {mediodia.map(it => <ActivityCard key={cardIdx} index={cardIdx++} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>)}
              {artroCode && <TurnoCard key="turno-artro" tipo={artroCode} index={cardIdx++} T={T}/>}

              {(tarde.length > 0 || (diaCode && !isPoliAM)) && <SectionDivider label="Tarde" T={T}/>}
              {tarde.map(it => <ActivityCard key={cardIdx} index={cardIdx++} from={it.from} to={it.to} activity={it.activity} accent={c.accent} light={c.light} glow={c.glow} T={T}/>)}
              {diaCode && !isPoliAM && <TurnoCard key="turno-dia" tipo={diaCode} index={cardIdx++} T={T}/>}

              {nocheCode && <SectionDivider label="Noche" T={T}/>}
              {nocheCode && <TurnoCard key="turno-noche" tipo={nocheCode} index={cardIdx++} T={T}/>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
