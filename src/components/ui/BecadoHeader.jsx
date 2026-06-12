// Header compartido de identidad para los tabs (Día/Semana/Mes) y vistas con becado.
// Unifica el bloque "eyebrow + nombre + hint" para no repetir estilos en cada tab.
export function BecadoHeader({ eyebrow, name, hint = "toca para cambiar", onTap, right, T }) {
  const glass = !!T.glass;
  return (
    <div style={{paddingRight:48,marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:3}}>{eyebrow}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
        <button className="press" onClick={onTap} style={{background:"none",border:"none",padding:0,textAlign:"left",minWidth:0}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:23,fontWeight:800,lineHeight:1.1,textTransform:"capitalize",
            background: glass ? "linear-gradient(135deg,#FF1A75,#E8186A,#FF4D94)" : "none",
            WebkitBackgroundClip: glass ? "text" : "unset",
            WebkitTextFillColor: glass ? "transparent" : "unset",
            color: glass ? "transparent" : T.text,
            filter: glass ? "drop-shadow(0 0 8px #E8186A50)" : "none",
          }}>{name}</div>
          {hint && <div style={{fontSize:13,color:T.muted,marginTop:2}}>{hint}</div>}
        </button>
        {right}
      </div>
    </div>
  );
}
