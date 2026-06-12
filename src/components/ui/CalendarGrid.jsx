export const WEEKDAY_LABELS   = ["L","M","X","J","V","S","D"];
export const WEEKDAY_LABELS_5 = ["L","M","X","J","V"];

export function CalendarGrid({ slots, today, renderCell, T, hideWeekends }) {
  const labels = hideWeekends ? WEEKDAY_LABELS_5 : WEEKDAY_LABELS;
  const cols   = hideWeekends ? 5 : 7;
  // slots está alineado Lun=0 mod 7 — filtrar índices 5 y 6 (Sáb/Dom)
  const filtered = hideWeekends ? slots.filter((_, i) => i % 7 < 5) : slots;

  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:2,marginBottom:4}}>
        {labels.map(d => (
          <div key={d} style={{textAlign:"center",fontSize:13,fontWeight:700,color:T.muted,letterSpacing:"0.04em",padding:"2px 0"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:2,width:"100%",overflow:"hidden"}}>
        {filtered.map((iso, i) => iso ? renderCell(iso, i) : <div key={i} style={{minWidth:0}}/>)}
      </div>
    </>
  );
}
