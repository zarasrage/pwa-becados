// Boreal Silk — cortinas de aurora que ondean, estrellas árticas, horizonte vivo
export function AuroraEffect() {
  const stars = Array.from({length:55},(_,i)=>({
    id:i,
    x:Math.sin(i*137.508)*50+50,
    y:Math.cos(i*97.31)*38+20,
    size:i%9===0?2.8:i%5===0?1.8:i%2===0?1.2:0.9,
    dur:1.8+Math.cos(i)*1.4, delay:-(i*0.22),
    col:i%6===0?"#FFFFFF":i%3===0?"#D4EEFF":"#A0C8EE",
  }));

  // Bandas de aurora — franjas verticales que ondean
  const strips = [
    {x:"0%",   w:"14%", c1:"#8A5CF6", c2:"#6D28D9", op:0.28, dur:8.5,  delay:0},
    {x:"8%",   w:"12%", c1:"#7C3AED", c2:"#4F46E5", op:0.22, dur:11.2, delay:-3.5},
    {x:"17%",  w:"16%", c1:"#06B6D4", c2:"#0EA5E9", op:0.30, dur:7.8,  delay:-1.8},
    {x:"26%",  w:"13%", c1:"#0284C7", c2:"#06B6D4", op:0.24, dur:13.0, delay:-6.2},
    {x:"36%",  w:"18%", c1:"#22D45A", c2:"#10B981", op:0.32, dur:9.4,  delay:-4.0},
    {x:"47%",  w:"14%", c1:"#34D399", c2:"#22D45A", op:0.26, dur:7.2,  delay:-2.2},
    {x:"56%",  w:"16%", c1:"#8A5CF6", c2:"#22D45A", op:0.28, dur:10.8, delay:-5.5},
    {x:"65%",  w:"13%", c1:"#06B6D4", c2:"#8A5CF6", op:0.24, dur:8.0,  delay:-0.8},
    {x:"74%",  w:"15%", c1:"#22D45A", c2:"#0EA5E9", op:0.30, dur:12.5, delay:-3.0},
    {x:"84%",  w:"12%", c1:"#7C3AED", c2:"#06B6D4", op:0.22, dur:9.0,  delay:-7.0},
    {x:"92%",  w:"14%", c1:"#8A5CF6", c2:"#4F46E5", op:0.26, dur:6.8,  delay:-1.5},
  ];

  // Partículas luminosas flotando
  const floaters = Array.from({length:18},(_,i)=>({
    id:i, x:i*5.8+Math.sin(i*2.5)*10,
    size:1.8+Math.sin(i*2)*1.1,
    dur:9+Math.cos(i)*4, delay:-(i*0.9),
    col:i%3===0?"#8A5CF6":i%2===0?"#06B6D4":"#22D45A",
  }));

  return (
    <>
      <style>{`
        @keyframes auroraRipple {
          0%   { transform:scaleX(1)   translateX(0%);  opacity:var(--ao); }
          20%  { transform:scaleX(1.4) translateX(6%);  opacity:calc(var(--ao)*1.6); }
          45%  { transform:scaleX(0.7) translateX(-5%); opacity:calc(var(--ao)*0.6); }
          70%  { transform:scaleX(1.3) translateX(4%);  opacity:calc(var(--ao)*1.4); }
          100% { transform:scaleX(1)   translateX(0%);  opacity:var(--ao); }
        }
        @keyframes auroraHorizon {
          0%,100% { opacity:0.45; transform:scaleX(1); }
          50%     { opacity:0.85; transform:scaleX(1.06); }
        }
        @keyframes auroraStarTwinkle {
          0%,100% { opacity:0.35; transform:scale(1); }
          50%     { opacity:1;    transform:scale(1.5); }
        }
        @keyframes auroraFloat {
          0%   { transform:translateY(0) translateX(0px); opacity:0; }
          10%  { opacity:0.7; }
          90%  { opacity:0.4; }
          100% { transform:translateY(-110vh) translateX(20px); opacity:0; }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
        {/* fondo ártico muy profundo */}
        <div style={{position:"fixed",inset:0,
          background:"linear-gradient(175deg,#010210 0%,#020818 55%,#010512 100%)"}}/>

        {/* bandas de aurora ondulantes — el corazón del efecto */}
        {strips.map((s,i)=>(
          <div key={i} style={{
            "--ao":s.op,
            position:"absolute",
            left:s.x, top:"-5%",
            width:s.w, height:"112%",
            background:`linear-gradient(180deg,${s.c1}00 0%,${s.c1}${Math.round(s.op*1.2*255).toString(16).padStart(2,"0")} 15%,${s.c2}${Math.round(s.op*0.9*255).toString(16).padStart(2,"0")} 55%,${s.c1}${Math.round(s.op*0.5*255).toString(16).padStart(2,"0")} 78%,transparent 100%)`,
            filter:"blur(8px)",
            transformOrigin:"top center",
            animation:`auroraRipple ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* glow de horizonte — base real de la aurora */}
        <div style={{position:"fixed",bottom:"14%",left:"-6%",right:"-6%",height:80,
          background:"linear-gradient(0deg,#22D45A42,#22D45A22,transparent)",
          animation:"auroraHorizon 8s -2s ease-in-out infinite"}}/>
        <div style={{position:"fixed",bottom:"12%",left:"20%",right:"20%",height:50,
          background:"linear-gradient(0deg,#8A5CF635,transparent)",
          animation:"auroraHorizon 12s -5s ease-in-out infinite"}}/>

        {/* estrellas árticas */}
        {stars.map(s=>(
          <div key={s.id} style={{
            position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
            width:s.size,height:s.size,borderRadius:"50%",
            background:s.col,
            boxShadow:s.size>2?`0 0 ${s.size*4}px ${s.col}`:undefined,
            animation:`auroraStarTwinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* partículas luminosas ascendentes */}
        {floaters.map(f=>(
          <div key={f.id} style={{
            position:"absolute",top:-6,left:`${f.x}%`,
            width:f.size,height:f.size,borderRadius:"50%",
            background:f.col,
            boxShadow:`0 0 ${f.size*6}px ${f.col}AA`,
            animation:`auroraFloat ${f.dur}s ${f.delay}s linear infinite`,
            willChange:"transform,opacity",
          }}/>
        ))}

        {/* velo de luz en la cima */}
        <div style={{position:"fixed",top:0,left:0,right:0,height:"32%",
          background:"linear-gradient(to bottom,rgba(138,92,246,0.08),transparent)"}}/>

        <div style={{position:"fixed",bottom:0,left:0,right:0,height:"28%",
          background:"linear-gradient(to top,#010312 18%,transparent)"}}/>
      </div>
    </>
  );
}
