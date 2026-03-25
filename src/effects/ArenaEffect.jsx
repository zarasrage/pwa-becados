// Oro del Desierto — sol implacable, arena que vuela lateral, espejismo, calor visible
export function ArenaEffect() {
  // Arena fina — vuela lateral con el viento
  const sandFine = Array.from({length:30},(_,i)=>({
    id:i, x:i*3.4+Math.sin(i*2.8)*12,
    y:8+Math.cos(i*1.6)*35,
    size:0.8+Math.cos(i*2.1)*0.4+0.6,
    dur:4+Math.sin(i)*1.8, delay:-(i*0.42),
    col:i%3===0?"#FFD580":i%2===0?"#FFC04A":"#FFAA30",
    sway:30+Math.sin(i*3)*25,
  }));

  // Arena gruesa — más pesada, cae
  const sandCoarse = Array.from({length:12},(_,i)=>({
    id:i, x:2+i*8.5+Math.cos(i*1.7)*7,
    size:2.2+Math.sin(i*1.4)*0.8,
    dur:10+Math.cos(i)*4, delay:-(i*1.2),
    col:i%2===0?"#C47A20":"#D4900A",
  }));

  // Dunas en la parte baja
  const dunes = [
    {x:"-16%",y:"68%",w:"62%",h:220,op:0.28,col:"#C87A20",dur:24,delay:0},
    {x:"28%", y:"72%",w:"58%",h:195,op:0.32,col:"#D4900A",dur:30,delay:-9},
    {x:"58%", y:"66%",w:"58%",h:230,op:0.26,col:"#B86A10",dur:28,delay:-15},
    {x:"-4%", y:"78%",w:"45%",h:165,op:0.24,col:"#E6A817",dur:36,delay:-6},
  ];

  return (
    <>
      <style>{`
        @keyframes sandBlow {
          0%   { transform:translateX(0px) translateY(0px); opacity:0; }
          8%   { opacity:0.85; }
          88%  { opacity:0.55; }
          100% { transform:translateX(var(--sw,40px)) translateY(-60vh); opacity:0; }
        }
        @keyframes sandFall {
          0%   { transform:translateY(-10px) translateX(0px); opacity:0; }
          10%  { opacity:0.55; }
          85%  { opacity:0.35; }
          100% { transform:translateY(108vh) translateX(-20px); opacity:0; }
        }
        @keyframes heatShimmer {
          0%,100% { transform:scaleX(1) translateX(0%); opacity:var(--ho,0.14); }
          25%     { transform:scaleX(1.02) translateX(0.5%); opacity:calc(var(--ho,0.14)*0.5); }
          50%     { transform:scaleX(0.98) translateX(-0.4%); opacity:calc(var(--ho,0.14)*1.5); }
          75%     { transform:scaleX(1.01) translateX(0.3%); opacity:calc(var(--ho,0.14)*0.7); }
        }
        @keyframes sunPulse {
          0%,100% { opacity:0.90; transform:scale(1); }
          50%     { opacity:1;    transform:scale(1.06); }
        }
        @keyframes duneWave {
          0%,100% { transform:scaleX(1) translateX(0%); opacity:var(--do); }
          50%     { transform:scaleX(1.04) translateX(1.5%); opacity:calc(var(--do)*1.3); }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
        {/* cielo desértico ardiente */}
        <div style={{position:"fixed",inset:0,
          background:"linear-gradient(175deg,#FFF4D8 0%,#FDDFA0 30%,#F8C96A 62%,#F0B045 100%)"}}/>

        {/* sol ardiente — centro-alto */}
        <div style={{position:"fixed",top:"-18%",left:"36%",
          width:340,height:340,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(255,255,200,1) 0%,rgba(255,218,80,0.7) 22%,rgba(255,150,30,0.28) 50%,transparent 70%)",
          animation:"sunPulse 10s ease-in-out infinite"}}/>

        {/* corona solar */}
        <div style={{position:"fixed",top:"-32%",left:"22%",
          width:580,height:580,borderRadius:"50%",
          background:"radial-gradient(circle,transparent 34%,rgba(255,185,55,0.12) 50%,rgba(255,140,20,0.06) 62%,transparent 68%)",
          animation:"sunPulse 14s -4s ease-in-out infinite"}}/>

        {/* brillo solar desde arriba */}
        <div style={{position:"fixed",top:0,left:0,right:0,height:"40%",
          background:"linear-gradient(to bottom,rgba(255,242,170,0.35),transparent)"}}/>

        {/* dunas — siluetas de arena que respiran */}
        {dunes.map((d,i)=>(
          <div key={i} style={{
            "--do":d.op,
            position:"absolute",left:d.x,top:d.y,
            width:d.w,height:d.h,
            background:`radial-gradient(ellipse at 50% 0%,${d.col}${Math.round(d.op*255).toString(16).padStart(2,"0")} 0%,${d.col}${Math.round(d.op*0.4*255).toString(16).padStart(2,"0")} 35%,transparent 68%)`,
            borderRadius:"50%",
            animation:`duneWave ${d.dur}s ${d.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* arena fina soplada lateral */}
        {sandFine.map(p=>(
          <div key={p.id} style={{
            "--sw":`${p.sway}px`,
            position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
            width:p.size,height:p.size,borderRadius:"50%",
            background:p.col,
            boxShadow:`0 0 ${p.size*3}px ${p.col}99`,
            animation:`sandBlow ${p.dur}s ${p.delay}s linear infinite`,
            willChange:"transform",
          }}/>
        ))}

        {/* arena gruesa que cae */}
        {sandCoarse.map(p=>(
          <div key={p.id} style={{
            position:"absolute",top:-8,left:`${p.x}%`,
            width:p.size,height:p.size,borderRadius:"50%",
            background:p.col,
            boxShadow:`0 0 ${p.size*2}px ${p.col}77`,
            animation:`sandFall ${p.dur}s ${p.delay}s linear infinite`,
            opacity:0.55,willChange:"transform",
          }}/>
        ))}

        {/* ondas de calor — shimmer visible */}
        {[22,38,54,68,80].map((t,i)=>(
          <div key={i} style={{
            "--ho": i===2?0.18:0.11,
            position:"fixed",top:`${t}%`,left:0,right:0,height:i===2?3:2,
            background:`linear-gradient(90deg,transparent 5%,rgba(210,140,10,${i===2?0.22:0.13}) 30%,rgba(255,200,60,${i===2?0.18:0.10}) 55%,rgba(210,140,10,${i===2?0.20:0.11}) 78%,transparent 95%)`,
            animation:`heatShimmer ${10+i*3.5}s ${-i*2}s ease-in-out infinite`,
          }}/>
        ))}

        {/* espejismo — banda brillante a media altura */}
        <div style={{position:"fixed",top:"45%",left:"-5%",right:"-5%",height:4,
          background:"linear-gradient(90deg,transparent 5%,rgba(255,245,180,0.35) 28%,rgba(255,255,220,0.45) 52%,rgba(255,245,180,0.30) 78%,transparent 95%)",
          animation:"sunPulse 7s -1.5s ease-in-out infinite"}}/>

        {/* suelo de arena cálido */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,height:"32%",
          background:"linear-gradient(to top,rgba(215,160,70,0.55),transparent)"}}/>
      </div>
    </>
  );
}
