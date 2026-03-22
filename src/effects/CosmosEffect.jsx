// ✦ OPTIMIZADO: stars 70→50, blur→gradiente, box-shadow simple
export function CosmosEffect() {
  const stars = Array.from({length:50},(_,i)=>({
    id:i, x:Math.sin(i*137.508)*50+50, y:Math.cos(i*97.31)*45+45,
    size:i%12===0?3.5:i%5===0?2.2:Math.sin(i*1.7)*0.6+1.2,
    dur:1+Math.abs(Math.cos(i))*2.5, delay:-(i*0.18),
    color:i%9===0?"#FFFFFF":i%6===0?"#FF6BF5":i%4===0?"#C8A0FF":i%3===0?"#FFB8F0":"#9B6FFF",
    glow:i%9===0?"#FF6BF5":i%6===0?"#FF6BF5":"#7B2FFF",
    bright:i%9===0?1:i%5===0?0.85:0.55,
  }));
  const shoots = Array.from({length:5},(_,i)=>({
    id:i, startX:10+i*18, startY:5+i*8, dur:3+i*1.5, delay:-(i*2.8),
  }));
  const nebulas = [
    {x:"-18%",y:"-25%",w:"95%",h:"70%",c1:"#FF6BF5",c2:"#7B2FFF",dur:16,dir:"alternate"},
    {x:"38%", y:"5%", w:"85%",h:"60%",c1:"#7B2FFF",c2:"#FF6BF5",dur:20,dir:"alternate-reverse"},
    {x:"5%",  y:"45%",w:"80%",h:"60%",c1:"#FF4AE8",c2:"#4400FF",dur:24,dir:"alternate"},
    {x:"48%", y:"50%",w:"70%",h:"55%",c1:"#CC00FF",c2:"#FF6BF5",dur:18,dir:"alternate-reverse"},
  ];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 25% 15%, #1A0040 0%, #020008 55%, #080018 100%)",opacity:0.9}}/>
      {nebulas.map((n,i)=>(
        <div key={i} style={{
          position:"fixed",left:n.x,top:n.y,width:n.w,height:n.h,
          background:`radial-gradient(ellipse, ${n.c1}28 0%, ${n.c2}14 35%, transparent 55%)`,
          animation:`auroraShift${(i%3)+1} ${n.dur}s ease-in-out infinite ${n.dir}`,
        }}/>
      ))}
      <div style={{position:"fixed",top:"5%",left:"25%",width:300,height:300,
        background:"radial-gradient(circle, #FF6BF535 0%, #7B2FFF18 35%, transparent 55%)",
        animation:"neonPulseA 5s ease-in-out infinite"}}/>
      {stars.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.size,height:s.size,borderRadius:"50%",background:s.color,
          boxShadow:`0 0 ${s.size*5}px ${s.glow}${Math.round(s.bright*160).toString(16).padStart(2,"0")}`,
          opacity:s.bright,
          animation:`neonPulseA ${s.dur}s ${s.delay}s ease-in-out infinite`,
          willChange:"opacity",
        }}/>
      ))}
      {shoots.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.startX}%`,top:`${s.startY}%`,
          width:60,height:2,borderRadius:99,
          background:"linear-gradient(90deg, #FFFFFF, #FF6BF560, transparent)",
          animation:`shimmerLine ${s.dur}s ${s.delay}s linear infinite`,
          boxShadow:"0 0 6px #FF6BF5",
        }}/>
      ))}
      {[{x:"20%",y:"15%"},{x:"75%",y:"8%"},{x:"55%",y:"40%"}].map((p,i)=>(
        <div key={i} style={{
          position:"fixed",left:p.x,top:p.y,
          width:i===2?10:6,height:i===2?10:6,borderRadius:"50%",background:"#FFFFFF",
          boxShadow:"0 0 20px #FF6BF5, 0 0 40px #7B2FFF60",
          animation:`neonPulseA ${2+i}s ease-in-out infinite`,
        }}/>
      ))}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"30%",
        background:"linear-gradient(to top, #020008, transparent)"}}/>
      <div style={{position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 60% 30%, #FF6BF508, transparent 60%)",
        animation:"neonPulseB 7s ease-in-out infinite"}}/>
    </div>
  );
}
