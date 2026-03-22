import { useEffect, useMemo, useRef } from "react";
import { API_TOKEN } from "../constants/api.js";
import { ROT_ORDER, rot } from "../constants/rotations.js";
import { todayISO, offsetDate } from "../utils/dates.js";
import { prefetch } from "../utils/api.js";
import { useOnline } from "../hooks/useOnline.js";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { useApiData } from "../hooks/useApiData.js";
import { useState } from "react";
import { DateNav } from "../components/ui/DateNav.jsx";
import { PullIndicator } from "../components/ui/PullIndicator.jsx";
import { OfflineBanner } from "../components/ui/OfflineBanner.jsx";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";
import { SkeletonLine } from "../components/ui/SkeletonCard.jsx";

export function TabRotaciones({ onChangeBecado, T }) {
  const today = useMemo(()=>todayISO(),[]);
  const [date, setDate] = useState(today);
  const isOnline = useOnline();
  const scrollRef = useRef(null);

  const params = useMemo(
    () => ({ route:"summary", date, token:API_TOKEN }),
    [date]
  );
  const { data: summary, updating, error, refresh } = useApiData(params);

  // Prefetch días cercanos
  useEffect(() => {
    [-1, 1].forEach(offset => prefetch({route:"summary",date:offsetDate(today,offset),token:API_TOKEN}));
  }, [today]);

  const ptr = usePullToRefresh(refresh, scrollRef);

  const entries = summary?.groups
    ? ROT_ORDER.filter(k=>summary.groups[k]).map(k=>[k,summary.groups[k]])
    : [];

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
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Vista general</div>
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>Rotaciones</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para volver</div>
          </button>
        </div>
        <DateNav date={date} today={today} onPrev={()=>setDate(d=>offsetDate(d,-1))} onNext={()=>setDate(d=>offsetDate(d,1))} onToday={()=>setDate(today)} T={T}/>
      </div>

      <div style={{padding:"0 16px"}}>
        <OfflineBanner isOnline={isOnline} isStale={updating} T={T}/>
        <ErrorBox msg={error} T={T}/>
        {summary === null && !error ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[0,1,2,3,4,5].map(i=>(
              <div key={i} className="fade" style={{animationDelay:`${i*45}ms`,background:T.surface,border:`1px solid ${T.border}`,borderTop:`3px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
                  <SkeletonLine width={80} height={13} T={T}/>
                  <SkeletonLine width={60} height={12} T={T}/>
                </div>
                <div style={{padding:"9px 14px 11px",display:"flex",flexDirection:"column",gap:6}}>
                  <SkeletonLine width="60%" height={12} T={T}/>
                  <SkeletonLine width="45%" height={12} T={T}/>
                </div>
              </div>
            ))}
          </div>
        ) : entries.length ? (
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
    </div>
  );
}
