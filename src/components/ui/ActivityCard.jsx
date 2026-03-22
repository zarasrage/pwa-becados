import { useState } from "react";

export function ActivityCard({ from, to, activity, accent, light, glow, index, T }) {
  const [pressed, setPressed] = useState(false);
  const isPink = T.accent === "#E8186A";
  return (
    <div className="anim"
      style={{
        animationDelay:`${index*40}ms`,
        background: isPink
          ? (pressed ? `linear-gradient(135deg, ${accent}22, ${accent}12)` : "rgba(255,255,255,0.72)")
          : (pressed ? light : T.surface),
        border: isPink
          ? `1px solid ${pressed ? accent+"70" : accent+"35"}`
          : `1px solid ${pressed ? accent+"50" : T.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: isPink ? 16 : 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: isPink
          ? (pressed ? `0 4px 20px ${accent}50, 0 0 0 1px ${accent}20` : `0 2px 12px ${accent}20, 0 1px 3px rgba(0,0,0,0.05)`)
          : (pressed ? `0 0 14px ${glow}` : "none"),
        backdropFilter: isPink ? "blur(12px)" : "none",
        WebkitBackdropFilter: isPink ? "blur(12px)" : "none",
        transition: "all 0.15s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{flexShrink:0,minWidth:48,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:accent,lineHeight:1.2}}>{from}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:accent,opacity:0.55,lineHeight:1.2,marginTop:2}}>{to}</div>
      </div>
      <div style={{width:1,height:28,background:`${accent}30`,flexShrink:0}}/>
      <div style={{fontSize:14,color:T.text,fontWeight: isPink ? 500 : 400,lineHeight:1.35,flex:1}}>{activity}</div>
    </div>
  );
}
