// ✦ OPTIMIZADO: blur→gradiente ancho en glows, box-shadow simple en embers
export function SunsetEmbers() {
  const embers = Array.from({length:20},(_,i)=>({
    id:i,
    x: 2+i*4.8+Math.sin(i*1.9)*14,
    dur: 7+Math.cos(i)*4, delay:-(i*0.6),
    size: i%5===0 ? 4+Math.sin(i)*2 : 1.2+Math.sin(i*1.4)*1.5,
    color: i%4===0 ? "#FFDD00" : i%3===0 ? "#FFAA40" : "#FF5500",
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(to bottom, #200800 0%, #0F0500 35%, transparent 65%)",
        opacity:0.7}}/>
      <div style={{position:"fixed",bottom:"12%",left:"-15%",right:"-15%",height:180,
        background:"radial-gradient(ellipse at 50% 100%, #FF3300 0%, #FF550030 30%, transparent 55%)",
        animation:"neonPulseA 4s ease-in-out infinite"}}/>
      <div style={{position:"fixed",top:"-25%",left:"5%",right:"5%",height:"65%",
        background:"radial-gradient(ellipse at 50% 0%, #FF220018 0%, #FF550008 30%, transparent 55%)",
        animation:"neonPulseB 6s ease-in-out infinite"}}/>
      <div style={{position:"fixed",top:0,left:0,width:"20%",height:"100%",
        background:"linear-gradient(to right, #FF220010, transparent)"}}/>
      <div style={{position:"fixed",top:0,right:0,width:"20%",height:"100%",
        background:"linear-gradient(to left, #FF220010, transparent)"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"45%",
        background:"linear-gradient(to top, #0F0500 20%, transparent)"}}/>
      {embers.map(e=>(
        <div key={e.id} style={{
          position:"absolute",bottom:-10,left:`${e.x}%`,
          width:e.size,height:e.size*(1.2+Math.sin(e.id)*0.6),borderRadius:"50% 50% 40% 40%",
          background:`radial-gradient(circle at 40% 30%, #FFEE80, ${e.color})`,
          boxShadow:`0 0 ${e.size*6}px ${e.color}80`,
          animation:`emberRise ${e.dur}s ${e.delay}s infinite ease-out`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
    </div>
  );
}
