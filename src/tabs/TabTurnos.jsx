import { useEffect, useMemo, useRef, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { todayISO, formatDate, getMonthDates, monthLabel } from "../utils/dates.js";
import { apiSWR } from "../utils/api.js";
import { useApiData } from "../hooks/useApiData.js";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { OfflineBanner } from "../components/ui/OfflineBanner.jsx";
import { useOnline } from "../hooks/useOnline.js";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { PullIndicator } from "../components/ui/PullIndicator.jsx";
import { CalendarGrid } from "../components/ui/CalendarGrid.jsx";

const SEM_AREAS = [
  { key:"Hombro",  tag:"Seminario Hombro",  color:"#E879F9", dia:"Martes" },
  { key:"Rodilla", tag:"Seminario Rodilla", color:"#E879F9", dia:"Miércoles" },
  { key:"Mano",    tag:"Seminario Mano",    color:"#E879F9", dia:"Jueves" },
];


const TURNO_COLOR = { P:"#06B6D4", p:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00" };
const SEMINAR_COLOR = "#E879F9";



const TURNO_TABS = [
  { id:"P", label:"Poli",      color:"#06B6D4" },
  { id:"D", label:"Día",       color:"#F59E0B" },
  { id:"N", label:"Noche",     color:"#4F6EFF" },
  { id:"A", label:"Artro",     color:"#72FF00" },
  { id:"S", label:"Seminarios",color:"#E879F9" },
];

export function TabTurnos({ onBack, T }) {
  const today = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);
  const [sub, setSub]     = useState("P");
  const [selectedSem, setSelectedSem] = useState(null);
  const [semArea, setSemArea]       = useState(null);
  const [upcoming, setUpcoming]     = useState([]);
  const [upcomingMore, setUpcomingMore] = useState(false);

  useEffect(() => {
    if (!semArea) { setUpcoming([]); return; }
    const tag = SEM_AREAS.find(a => a.key === semArea)?.tag;
    const [ty, tm] = today.split("-").map(Number);
    const m1 = `${ty}-${String(tm).padStart(2,"0")}`;
    const nm = tm === 12 ? `${ty+1}-01` : `${ty}-${String(tm+1).padStart(2,"0")}`;

    const filter = (entries) =>
      (entries || []).filter(e => e.type === "S" && e.tag === tag && e.date >= today)
                    .sort((a,b) => a.date.localeCompare(b.date));

    const fetchNext = (base) => {
      if (base.length >= 7) { setUpcoming(base.slice(0,7)); setUpcomingMore(false); return; }
      setUpcomingMore(true);
      apiSWR(
        { route:"monthly", month:nm, token:API_TOKEN },
        (d) => {
          const combined = [...base, ...filter(d?.entries)]
            .sort((a,b) => a.date.localeCompare(b.date)).slice(0,7);
          setUpcoming(combined);
        },
        (d) => {
          const combined = [...base, ...filter(d?.entries)]
            .sort((a,b) => a.date.localeCompare(b.date)).slice(0,7);
          setUpcoming(combined);
          setUpcomingMore(false);
        }
      ).catch(() => setUpcomingMore(false));
    };

    setUpcomingMore(true);
    apiSWR(
      { route:"monthly", month:m1, token:API_TOKEN },
      (d) => { const f = filter(d?.entries); setUpcoming(f.slice(0,7)); },
      (d) => fetchNext(filter(d?.entries))
    ).catch(() => setUpcomingMore(false));
  }, [semArea]);

  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
  const params = useMemo(
    () => ({ route:"monthly", month: monthStr, token: API_TOKEN }),
    [monthStr]
  );
  const { data, updating, error, refresh } = useApiData(params);

  const prevMonth = () => { setSelectedSem(null); month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1); };
  const nextMonth = () => { setSelectedSem(null); month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1); };

  const slots  = useMemo(() => getMonthDates(year, month), [year, month]);
  const turnoColor = TURNO_TABS.find(t=>t.id===sub)?.color || "#64748B";

  const isOnline = useOnline();
  const scrollRef = useRef(null);
  const ptr = usePullToRefresh(refresh, scrollRef);

  const lookup = useMemo(() => {
    if (!data?.ok) return {};
    const map = {};
    (data.entries||[]).forEach(e => {
      const matchesSub = sub === "P" ? (e.type === "P" || e.type === "p") : e.type === sub;
      if (!matchesSub) return;
      if (sub === "S") {
        if (!map[e.date]) map[e.date] = { presenter: e.name, title: e.title, tag: e.tag, time: e.time };
      } else {
        if (!map[e.date]) map[e.date] = { names: [], hasAM: false };
        map[e.date].names.push({ name: e.name, isAM: e.type === "p" });
        if (e.type === "p") map[e.date].hasAM = true;
      }
    });
    return map;
  }, [data, sub]);

  const SEM_COLOR = "#E879F9";

  return (
    <div
      ref={scrollRef}
      style={{position:"relative",overflowY:"auto",minHeight:"100vh",paddingBottom:24,zIndex:1}}
      onTouchStart={ptr.onTouchStart}
      onTouchMove={ptr.onTouchMove}
      onTouchEnd={ptr.onTouchEnd}
    >
      <PullIndicator pullY={ptr.pullY} triggered={ptr.triggered} T={T}/>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Turnos del mes</div>
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onBack} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>
              {monthLabel(year, month)}
            </div>
            <div style={{fontSize:13,color:T.muted,marginTop:2}}>toca para volver</div>
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          {(year !== Number(today.split("-")[0]) || month !== Number(today.split("-")[1])-1) && (
            <button className="press" onClick={()=>{setYear(Number(today.split("-")[0]));setMonth(Number(today.split("-")[1])-1);setSelectedSem(null);}}
              style={{height:32,padding:"0 11px",borderRadius:8,border:`1px solid ${T?.accent||"#348FFF"}60`,background:`${T?.accent||"#348FFF"}14`,fontSize:13,fontWeight:700,color:T?.accent||"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
              HOY
            </button>
          )}
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {TURNO_TABS.map(t => (
            <button key={t.id} className="press" onClick={() => { setSub(t.id); setSelectedSem(null); }}
              style={{flex:1,height:34,borderRadius:9,border:`1px solid ${sub===t.id?t.color+"60":T.border}`,background:sub===t.id?`${t.color}18`:T.surface2,fontSize:13,fontWeight:sub===t.id?700:400,color:sub===t.id?t.color:T.muted,transition:"all 0.15s"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <OfflineBanner isOnline={isOnline} isStale={updating} T={T}/>
        <ErrorBox msg={error} T={T}/>

        {sub === "S" ? (
          !data ? <Spinner color={SEM_COLOR}/> : (
            <>
              <CalendarGrid slots={slots} today={today} T={T} hideWeekends renderCell={(iso, i) => {
                const dayNum  = Number(iso.split("-")[2]);
                const isToday = iso === today;
                const sem     = lookup[iso] || null;
                const isSelected = selectedSem?.date === iso;
                return (
                  <div key={iso}
                    className="press"
                    onClick={() => sem && setSelectedSem(isSelected ? null : { date: iso, sem })}
                    style={{
                      background: isSelected ? `${SEM_COLOR}25` : sem ? `${SEM_COLOR}12` : isToday ? T.surface2 : "transparent",
                      border: `1px solid ${isSelected ? SEM_COLOR+"80" : sem ? SEM_COLOR+"35" : isToday ? SEM_COLOR+"40" : T.border}`,
                      borderRadius: 6, padding: "3px 2px", minHeight: 44,
                      display: "flex", flexDirection: "column", gap: 1,
                      cursor: sem ? "pointer" : "default",
                      minWidth: 0, overflow: "hidden",
                    }}>
                    <div style={{fontSize:13,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?SEM_COLOR:"transparent",color:isToday?"#fff":sem?SEM_COLOR:T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                    {sem && (
                      <div style={{fontSize:13,fontWeight:600,color:SEM_COLOR,background:`${SEM_COLOR}20`,borderRadius:3,padding:"1px 2px",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {sem.presenter}
                      </div>
                    )}
                  </div>
                );
              }}/>

              {selectedSem && (
                <div className="anim" style={{marginTop:14,background:T.surface,border:`1px solid ${SEM_COLOR}40`,borderLeft:`3px solid ${SEM_COLOR}`,borderRadius:12,padding:"14px 16px",position:"relative"}}>
                  <button className="press" onClick={() => setSelectedSem(null)}
                    style={{position:"absolute",top:10,right:12,background:"none",border:"none",fontSize:16,color:T.muted,lineHeight:1}}>✕</button>
                  <div style={{fontSize:13,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:SEM_COLOR,marginBottom:8}}>
                    {formatDate(selectedSem.date)}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:SEM_COLOR,opacity:0.8}}>{selectedSem.sem.time || "07:30"}</span>
                    <span style={{width:1,height:16,background:`${SEM_COLOR}30`}}/>
                    <span style={{fontSize:14,fontWeight:600,color:SEM_COLOR}}>{selectedSem.sem.presenter}</span>
                  </div>
                  <div style={{fontSize:14,color:T.text,lineHeight:1.4,marginBottom:6}}>{selectedSem.sem.title}</div>
                  {selectedSem.sem.tag && (
                    <div style={{display:"inline-flex",alignItems:"center",background:`${SEM_COLOR}15`,border:`1px solid ${SEM_COLOR}30`,borderRadius:99,padding:"3px 10px"}}>
                      <span style={{fontSize:13,color:SEM_COLOR,fontWeight:500}}>{selectedSem.sem.tag}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Botones próximos seminarios por área */}
              <div style={{display:"flex",gap:6,marginTop:14,marginBottom:12}}>
                {SEM_AREAS.map(area => {
                  const isOpen = semArea === area.key;
                  return (
                    <button key={area.key} className="press"
                      onClick={() => setSemArea(isOpen ? null : area.key)}
                      style={{flex:1,height:40,borderRadius:9,border:`1px solid ${isOpen?SEM_COLOR+"80":T.border}`,background:isOpen?`${SEM_COLOR}20`:T.surface2,fontSize:13,fontWeight:isOpen?700:400,color:isOpen?SEM_COLOR:T.muted,transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
                      <span>{area.key}</span>
                      <span style={{fontSize:13,opacity:0.7,fontWeight:400}}>{area.dia}</span>
                    </button>
                  );
                })}
              </div>

              {/* Panel próximos 7 seminarios */}
              {semArea && (
                <div className="anim" style={{marginBottom:14,background:T.surface,border:`1px solid ${SEM_COLOR}30`,borderLeft:`3px solid ${SEM_COLOR}`,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:SEM_COLOR}}>
                      Próximos · {semArea}
                    </div>
                    <button className="press" onClick={()=>setSemArea(null)}
                      style={{background:"none",border:"none",fontSize:15,color:T.muted,lineHeight:1,cursor:"pointer"}}>✕</button>
                  </div>
                  {upcoming.length === 0 && upcomingMore ? <Spinner color={SEM_COLOR}/> :
                   upcoming.length === 0 ? (
                    <div style={{fontSize:13,color:T.muted,textAlign:"center",padding:"8px 0"}}>Sin seminarios próximos</div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {upcoming.map((e,i) => (
                        <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",paddingBottom:i<upcoming.length-1?8:0,borderBottom:i<upcoming.length-1?`1px solid ${T.border}`:"none"}}>
                          <div style={{flexShrink:0,minWidth:52}}>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:SEM_COLOR,lineHeight:1.3}}>{formatDate(e.date).split(",")[0]}</div>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.muted,lineHeight:1.3}}>{new Date(...e.date.split("-").map((v,i)=>i===1?v-1:+v)).toLocaleDateString("es-CL",{day:"numeric",month:"short"})}</div>
                          </div>
                          <div style={{width:1,height:32,background:`${SEM_COLOR}25`,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name||e.presenter}</div>
                            {(e.title||e.description) && <div style={{fontSize:13,color:T.sub,lineHeight:1.3,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title||e.description}</div>}
                          </div>
                          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:SEM_COLOR,opacity:0.7,flexShrink:0}}>{e.time||"07:30"}</div>
                        </div>
                      ))}
                      {upcomingMore && (
                        <div style={{display:"flex",alignItems:"center",gap:6,paddingTop:8,opacity:0.5}}>
                          <Spinner color={SEM_COLOR}/>
                          <span style={{fontSize:13,color:SEM_COLOR}}>cargando más...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )
        ) : (
          !data ? <Spinner color={turnoColor}/> : (
            <CalendarGrid slots={slots} today={today} T={T} hideWeekends={sub !== "N"} renderCell={(iso, i) => {
              const dayNum  = Number(iso.split("-")[2]);
              const isToday = iso === today;
              const cell    = lookup[iso] || { names: [], hasAM: false };
              const names   = cell.names || [];
              const has     = names.length > 0;
              return (
                <div key={iso} style={{animationDelay:`${(i%7)*20}ms`,background:has?`${turnoColor}15`:isToday?T.surface2:"transparent",border:`1px solid ${isToday?turnoColor+"60":has?turnoColor+"30":T.border}`,borderRadius:6,padding:"3px 2px",minHeight:44,display:"flex",flexDirection:"column",gap:1,minWidth:0,overflow:"hidden"}}>
                  <div style={{fontSize:13,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?turnoColor:"transparent",color:isToday?"#fff":has?turnoColor:T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                  {names.slice(0,3).map((entry,ni) => {
                    const isAM = sub === "P" && entry.isAM;
                    return <div key={ni} style={{fontSize:12,fontWeight:600,color:isAM?"#4F6EFF":turnoColor,background:`${turnoColor}22`,borderRadius:3,padding:"1px 2px",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{entry.name}</div>;
                  })}
                  {names.length > 3 && <div style={{fontSize:11,color:turnoColor,opacity:0.6,paddingLeft:1}}>+{names.length-3}</div>}
                </div>
              );
            }}/>
          )
        )}
      </div>
    </div>
  );
}
