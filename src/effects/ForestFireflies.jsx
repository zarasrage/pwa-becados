// ✦ OPTIMIZADO: blur→gradiente ancho en niebla/canopy, box-shadow simple en fireflies
export function ForestFireflies() {
  const flies = Array.from({length:24},(_,i)=>({
    id:i,
    x: 3+i*3.8+Math.sin(i*2.1)*12,
    y: 10+Math.cos(i*1.8)*38,
    dur: 2.5+Math.sin(i)*2+1.5,
    delay: -(i*0.42),
    size: 1.5+Math.cos(i*1.3)*1.8+2,
    bright: i%5===0 ? 1 : i%3===0 ? 0.7 : 0.35,
    hue: i%7===0 ? "#AAFF70" : i%5===0 ? "#00FF88" : "#22D45A",
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,height:"25%",
        background:"linear-gradient(to bottom, #010602, transparent)"}}/>
      {[
        {bottom:"3%", opacity:0.18, dur:25, delay:0},
        {bottom:"10%", opacity:0.10, dur:32, delay:-8},
        {bottom:"18%", opacity:0.06, dur:40, delay:-15},
      ].map((m,i)=>(
        <div key={i} style={{
          position:"fixed",bottom:m.bottom,left:"-30%",right:"-30%",height:120,
          background:"radial-gradient(ellipse at 50% 100%, #22D45A14, transparent 55%)",
          opacity:m.opacity,
          animation:`auroraShift1 ${m.dur}s ${m.delay}s ease-in-out infinite alternate`,
        }}/>
      ))}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"40%",
        background:"linear-gradient(to top, #020A04 15%, transparent)"}}/>
      <div style={{position:"fixed",top:-80,left:"15%",width:560,height:450,
        background:"radial-gradient(ellipse, #22D45A0A, transparent 50%)",
        animation:"neonPulseA 18s ease-in-out infinite"}}/>
      {flies.map(f=>(
        <div key={f.id} style={{
          position:"absolute",left:`${f.x}%`,top:`${f.y}%`,
          width:f.size,height:f.size,borderRadius:"50%",
          background:f.hue,
          boxShadow:`0 0 ${f.size*6}px ${f.hue}${Math.round(f.bright*160).toString(16).padStart(2,"0")}`,
          opacity:f.bright,
          animation:`fireflyFloat ${f.dur}s ${f.delay}s ease-in-out infinite`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
    </div>
  );
}
