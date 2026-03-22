// ✦ OPTIMIZADO: stars 40→30, blur→gradiente ancho en curtains
export function AuroraEffect() {
  const stars = Array.from({length:30},(_,i)=>({
    id:i, x:Math.sin(i*137.5)*50+50, y:Math.cos(i*97.3)*40+20,
    size:Math.sin(i*1.7)*0.8+1.2, dur:2+Math.cos(i)*1.5, delay:-(i*0.3),
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {stars.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.size,height:s.size,borderRadius:"50%",
          background:"#C8D8FF",
          boxShadow:`0 0 ${s.size*3}px #8A5CF660`,
          animation:`neonPulseA ${s.dur}s ${s.delay}s ease-in-out infinite`,
          opacity:0.6,
          willChange:"opacity",
        }}/>
      ))}
      <div style={{position:"absolute",top:"-35%",left:"-25%",width:"90%",height:"75%",
        background:"radial-gradient(ellipse, #8A5CF630 0%, #4F46E514 35%, transparent 55%)",
        animation:"auroraShift1 12s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",top:"-5%",right:"-35%",width:"100%",height:"65%",
        background:"radial-gradient(ellipse, #06B6D422 0%, #0EA5E910 35%, transparent 55%)",
        animation:"auroraShift2 16s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",top:"15%",left:"-15%",width:"80%",height:"55%",
        background:"radial-gradient(ellipse, #22D45A18 0%, #4ADE8008 35%, transparent 55%)",
        animation:"auroraShift3 19s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",bottom:"-25%",right:"0%",width:"85%",height:"65%",
        background:"radial-gradient(ellipse, #C026D316 0%, #8A5CF608 40%, transparent 55%)",
        animation:"auroraShift1 22s 4s ease-in-out infinite alternate-reverse"}}/>
      <div style={{position:"absolute",inset:0,
        background:"radial-gradient(ellipse at 50% -10%, #8A5CF612, transparent 55%)"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"30%",
        background:"linear-gradient(to top, #020510, transparent)"}}/>
    </div>
  );
}
