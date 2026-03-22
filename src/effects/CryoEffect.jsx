// ✦ OPTIMIZADO: shards 28→20, flakes 40→25, blur→gradiente, box-shadow simple
export function CryoEffect() {
  const shards = Array.from({length:20},(_,i)=>({
    id:i, x:2+i*4.8+Math.sin(i*2.7)*12, y:Math.cos(i*1.9)*45+45,
    w:4+Math.abs(Math.sin(i*1.3))*18, h:8+Math.abs(Math.cos(i*2.1))*32,
    rot:i*29, dur:3+Math.sin(i)*2, delay:-(i*0.45),
    bright:i%4===0?1:i%3===0?0.7:0.4,
  }));
  const flakes = Array.from({length:25},(_,i)=>({
    id:i, x:i*4+Math.sin(i*3)*8, size:1+Math.cos(i*1.7)*1.5+1.5,
    dur:2.5+Math.sin(i)*1.5, delay:-(i*0.35),
  }));
  const orbs = [
    {x:"12%",y:"8%",w:420,h:420,col:"#00CFFF",op:0.18,dur:5},
    {x:"62%",y:"3%",w:340,h:340,col:"#7BE8FF",op:0.14,dur:7},
    {x:"35%",y:"50%",w:480,h:480,col:"#00CFFF",op:0.10,dur:9},
    {x:"78%",y:"55%",w:280,h:280,col:"#C0F8FF",op:0.16,dur:6},
    {x:"-8%",y:"45%",w:300,h:300,col:"#00A8FF",op:0.12,dur:8},
  ];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(135deg, #020D1A 0%, #041C30 40%, #020D1A 100%)",opacity:0.85}}/>
      {orbs.map((o,i)=>(
        <div key={i} style={{
          position:"fixed",left:o.x,top:o.y,width:o.w,height:o.h,borderRadius:"50%",
          background:`radial-gradient(circle, ${o.col} 0%, transparent 50%)`,
          opacity:o.op,
          animation:`neonPulseA ${o.dur}s ${-i*1.2}s ease-in-out infinite`,
        }}/>
      ))}
      {shards.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.w,height:s.h,
          background:`linear-gradient(${s.rot}deg, rgba(0,207,255,${s.bright*0.7}) 0%, rgba(200,248,255,${s.bright*0.9}) 40%, rgba(0,168,255,${s.bright*0.5}) 70%, transparent 100%)`,
          clipPath:"polygon(50% 0%, 90% 25%, 100% 75%, 70% 100%, 30% 100%, 0% 75%, 10% 25%)",
          boxShadow:`0 0 ${s.w*0.8}px rgba(0,207,255,${s.bright*0.5})`,
          animation:`fireflyFloat ${s.dur}s ${s.delay}s ease-in-out infinite`,
          transform:`rotate(${s.rot}deg)`,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
      {flakes.map(f=>(
        <div key={f.id} style={{
          position:"absolute",top:-8,left:`${f.x}%`,
          width:f.size,height:f.size,borderRadius:"50%",
          background:"#E8F8FF",
          boxShadow:`0 0 ${f.size*5}px #00CFFF90`,
          animation:`bubbleRise ${f.dur}s ${f.delay}s infinite linear`,
          opacity:0.9,
          willChange:"transform,opacity",
          backfaceVisibility:"hidden",
        }}/>
      ))}
      {[15,35,55,72,88].map((t,i)=>(
        <div key={i} style={{
          position:"fixed",top:`${t}%`,left:0,right:0,height:1,
          background:`linear-gradient(90deg, transparent 10%, #00CFFF${i%2===0?"50":"30"} 50%, transparent 90%)`,
          animation:`neonPulseB ${4+i*1.5}s ${-i*1.1}s ease-in-out infinite`,
        }}/>
      ))}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"30%",
        background:"linear-gradient(to top, #020D1A 20%, transparent)"}}/>
      <div style={{position:"fixed",top:-40,left:"15%",right:"15%",height:180,
        background:"radial-gradient(ellipse, #00CFFF22 0%, transparent 50%)",
        animation:"auroraShift1 8s ease-in-out infinite alternate"}}/>
    </div>
  );
}
