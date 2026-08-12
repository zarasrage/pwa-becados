// Tarjeta para actividades especiales (agregadas en el editor, visibles solo
// para el público elegido) — mismo patrón visual que el bloque de Curso CPQ.
export function ActividadCard({ titulo, hora, color, index, T }) {
  const c = color || "#8B73FF";
  return (
    <div className="anim" style={{
      animationDelay:`${index*40}ms`,
      background:`${c}14`,border:`1px solid ${c}40`,borderLeft:`3px solid ${c}`,
      borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:4,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:c,textTransform:"uppercase"}}>Actividad</span>
        {hora && <span style={{fontSize:11,color:c,opacity:0.7,fontFamily:"'JetBrains Mono',monospace"}}>{hora}</span>}
      </div>
      <div style={{fontSize:13,fontWeight:600,color:T.text,lineHeight:1.35}}>{titulo}</div>
    </div>
  );
}
