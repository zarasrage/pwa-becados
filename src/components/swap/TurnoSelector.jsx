import { useEffect, useState } from "react";
import { API_TOKEN } from "../../constants/api.js";
import { apiGet } from "../../utils/api.js";
import { nextMonthStr, monthNameLabel } from "../../utils/dates.js";

export function TurnoSelector({ label, becados, curMonth, tipoCode, selected, onSelect, T }) {
  const [becado,   setBecado]   = useState("");
  const [turnos,   setTurnos]   = useState([]);
  const [loadingT, setLoadingT] = useState(false);

  const TIPO_COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00" };
  const col = TIPO_COLOR[tipoCode] || "#64748B";
  const DIAS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  const filterDays = (days, month) => (days || [])
    .filter(day => tipoCode === "N" ? day.nocheCode === "N" : tipoCode === "A" ? day.artroCode === "A" : day.diaCode === tipoCode)
    .map(day => ({ date: day.date, code: tipoCode, month }));

  useEffect(() => {
    if (!becado) { setTurnos([]); onSelect(null); return; }
    setLoadingT(true); setTurnos([]); onSelect(null);
    const m2 = nextMonthStr(curMonth);
    Promise.all([
      apiGet({ route:"personal-month", becado, month: curMonth, token:API_TOKEN }),
      apiGet({ route:"personal-month", becado, month: m2,       token:API_TOKEN }),
    ]).then(([d1, d2]) => {
      const t1 = d1.ok ? filterDays(d1.days, curMonth) : [];
      const t2 = d2.ok ? filterDays(d2.days, m2)       : [];
      setTurnos([...t1, ...t2]);
    }).catch(() => setTurnos([])).finally(() => setLoadingT(false));
  }, [becado, curMonth, tipoCode]);

  useEffect(() => { onSelect(null); }, [becado, tipoCode]);

  const byMonth = turnos.reduce((acc, t) => {
    if (!acc[t.month]) acc[t.month] = [];
    acc[t.month].push(t);
    return acc;
  }, {});

  const selectStyle = {
    width:"100%", padding:"11px 36px 11px 14px", borderRadius:10,
    border:`1px solid ${T.border}`, background:T.surface2, color:T.text,
    fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none",
    WebkitAppearance:"none", appearance:"none", boxSizing:"border-box",
  };

  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>{label}</div>
      <div style={{position:"relative",marginBottom:10}}>
        <select value={becado} onChange={e => setBecado(e.target.value)} style={selectStyle}>
          <option value="">Seleccionar becado…</option>
          {becados.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:T.muted,fontSize:12}}>▾</span>
      </div>
      {becado && (
        loadingT ? (
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",color:T.muted,fontSize:13}}>
            <div style={{width:14,height:14,border:`2px solid ${T.border}`,borderTopColor:"#348FFF",borderRadius:"50%",animation:"spin 0.6s linear infinite",flexShrink:0}}/>
            Cargando turnos…
          </div>
        ) : turnos.length === 0 ? (
          <div style={{padding:"8px 0",fontSize:13,color:T.muted}}>Sin turnos de este tipo</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {Object.entries(byMonth).map(([m, ts]) => (
              <div key={m}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.07em",textTransform:"capitalize",marginBottom:6}}>
                  {monthNameLabel(m)}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {ts.map(t => {
                    const [ty,tm,td] = t.date.split("-").map(Number);
                    const dow = new Date(ty,tm-1,td).getDay();
                    const isSel = selected?.date === t.date;
                    return (
                      <button key={t.date} className="press"
                        onClick={() => onSelect(isSel ? null : { date:t.date, becado, code:tipoCode })}
                        style={{
                          padding:"6px 11px", borderRadius:9,
                          border:`1.5px solid ${isSel ? col : T.border}`,
                          background: isSel ? `${col}22` : T.surface2,
                          color: isSel ? col : T.sub,
                          fontSize:13, fontWeight: isSel ? 700 : 400,
                          transition:"all 0.12s",
                          display:"flex", alignItems:"center", gap:5,
                        }}>
                        <span style={{fontSize:10,opacity:0.6}}>{DIAS_ES[dow]}</span>
                        <span>{td}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
