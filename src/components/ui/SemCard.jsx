import { useState } from "react";
import { SEMINAR_ACCENT } from "../../constants/turnos.js";

export function SemCard({ presenter, title, tag, index, T }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: pressed ? "#E879F912" : T.surface,
        border: `1px solid ${pressed ? "#E879F950" : T.border}`,
        borderLeft: `3px solid ${SEMINAR_ACCENT}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: pressed ? `0 0 14px #E879F928` : "none",
        transition: "all 0.12s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:48,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:SEMINAR_ACCENT,lineHeight:1.2}}>07:30</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:SEMINAR_ACCENT,opacity:0.45,lineHeight:1.2,marginTop:2}}>07:59</div>
      </div>
      <div style={{width:1,height:28,background:`${SEMINAR_ACCENT}25`,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:14,color:T.text,fontWeight:500,lineHeight:1.35}}>
          <span style={{color:SEMINAR_ACCENT}}>{presenter}: </span>{title}
        </div>
        <div style={{fontSize:11,color:SEMINAR_ACCENT,opacity:0.7,marginTop:2}}>{tag}</div>
      </div>
    </div>
  );
}
