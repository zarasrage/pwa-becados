import { useMemo, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { todayISO, formatDate } from "../utils/dates.js";
import { useApiData } from "../hooks/useApiData.js";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";

function abbrevName(name) {
  if (!name) return "";
  return name.length > 6 ? name.slice(0, 6) : name;
}

const TURNO_COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00" };
const SEMINAR_COLOR = "#E879F9";
const WEEKDAY_LABELS = ["L","M","X","J","V","S","D"];

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

function CalendarGrid({ slots, today, renderCell, T }) {
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {WEEKDAY_LABELS.map(d => (
          <div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.04em",padding:"2px 0"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {slots.map((iso, i) => iso ? renderCell(iso, i) : <div key={i}/>)}
      </div>
    </>
  );
}

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

  const lookup = useMemo(() => {
    if (!data?.ok) return {};
    const map = {};
    (data.entries||[]).forEach(e => {
      if (e.type !== sub) return;
      if (sub === "S") {
        if (!map[e.date]) map[e.date] = { presenter: e.name, title: e.title, tag: e.tag, time: e.time };
      } else {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push(e.name);
      }
    });
    return map;
  }, [data, sub]);

  const SEM_COLOR = "#E879F9";

  return (
    <div style={{minHeight:"100vh",paddingBottom:24,position:"relative",zIndex:1}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Turnos del mes</div>
        <div style={{marginBottom:12}}>
          <button className="press" onClick={onBack} style={{background:"none",border:"none",padding:0,textAlign:"left"}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>
              {monthLabel(year, month)}
            </div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para volver</div>
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
          <button className="press" onClick={refresh} disabled={updating}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:updating?0.5:1}}>
            <div style={{width:14,height:14,border:`2px solid ${T.muted}`,borderTopColor:updating?"#348FFF":T.muted,borderRadius:"50%",animation:updating?"spin 0.7s linear infinite":"none",transition:"border-top-color 0.2s"}}/>
          </button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {TURNO_TABS.map(t => (
            <button key={t.id} className="press" onClick={() => { setSub(t.id); setSelectedSem(null); }}
              style={{flex:1,height:34,borderRadius:9,border:`1px solid ${sub===t.id?t.color+"60":T.border}`,background:sub===t.id?`${t.color}18`:T.surface2,fontSize:11,fontWeight:sub===t.id?700:400,color:sub===t.id?t.color:T.muted,transition:"all 0.15s"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <ErrorBox msg={error} T={T}/>

        {sub === "S" ? (
          !data ? <Spinner color={SEM_COLOR}/> : (
            <>
              <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso, i) => {
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
                    }}>
                    <div style={{fontSize:9,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?SEM_COLOR:"transparent",color:isToday?"#fff":sem?SEM_COLOR:T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                    {sem && (
                      <div style={{fontSize:8,fontWeight:600,color:SEM_COLOR,background:`${SEM_COLOR}20`,borderRadius:3,padding:"1px 2px",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {sem.presenter?.split(" ").slice(-1)[0] || sem.presenter}
                      </div>
                    )}
                  </div>
                );
              }}/>

              {selectedSem && (
                <div className="anim" style={{marginTop:14,background:T.surface,border:`1px solid ${SEM_COLOR}40`,borderLeft:`3px solid ${SEM_COLOR}`,borderRadius:12,padding:"14px 16px",position:"relative"}}>
                  <button className="press" onClick={() => setSelectedSem(null)}
                    style={{position:"absolute",top:10,right:12,background:"none",border:"none",fontSize:16,color:T.muted,lineHeight:1}}>✕</button>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:SEM_COLOR,marginBottom:8}}>
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
                      <span style={{fontSize:11,color:SEM_COLOR,fontWeight:500}}>{selectedSem.sem.tag}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )
        ) : (
          !data ? <Spinner color={turnoColor}/> : (
            <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso, i) => {
              const dayNum  = Number(iso.split("-")[2]);
              const isToday = iso === today;
              const names   = lookup[iso] || [];
              const has     = names.length > 0;
              return (
                <div key={iso} style={{animationDelay:`${(i%7)*20}ms`,background:has?`${turnoColor}15`:isToday?T.surface2:"transparent",border:`1px solid ${isToday?turnoColor+"60":has?turnoColor+"30":T.border}`,borderRadius:6,padding:"3px 2px",minHeight:44,display:"flex",flexDirection:"column",gap:1}}>
                  <div style={{fontSize:9,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?turnoColor:"transparent",color:isToday?"#fff":has?turnoColor:T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                  {names.slice(0,3).map((name,ni) => (
                    <div key={ni} style={{fontSize:8,fontWeight:600,color:turnoColor,background:`${turnoColor}20`,borderRadius:3,padding:"1px 2px",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{abbrevName(name)}</div>
                  ))}
                  {names.length > 3 && <div style={{fontSize:8,color:turnoColor,opacity:0.6,paddingLeft:1}}>+{names.length-3}</div>}
                </div>
              );
            }}/>
          )
        )}
      </div>
    </div>
  );
}
