// ── Efectos ambientales por tema ─────────────────────────────────────────────
// ✦ OPTIMIZADOS: filter:blur→gradientes más anchos, box-shadow dobles→simples,
//   will-change+backfaceVisibility en partículas, contain en wrappers,
//   conteo reducido donde no se nota

export function OceanBubbles() {
  const bubbles = Array.from({length:22},(_,i)=>({
    id:i,
    size: i%4===0 ? 18+Math.sin(i)*8 : i%3===0 ? 10+Math.cos(i)*4 : 3+Math.sin(i*1.7)*3,
    x: 4+i*4.2+Math.cos(i*0.8)*12,
    dur: i%4===0 ? 14+Math.sin(i)*4 : 6+Math.sin(i)*3,
    delay: -(i*0.7),
    swayDur: 3+Math.cos(i*1.3)*1.5,
    opacity: i%4===0 ? 0.15 : i%3===0 ? 0.25 : 0.45,
  }));
  const rays = Array.from({length:5},(_,i)=>({
    id:i, x:10+i*18, rot:-15+i*6, dur:8+i*2.5, delay:-(i*1.8),
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(to bottom, #001830 0%, #04080F 40%, #001025 100%)",
        opacity:0.6}}/>
      {rays.map(r=>(
        <div key={r.id} style={{
          position:"absolute",top:-60,left:`${r.x}%`,
          width:44,height:"70%",
          background:`linear-gradient(to bottom, #00C8FF18, transparent)`,
          transform:`rotate(${r.rot}deg)`,
          transformOrigin:"top center",
          animation:`neonPulseA ${r.dur}s ${r.delay}s ease-in-out infinite`,
          willChange:"opacity,transform",
        }}/>
      ))}
      <div style={{position:"fixed",top:-80,left:"2%",width:600,height:600,borderRadius:"50%",
        background:"radial-gradient(circle, #00C8FF0D 0%, transparent 50%)",
        animation:"neonPulseA 12s ease-in-out infinite"}}/>
      <div style={{position:"fixed",bottom:-120,right:"-8%",width:540,height:540,borderRadius:"50%",
        background:"radial-gradient(circle, #0055FF0F 0%, transparent 50%)",
        animation:"neonPulseB 15s ease-in-out infinite"}}/>
      {bubbles.map(b=>(
        <div key={b.id} style={{
          position:"absolute",bottom:-20,left:`${b.x}%`,
          width:b.size,height:b.size,borderRadius:"50%",
          background:`radial-gradient(circle at 30% 25%, #00C8FF${Math.round(b.opacity*80).toString(16).padStart(2,"0")}, transparent 70%)`,
          border:`1px solid #00C8FF${Math.round(b.opacity*120).toString(16).padStart(2,"0")}`,
          boxShadow: b.size>12 ? `0 0 ${b.size}px #00C8FF20` : "none",
          animation:`bubbleRise ${b.dur}s ${b.delay}s infinite ease-in, bubbleSway ${b.swayDur}s ${b.delay*0.4}s infinite ease-in-out`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
    </div>
  );
}
