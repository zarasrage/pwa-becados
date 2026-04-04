// Andromeda Gate — nebulosa viva, estrellas fugaces que cruzan la pantalla, polvo estelar
export function CosmosEffect() {
  const stars = Array.from({length:70},(_,i)=>({
    id:i,
    x:Math.sin(i*137.508)*50+50,
    y:Math.cos(i*97.31)*46+46,
    size:i%12===0?4.2:i%7===0?2.8:i%3===0?1.8:1.0,
    dur:1.6+Math.abs(Math.cos(i))*3.0, delay:-(i*0.18),
    col:i%11===0?"#FFFFFF":i%7===0?"#FFE8FF":i%5===0?"#C8A0FF":i%3===0?"#FF8EF5":"#9B6FFF",
    glow:i%11===0?"#FF6BF5":i%5===0?"#C8A0FF":"#7B2FFF",
    op:i%12===0?1.0:i%7===0?0.90:i%3===0?0.70:0.45,
  }));

  const nebulas = [
    {x:"-18%",y:"-28%",w:"100%",h:"75%",c1:"#FF6BF5",c2:"#7B2FFF",op1:0.38,op2:0.18,dur:18,delay:-3, dir:"alternate"},
    {x:"30%", y:"-10%",w:"88%", h:"65%",c1:"#CC00FF",c2:"#FF6BF5",op1:0.30,op2:0.14,dur:24,delay:-9, dir:"alternate-reverse"},
    {x:"6%",  y:"40%", w:"78%", h:"60%",c1:"#FF4AE8",c2:"#4400FF",op1:0.28,op2:0.12,dur:30,delay:-15,dir:"alternate"},
    {x:"50%", y:"46%", w:"72%", h:"52%",c1:"#9B00FF",c2:"#FF6BF5",op1:0.22,op2:0.10,dur:22,delay:-6, dir:"alternate-reverse"},
    {x:"26%", y:"10%", w:"55%", h:"55%",c1:"#FF6BF5",c2:"#CC00FF",op1:0.45,op2:0.22,dur:10,delay:-2, dir:"alternate"},
  ];

  // Estrellas fugaces — se mueven diagonalmente por la pantalla
  const shoots = Array.from({length:7},(_,i)=>({
    id:i,
    startX: -8+i*14,
    startY: 2+i*9,
    w:110+i*20,
    dur:3.5+i*1.4,
    delay:-(i*3.8),
    col:i%2===0?"#FFFFFF":i%3===0?"#FF6BF5":"#E8C8FF",
  }));

  // Polvo de nebulosa ascendente
  const dust = Array.from({length:28},(_,i)=>({
    id:i, x:i*3.6+Math.sin(i*2.3)*12,
    size:0.8+Math.cos(i*1.6)*0.5+0.8,
    dur:5+Math.sin(i)*2.8, delay:-(i*0.45),
    col:i%3===0?"#FF6BF5":i%2===0?"#C8A0FF":"#9B6FFF",
  }));

  // Cúmulo estelar central — núcleo brillante
  const cluster = [
    {x:"52%",y:"20%",s:14,c:"#FFFFFF", g:"#FF6BF5",dur:2.2},
    {x:"58%",y:"16%",s:9, c:"#FFE8FF", g:"#CC00FF", dur:3.2},
    {x:"46%",y:"24%",s:7, c:"#FFD8FF", g:"#FF6BF5", dur:4.4},
    {x:"62%",y:"26%",s:6, c:"#C8A0FF", g:"#7B2FFF", dur:2.8},
    {x:"55%",y:"28%",s:5, c:"#FF8EF5", g:"#CC00FF", dur:5.0},
  ];

  return (
    <>
      <style>{`
        @keyframes cosmosShoot {
          0%   { transform:translateX(0vw) translateY(0vh); opacity:0; }
          5%   { opacity:1; }
          70%  { opacity:0.85; }
          100% { transform:translateX(130vw) translateY(55vh); opacity:0; }
        }
        @keyframes cosmosDust {
          0%   { transform:translateY(0) scale(1); opacity:0; }
          10%  { opacity:0.7; }
          88%  { opacity:0.45; }
          100% { transform:translateY(-108vh) scale(0.4); opacity:0; }
        }
        @keyframes cosmosNebula {
          0%,100% { opacity:0.7; transform:scale(1) translate(0,0); }
          50%     { opacity:1;   transform:scale(1.08) translate(2%,1%); }
        }
        @keyframes cosmosStar {
          0%,100% { opacity:0.35; transform:scale(1); }
          50%     { opacity:1;    transform:scale(1.6); }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
        {/* fondo espacio profundo */}
        <div style={{position:"fixed",inset:0,
          background:"radial-gradient(ellipse at 52% 20%,#1E0042 0%,#06000F 50%,#09001E 100%)"}}/>

        {/* nebulosas en capas — más intensas */}
        {nebulas.map((n,i)=>(
          <div key={i} style={{
            position:"absolute",left:n.x,top:n.y,width:n.w,height:n.h,
            background:`radial-gradient(ellipse,${n.c1}${Math.round(n.op1*255).toString(16).padStart(2,"0")} 0%,${n.c2}${Math.round(n.op2*255).toString(16).padStart(2,"0")} 40%,transparent 65%)`,
            animation:`auroraShift${(i%3)+1} ${n.dur}s ${n.delay}s ease-in-out infinite ${n.dir}`,
          }}/>
        ))}

        {/* ondas gravitacionales concéntricas */}
        {Array.from({length:5},(_,i)=>({size:80+i*88, op:0.22-i*0.034, dur:7+i*2.6, delay:-(i*2.0)})).map((w,i)=>(
          <div key={i} style={{
            position:"fixed",
            left:`calc(52% - ${w.size/2}px)`,
            top:`calc(20% - ${w.size/2}px)`,
            width:w.size,height:w.size,borderRadius:"50%",
            border:`1.5px solid #FF6BF5${Math.round(w.op*255).toString(16).padStart(2,"0")}`,
            boxShadow:`0 0 12px #CC00FF22, inset 0 0 12px #FF6BF518`,
            animation:`neonPulseA ${w.dur}s ${w.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* campo estelar */}
        {stars.map(s=>(
          <div key={s.id} style={{
            position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
            width:s.size,height:s.size,borderRadius:"50%",
            background:s.col,
            boxShadow:`0 0 ${s.size*6}px ${s.glow}${Math.round(s.op*160).toString(16).padStart(2,"0")}`,
            opacity:s.op,
            animation:`cosmosStar ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* cúmulo central brillante */}
        {cluster.map((c,i)=>(
          <div key={i} style={{
            position:"fixed",left:c.x,top:c.y,
            width:c.s,height:c.s,borderRadius:"50%",background:c.c,
            boxShadow:`0 0 ${c.s*3}px ${c.g},0 0 ${c.s*9}px ${c.g}66`,
            animation:`neonPulseA ${c.dur}s ${-i*0.7}s ease-in-out infinite`,
          }}/>
        ))}

        {/* estrellas fugaces — cruzan la pantalla en diagonal */}
        {shoots.map(s=>(
          <div key={s.id} style={{
            position:"absolute",
            left:`${s.startX}%`,top:`${s.startY}%`,
            width:s.w,height:2,borderRadius:99,
            background:`linear-gradient(90deg,transparent 0%,${s.col}22 20%,${s.col}CC 62%,${s.col} 82%,transparent 100%)`,
            boxShadow:`0 0 10px ${s.col}88`,
            animation:`cosmosShoot ${s.dur}s ${s.delay}s linear infinite`,
          }}/>
        ))}

        {/* polvo estelar ascendente */}
        {dust.map(d=>(
          <div key={d.id} style={{
            position:"absolute",top:-5,left:`${d.x}%`,
            width:d.size,height:d.size,borderRadius:"50%",
            background:d.col,boxShadow:`0 0 ${d.size*7}px ${d.col}88`,
            animation:`cosmosDust ${d.dur}s ${d.delay}s linear infinite`,
            willChange:"transform,opacity",
          }}/>
        ))}

        {/* pulso de núcleo nebular */}
        <div style={{position:"fixed",top:"8%",left:"34%",width:380,height:380,
          background:"radial-gradient(circle,#FF6BF545 0%,#CC00FF25 38%,transparent 62%)",
          animation:"cosmosNebula 5.5s ease-in-out infinite"}}/>

        <div style={{position:"fixed",bottom:0,left:0,right:0,height:"28%",
          background:"linear-gradient(to top,#030008 18%,transparent)"}}/>
      </div>
    </>
  );
}
