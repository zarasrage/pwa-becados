// PRISMA — Luz blanca que se fragmenta. Cáusticas ondulantes, rayos arcoíris, destellos cristalinos.
// Concepto: el interior de un cristal gigante con luz solar atravesándolo.
// Tiempos primos (11s, 13s, 17s, 19s) → evita patrones repetitivos.
export function AmanecerEffect() {

  // ─── RAYOS DE PRISMA ──────────────────────────────────────────────
  // Haces de luz coloreada que barren lentamente, como al girar un prisma
  const prismRays = [
    { x:"8%",  rot:-25, col:"rgba(255,100,120,VAL)", w:160, dur:11, delay:0,   op:0.28 },
    { x:"18%", rot:-18, col:"rgba(255,160,60,VAL)",  w:200, dur:13, delay:-4,  op:0.22 },
    { x:"30%", rot:-10, col:"rgba(255,230,40,VAL)",  w:180, dur:17, delay:-8,  op:0.18 },
    { x:"42%", rot: -3, col:"rgba(80,220,120,VAL)",  w:160, dur:19, delay:-3,  op:0.16 },
    { x:"54%", rot:  5, col:"rgba(40,180,255,VAL)",  w:190, dur:11, delay:-10, op:0.20 },
    { x:"66%", rot: 14, col:"rgba(100,100,255,VAL)", w:170, dur:13, delay:-6,  op:0.18 },
    { x:"78%", rot: 22, col:"rgba(200,60,255,VAL)",  w:150, dur:17, delay:-14, op:0.22 },
    { x:"88%", rot: 30, col:"rgba(255,60,180,VAL)",  w:140, dur:19, delay:-9,  op:0.24 },
  ];

  // ─── CÁUSTICAS ────────────────────────────────────────────────────
  // Patrones de luz ondulante como en el fondo de una piscina con sol
  const caustics = Array.from({length:14}, (_, i) => ({
    id:i,
    x: i * 7.2 + Math.sin(i * 2.3) * 12,
    y: 10 + Math.cos(i * 1.8) * 55,
    w: 80 + Math.sin(i * 2.1) * 50,
    h: 30 + Math.cos(i * 1.6) * 20,
    rot: Math.sin(i * 2.9) * 40,
    dur: 4 + Math.cos(i * 1.4) * 2,
    delay: -(i * 0.85),
    op: 0.18 + Math.sin(i * 2.2) * 0.10,
    hue: (i * 37) % 360,
  }));

  // ─── DESTELLOS CRISTALINOS ────────────────────────────────────────
  // Puntos brillantes que flashean, como facetas de un cristal
  const sparkles = Array.from({length:30}, (_, i) => ({
    id:i,
    x: i * 3.4 + Math.cos(i * 2.7) * 8,
    y: 5 + Math.sin(i * 1.9) * 80,
    size: 2 + Math.cos(i * 2.5) * 1.2,
    dur: 2.5 + Math.sin(i * 1.7) * 1.5,
    delay: -(i * 0.62),
    op: 0.70 + Math.sin(i * 2.4) * 0.22,
    col: i%5===0?"#FF80A0":i%4===0?"#80C0FF":i%3===0?"#80FF80":i%2===0?"#FFD060":"#D080FF",
  }));

  // ─── DIFRACCIÓN ───────────────────────────────────────────────────
  // Arcoíris en anillo que pulsa en el centro
  const rings = [
    { r:120, col:"rgba(255,80,80,VAL)",  op:0.10, dur:8,  delay:0   },
    { r:160, col:"rgba(255,180,40,VAL)", op:0.09, dur:10, delay:-3  },
    { r:200, col:"rgba(80,220,80,VAL)",  op:0.08, dur:12, delay:-6  },
    { r:240, col:"rgba(40,160,255,VAL)", op:0.08, dur:9,  delay:-2  },
    { r:280, col:"rgba(160,40,255,VAL)", op:0.07, dur:11, delay:-8  },
  ];

  return (
    <>
      <style>{`
        @keyframes prismSweep {
          0%,100% { opacity:0; transform:rotate(var(--pr)deg) scaleX(1); }
          15%,85% { opacity:var(--pop); transform:rotate(var(--pr)deg) scaleX(1.08); }
          50%     { opacity:calc(var(--pop)*1.6); transform:rotate(var(--pr)deg) scaleX(1); }
        }
        @keyframes causticRipple {
          0%,100% { transform:rotate(var(--crot)deg) scale(1);    opacity:var(--cop); }
          40%     { transform:rotate(var(--crot)deg) scale(1.35); opacity:calc(var(--cop)*0.3); }
          70%     { transform:rotate(var(--crot)deg) scale(0.75); opacity:calc(var(--cop)*1.5); }
        }
        @keyframes sparklePop {
          0%,100% { transform:scale(0) rotate(0deg);   opacity:0; }
          30%,70% { transform:scale(1.4) rotate(45deg); opacity:var(--spop); }
          50%     { transform:scale(1) rotate(22deg);   opacity:calc(var(--spop)*0.7); }
        }
        @keyframes ringPulse {
          0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:var(--rop); }
          50%     { transform:translate(-50%,-50%) scale(1.12); opacity:calc(var(--rop)*2.2); }
        }
        @keyframes corePulse {
          0%,100% { opacity:0.85; transform:translate(-50%,-50%) scale(1); }
          50%     { opacity:1;    transform:translate(-50%,-50%) scale(1.06); }
        }
        @keyframes rainbowShift {
          0%   { filter:hue-rotate(0deg); }
          100% { filter:hue-rotate(360deg); }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>

        {/* FONDO CRISTALINO — blanco cálido */}
        <div style={{position:"fixed",inset:0,
          background:"linear-gradient(155deg,#FDFCFF 0%,#F8F6FF 18%,#FFF8F8 38%,#F8FFF8 58%,#F8F8FF 78%,#FFFCF8 100%)"}}/>

        {/* NÚCLEO DE LUZ — origen del prisma */}
        <div style={{position:"fixed",top:"30%",left:"50%",
          width:500,height:500,borderRadius:"50%",
          transform:"translate(-50%,-50%)",
          background:"radial-gradient(circle,rgba(255,255,255,1) 0%,rgba(255,252,240,0.60) 18%,rgba(255,240,200,0.18) 38%,transparent 55%)",
          animation:"corePulse 7s ease-in-out infinite"}}/>

        {/* ANILLOS DE DIFRACCIÓN */}
        {rings.map((r,i)=>(
          <div key={i} style={{
            "--rop":r.op,
            position:"fixed",
            top:"30%",left:"50%",
            width:r.r*2,height:r.r*2,
            borderRadius:"50%",
            border:`${i===0?2:1.5}px solid ${r.col.replace("VAL","1")}`,
            boxShadow:`0 0 ${12+i*4}px ${r.col.replace("VAL","0.6")}, inset 0 0 ${8+i*3}px ${r.col.replace("VAL","0.3")}`,
            animation:`ringPulse ${r.dur}s ${r.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* RAYOS DE PRISMA — haces de luz coloreada */}
        {prismRays.map((r,i)=>(
          <div key={i} style={{
            "--pop":r.op,
            "--pr":r.rot,
            position:"absolute",top:"-5%",left:r.x,
            width:r.w,height:"110%",
            background:`linear-gradient(180deg,
              ${r.col.replace("VAL",r.op*3)} 0%,
              ${r.col.replace("VAL",r.op*2)} 20%,
              ${r.col.replace("VAL",r.op*1.2)} 50%,
              ${r.col.replace("VAL",r.op*0.5)} 75%,
              transparent 90%)`,
            transformOrigin:"top center",
            animation:`prismSweep ${r.dur}s ${r.delay}s ease-in-out infinite`,
            mixBlendMode:"multiply",
          }}/>
        ))}

        {/* CÁUSTICAS — luz ondulante */}
        {caustics.map(p=>(
          <div key={p.id} style={{
            "--cop":p.op,
            "--crot":`${p.rot}`,
            position:"absolute",
            left:`${p.x}%`,top:`${p.y}%`,
            width:p.w,height:p.h,
            borderRadius:"50%",
            background:`radial-gradient(ellipse,
              hsla(${p.hue},90%,65%,${p.op*2.5}) 0%,
              hsla(${(p.hue+40)%360},80%,70%,${p.op}) 45%,
              transparent 72%)`,
            animation:`causticRipple ${p.dur}s ${p.delay}s ease-in-out infinite`,
            willChange:"transform,opacity",
          }}/>
        ))}

        {/* DESTELLOS CRISTALINOS — facetas del prisma */}
        {sparkles.map(p=>(
          <div key={p.id} style={{
            "--spop":p.op,
            position:"absolute",
            left:`${p.x}%`,top:`${p.y}%`,
            width:p.size,height:p.size,
            borderRadius:"50%",
            background:p.col,
            boxShadow:`0 0 ${p.size*5}px ${p.col}, 0 0 ${p.size*10}px ${p.col}55`,
            animation:`sparklePop ${p.dur}s ${p.delay}s ease-in-out infinite`,
            willChange:"transform,opacity",
          }}/>
        ))}

        {/* BRILLO SUPERIOR */}
        <div style={{position:"fixed",top:0,left:0,right:0,height:"35%",
          background:"linear-gradient(to bottom,rgba(255,255,255,0.55),transparent)"}}/>

        {/* VIÑETA SUAVE */}
        <div style={{position:"fixed",inset:0,
          background:"radial-gradient(ellipse 95% 88% at 50% 50%,transparent 52%,rgba(180,160,200,0.12) 100%)"}}/>

      </div>
    </>
  );
}
