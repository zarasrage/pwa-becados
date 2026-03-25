// Polar Crystal — nieve que deriva, cristales de hielo con glow, glaciar vivo
export function CryoEffect() {
  const flakes = Array.from({length:38},(_,i)=>({
    id:i, x:i*2.7+Math.sin(i*2.3)*10,
    size:1.4+Math.abs(Math.sin(i*1.7))*2.8,
    dur:7+Math.cos(i*1.1)*3, delay:-(i*0.75),
    col:i%4===0?"#FFFFFF":i%3===0?"#C8F4FF":"#7BE8FF",
    op:0.55+Math.abs(Math.sin(i*2.1))*0.38,
  }));

  const hexes = Array.from({length:12},(_,i)=>({
    id:i, x:3+i*8.2+Math.sin(i*1.7)*6, y:Math.cos(i*2.3)*26+28,
    s:26+Math.abs(Math.sin(i*1.4))*36, rot:i*31,
    dur:10+i*2.2, delay:-(i*1.3),
    col:i%3===0?"#E8FCFF":i%2===0?"#7BE8FF":"#00CFFF",
    op:0.30+Math.abs(Math.sin(i*1.9))*0.28,
  }));

  const orbs = [
    {x:"-8%",  y:"-15%", w:480, h:480, col:"#00CFFF", op:0.10, dur:20},
    {x:"50%",  y:"-10%", w:360, h:360, col:"#7BE8FF", op:0.08, dur:27},
    {x:"14%",  y:"44%",  w:520, h:520, col:"#00A8FF", op:0.07, dur:34},
    {x:"64%",  y:"48%",  w:300, h:300, col:"#C0F8FF", op:0.09, dur:23},
  ];

  return (
    <>
      <style>{`
        @keyframes cryoSnow {
          0%   { transform:translateY(-15px) translateX(0px) rotate(0deg); opacity:0; }
          8%   { opacity:1; }
          88%  { opacity:0.78; }
          100% { transform:translateY(108vh) translateX(55px) rotate(180deg); opacity:0; }
        }
        @keyframes cryoHexDrift {
          0%   { opacity:var(--oc); transform:translate(0px,0px)    rotate(0deg)   scale(1);    filter:drop-shadow(0 0 6px var(--cc)); }
          22%  { opacity:1;         transform:translate(11px,-18px)  rotate(8deg)   scale(1.14); filter:drop-shadow(0 0 22px var(--cc)); }
          45%  { opacity:calc(var(--oc)*0.65); transform:translate(-8px,-11px) rotate(-5deg) scale(0.90); filter:drop-shadow(0 0 4px var(--cc)); }
          68%  { opacity:1;         transform:translate(16px,-24px)  rotate(13deg)  scale(1.18); filter:drop-shadow(0 0 26px var(--cc)); }
          85%  { opacity:calc(var(--oc)*0.8); transform:translate(-4px,-6px)  rotate(-2deg) scale(0.96); filter:drop-shadow(0 0 8px var(--cc)); }
          100% { opacity:var(--oc); transform:translate(0px,0px)    rotate(0deg)   scale(1);    filter:drop-shadow(0 0 6px var(--cc)); }
        }
        @keyframes cryoRay {
          0%,100% { opacity:0.04; }
          50%     { opacity:0.16; }
        }
        @keyframes cryoGlow {
          0%,100% { opacity:0.6; transform:scale(1); }
          50%     { opacity:1;   transform:scale(1.12); }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
        {/* fondo glaciar profundo */}
        <div style={{position:"fixed",inset:0,
          background:"linear-gradient(170deg,#010C18 0%,#020E22 50%,#010C1C 100%)"}}/>

        {/* orbes de luz fría */}
        {orbs.map((o,i)=>(
          <div key={i} style={{
            position:"absolute",left:o.x,top:o.y,
            width:o.w,height:o.h,borderRadius:"50%",
            background:`radial-gradient(circle,${o.col}${Math.round(o.op*255).toString(16).padStart(2,"0")} 0%,transparent 65%)`,
            animation:`cryoGlow ${o.dur}s ${-i*5}s ease-in-out infinite`,
          }}/>
        ))}

        {/* rayos de luz glaciar inclinados */}
        {[{x:"7%",r:-22,d:22},{x:"22%",r:-11,d:30},{x:"44%",r:0,d:18},{x:"66%",r:10,d:26},{x:"84%",r:20,d:35}].map((ray,i)=>(
          <div key={i} style={{
            position:"absolute",top:"-6%",left:ray.x,
            width:3,height:"122%",
            background:"linear-gradient(180deg,#00CFFF2E 0%,#7BE8FF1E 40%,transparent 80%)",
            transform:`rotate(${ray.r}deg)`,transformOrigin:"top center",
            filter:"blur(1.5px)",
            animation:`cryoRay ${ray.d}s ${-i*5}s ease-in-out infinite`,
          }}/>
        ))}

        {/* cristales hexagonales con glow */}
        {hexes.map(e=>(
          <div key={e.id} style={{
            "--oc":e.op, "--cc":e.col,
            position:"absolute",left:`${e.x}%`,top:`${e.y}%`,
            width:e.s,height:e.s,
            clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            background:`linear-gradient(${e.rot}deg,transparent 8%,${e.col}55 36%,rgba(255,255,255,0.45) 50%,${e.col}48 66%,transparent 92%)`,
            animation:`cryoHexDrift ${e.dur}s ${e.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* nieve que deriva en diagonal */}
        {flakes.map(f=>(
          <div key={f.id} style={{
            position:"absolute",top:-10,left:`${f.x}%`,
            width:f.size,height:f.size,borderRadius:"50%",
            background:f.col,
            boxShadow:`0 0 ${f.size*5}px #00CFFF99`,
            animation:`cryoSnow ${f.dur}s ${f.delay}s linear infinite`,
            opacity:f.op,willChange:"transform",
          }}/>
        ))}

        {/* grietas de escarcha horizontales */}
        {[12,30,50,70].map((t,i)=>(
          <div key={i} style={{
            position:"fixed",top:`${t}%`,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent 5%,#00CFFF${i===1?"22":"14"} 32%,#C0F8FF${i===1?"24":"16"} 58%,transparent 94%)`,
            animation:`cryoGlow ${17+i*6}s ${-i*4}s ease-in-out infinite`,
          }}/>
        ))}

        {/* escarcha en esquinas */}
        <div style={{position:"fixed",top:0,left:0,width:"44%",height:"44%",
          background:"radial-gradient(ellipse at 0% 0%,#00CFFF25 0%,transparent 60%)",
          animation:"cryoGlow 14s ease-in-out infinite"}}/>
        <div style={{position:"fixed",bottom:0,right:0,width:"40%",height:"40%",
          background:"radial-gradient(ellipse at 100% 100%,#7BE8FF1E 0%,transparent 56%)",
          animation:"cryoGlow 20s -7s ease-in-out infinite"}}/>

        <div style={{position:"fixed",bottom:0,left:0,right:0,height:"26%",
          background:"linear-gradient(to top,#010A14 16%,transparent)"}}/>
      </div>
    </>
  );
}
