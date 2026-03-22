import { useEffect, useMemo, useState } from "react";
import { API_TOKEN } from "../../constants/api.js";
import { apiGet } from "../../utils/api.js";
import { todayISO, monthNameLabel } from "../../utils/dates.js";
import { CalendarGrid } from "../ui/CalendarGrid.jsx";

function getMonthDates(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
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

const TIPO_COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00", S:"#E879F9" };

export function TurnoSelector({ label, becados, tipoCode, selected, onSelect, T }) {
  const today = useMemo(() => todayISO(), []);
  const [becado,  setBecado]  = useState("");
  const [year,    setYear]    = useState(() => Number(today.split("-")[0]));
  const [month,   setMonth]   = useState(() => Number(today.split("-")[1]) - 1);
  const [lookup,  setLookup]  = useState({});
  const [loading, setLoading] = useState(false);

  const col      = TIPO_COLOR[tipoCode] || "#64748B";
  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
  const slots    = useMemo(() => getMonthDates(year, month), [year, month]);

  // Recargar cuando cambia becado o mes
  useEffect(() => {
    if (!becado) { setLookup({}); onSelect(null); return; }
    setLoading(true);
    apiGet({ route:"personal-month", becado, month: monthStr, token: API_TOKEN })
      .then(res => {
        if (!res.ok || !res.days) { setLookup({}); return; }
        const map = {};
        res.days.forEach(day => { map[day.date] = day; });
        setLookup(map);
      })
      .catch(() => setLookup({}))
      .finally(() => setLoading(false));
  }, [becado, monthStr]);

  // Limpiar selección al cambiar becado o tipo
  useEffect(() => { onSelect(null); }, [becado, tipoCode]);

  const hasMatch = (day) => {
    if (!day) return false;
    if (tipoCode === "N") return day.nocheCode === "N";
    if (tipoCode === "A") return day.artroCode === "A";
    return day.diaCode === tipoCode;
  };

  const prevMonth = () => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1);

  const selectStyle = {
    width:"100%", padding:"11px 36px 11px 14px", borderRadius:10,
    border:`1px solid ${T.border}`, background:T.surface2, color:T.text,
    fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none",
    WebkitAppearance:"none", appearance:"none", boxSizing:"border-box",
  };

  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>{label}</div>

      <div style={{position:"relative",marginBottom: becado ? 10 : 0}}>
        <select value={becado} onChange={e => { setBecado(e.target.value); onSelect(null); }} style={selectStyle}>
          <option value="">Seleccionar becado…</option>
          {becados.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:T.muted,fontSize:12}}>▾</span>
      </div>

      {becado && (
        <>
          {/* Navegación de mes */}
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
            <button className="press" onClick={prevMonth}
              style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:T.sub,flexShrink:0}}>‹</button>
            <div style={{flex:1,textAlign:"center",fontSize:12,fontWeight:600,color:T.text,textTransform:"capitalize"}}>{monthNameLabel(monthStr)}</div>
            <button className="press" onClick={nextMonth}
              style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:T.sub,flexShrink:0}}>›</button>
          </div>

          {loading ? (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",color:T.muted,fontSize:13}}>
              <div style={{width:14,height:14,border:`2px solid ${T.border}`,borderTopColor:col,borderRadius:"50%",animation:"spin 0.6s linear infinite",flexShrink:0}}/>
              Cargando…
            </div>
          ) : (
            <CalendarGrid slots={slots} today={today} T={T} renderCell={(iso) => {
              const dayNum    = Number(iso.split("-")[2]);
              const isToday   = iso === today;
              const day       = lookup[iso] || {};
              const selectable = hasMatch(day);
              const isSelected = selected?.date === iso;

              const badges = [];
              if (day.diaCode === "P") badges.push("P");
              if (day.diaCode === "D") badges.push("D");
              if (day.artroCode === "A") badges.push("A");
              if (day.nocheCode === "N") badges.push("N");
              if (day.hasSeminar) badges.push("S");

              return (
                <div key={iso}
                  className={selectable ? "press" : ""}
                  onClick={() => selectable && onSelect(isSelected ? null : { date:iso, becado, code:tipoCode })}
                  style={{
                    background: isSelected ? `${col}25` : isToday ? T.surface2 : "transparent",
                    border: `1px solid ${isSelected ? col+"90" : selectable ? col+"40" : isToday ? T.border : T.border}`,
                    borderTop: selectable ? `2px solid ${col}` : `1px solid ${T.border}`,
                    borderRadius: 6,
                    padding: "3px 2px",
                    minHeight: 48,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    cursor: selectable ? "pointer" : "default",
                  }}>
                  <div style={{
                    fontSize:9, fontWeight:700, lineHeight:1, marginBottom:1,
                    background: isToday ? col : "transparent",
                    color: isToday ? "#fff" : selectable ? col : T.muted,
                    borderRadius: isToday ? 99 : 0,
                    width: isToday ? 16 : "auto", height: isToday ? 16 : "auto",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    alignSelf: isToday ? "center" : "flex-start",
                    paddingLeft: isToday ? 0 : 1,
                  }}>{dayNum}</div>

                  <div style={{display:"flex",flexWrap:"wrap",gap:1}}>
                    {badges.map((id, bi) => {
                      const isMain = id === tipoCode;
                      const bc = TIPO_COLOR[id] || "#64748B";
                      return (
                        <div key={bi} style={{
                          fontSize: isMain ? 11 : 9,
                          fontWeight: 700,
                          color: bc,
                          background: `${bc}25`,
                          borderRadius: 3,
                          padding: isMain ? "1px 3px" : "1px 2px",
                          lineHeight: 1.3,
                        }}>{id}</div>
                      );
                    })}
                  </div>

                  {isSelected && (
                    <div style={{
                      position:"absolute", bottom:2, right:2,
                      width:6, height:6, borderRadius:"50%",
                      background: col, boxShadow:`0 0 4px ${col}`,
                    }}/>
                  )}
                </div>
              );
            }}/>
          )}

          {selected && (
            <div style={{marginTop:8,fontSize:12,color:col,fontWeight:600,textAlign:"center",padding:"6px",background:`${col}12`,borderRadius:8,border:`1px solid ${col}30`}}>
              ✓ {selected.date.split("-").reverse().slice(0,2).join("/")} seleccionado
            </div>
          )}
        </>
      )}
    </div>
  );
}
