import { useMemo, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { ROT } from "../constants/rotations.js";
import { todayISO } from "../utils/dates.js";
import { useApiData } from "../hooks/useApiData.js";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { CalendarGrid } from "../components/ui/CalendarGrid.jsx";

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

export function TabMes({ becado, onChangeBecado, T }) {
  const today = useMemo(() => todayISO(), []);
  const [year, setYear]   = useState(() => Number(today.split("-")[0]));
  const [month, setMonth] = useState(() => Number(today.split("-")[1]) - 1);

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

  return (
    <div style={{minHeight:"100vh",paddingBottom:90,position:"relative",zIndex:1}}>
      <div style={{padding:"calc(var(--sat) + 20px) 16px 0"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:4}}>Mi mes</div>
        <button className="press" onClick={onChangeBecado} style={{background:"none",border:"none",padding:0,textAlign:"left",marginBottom:12}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>{becado}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>toca para cambiar</div>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <button className="press" onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>{monthLabel(year, month)}</div>
          <button className="press" onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>›</button>
          <button className="press" onClick={refresh} disabled={updating}
            style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:updating?0.5:1}}>
            <div style={{width:14,height:14,border:`2px solid ${T.muted}`,borderTopColor:updating?"#348FFF":T.muted,borderRadius:"50%",animation:updating?"spin 0.7s linear infinite":"none",transition:"border-top-color 0.2s"}}/>
          </button>
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
        <ErrorBox msg={error} T={T}/>
        {!data ? <Spinner color="#348FFF"/> : (
          <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso, i) => {
            const dayNum  = Number(iso.split("-")[2]);
            const isToday = iso === today;
            const day     = lookup[iso] || {};
            const diaCode   = day.diaCode   || day.turno?.diaCode   || null;
            const nocheCode = day.nocheCode || day.turno?.nocheCode || null;
            const artroCode = day.artroCode || day.turno?.artroCode || null;
            const hasSem    = day.hasSeminar || !!day.seminario;
            const badges  = [];
            if (diaCode === "P") badges.push({ label:"P", color:"#06B6D4" });
            if (diaCode === "D") badges.push({ label:"D", color:"#F59E0B" });
            if (artroCode === "A") badges.push({ label:"A", color:"#72FF00" });
            if (nocheCode === "N") badges.push({ label:"N", color:"#4F6EFF" });
            if (hasSem) badges.push({ label:"S", color:"#E879F9" });
            const rotC = day.rotationCode ? (ROT[day.rotationCode]?.accent || "#64748B") : null;

            return (
              <div key={iso} style={{background:isToday?T.surface2:"transparent",border:`1px solid ${isToday?"#348FFF60":T.border}`,borderTop:rotC?`2px solid ${rotC}`:`1px solid ${T.border}`,borderRadius:6,padding:"3px 2px",minHeight:48,display:"flex",flexDirection:"column",gap:2}}>
                <div style={{fontSize:9,fontWeight:700,lineHeight:1,marginBottom:1,background:isToday?"#348FFF":"transparent",color:isToday?"#fff":T.muted,borderRadius:isToday?99:0,width:isToday?16:"auto",height:isToday?16:"auto",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:isToday?"center":"flex-start",paddingLeft:isToday?0:1}}>{dayNum}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:1}}>
                  {badges.map((b,bi)=>(
                    <div key={bi} style={{fontSize:11,fontWeight:700,color:b.color,background:`${b.color}25`,borderRadius:3,padding:"1px 3px",lineHeight:1.3}}>{b.label}</div>
                  ))}
                </div>
              </div>
            );
          }}/>
        )}
      </div>
    </div>
  );
}
