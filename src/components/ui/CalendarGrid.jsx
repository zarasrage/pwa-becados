export const WEEKDAY_LABELS = ["L","M","X","J","V","S","D"];

export function CalendarGrid({ slots, today, renderCell, T }) {
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
