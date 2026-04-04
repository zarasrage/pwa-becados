import { useState } from "react";
import { TURNO } from "../../constants/turnos.js";

export function TurnoCard({ tipo, index, T }) {
  const t = TURNO[tipo];
  if (!t) return null;
  const [pressed, setPressed] = useState(false);
  return (
    <div className="anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: pressed ? t.light : T.surface,
        border: `1px solid ${pressed ? t.accent+"50" : T.border}`,
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: pressed ? `0 0 14px ${t.glow}` : "none",
        transition: "all 0.12s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:48,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:t.accent,lineHeight:1.2}}>{t.desde}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:t.accent,opacity:0.45,lineHeight:1.2,marginTop:2}}>{t.hasta}</div>
      </div>
      <div style={{width:1,height:28,background:`${t.accent}25`,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:14,color:T.text,fontWeight:500,lineHeight:1.35}}>{t.label}</div>
      </div>
    </div>
  );
}
