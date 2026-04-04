// ── ABISMO — profundidades del mar ───────────────────────────────────────────
// Rayos de luz suaves desde la superficie, burbujas, y siluetas de animales marinos.

function WhaleSVG({ dir }) {
  return (
    <svg viewBox="0 0 220 72" fill="currentColor" style={{width:"100%",height:"100%",transform:dir<0?"scaleX(-1)":"none"}}>
      {/* cuerpo */}
      <path d="M12,36 C35,14 95,8 148,20 C178,28 192,26 200,30 C192,34 178,34 148,44 C95,58 35,58 12,36 Z"/>
      {/* aleta pectoral */}
      <path d="M78,44 Q88,56 105,48 Q95,38 78,44 Z"/>
      {/* cola */}
      <path d="M198,30 L218,16 L222,30 L218,44 Z"/>
    </svg>
  );
}

function SharkSVG({ dir }) {
  return (
    <svg viewBox="0 0 200 64" fill="currentColor" style={{width:"100%",height:"100%",transform:dir<0?"scaleX(-1)":"none"}}>
      {/* cuerpo */}
      <path d="M0,32 C18,14 75,8 148,22 C175,28 190,28 200,32 C190,36 175,36 148,42 C75,56 18,50 0,32 Z"/>
      {/* aleta dorsal */}
      <path d="M88,20 L100,2 L116,18 Z"/>
      {/* cola */}
      <path d="M196,24 L210,10 L214,32 L210,54 L196,40 Z"/>
      {/* aleta pectoral */}
      <path d="M72,36 Q82,50 98,42 Q90,30 72,36 Z"/>
    </svg>
  );
}

function MantaSVG({ dir }) {
  return (
    <svg viewBox="0 0 200 90" fill="currentColor" style={{width:"100%",height:"100%",transform:dir<0?"scaleX(-1)":"none"}}>
      {/* alas */}
      <path d="M0,45 Q48,8 100,42 Q152,8 200,45 Q162,62 100,58 Q38,62 0,45 Z"/>
      {/* cola */}
      <path d="M100,58 Q103,72 98,90"/>
      {/* cabeza */}
      <ellipse cx="100" cy="40" rx="14" ry="9"/>
    </svg>
  );
}

function FishSchoolSVG({ dir }) {
  // banco de peces — pequeños óvalos en formación
  const fish = [
    {x:0,  y:20, s:1.0}, {x:22, y:8,  s:0.85}, {x:18, y:32, s:0.9},
    {x:40, y:16, s:0.8}, {x:38, y:36, s:0.85}, {x:56, y:6,  s:0.75},
    {x:58, y:28, s:0.8}, {x:72, y:18, s:0.7},
  ];
  return (
    <svg viewBox="0 0 100 50" fill="currentColor" style={{width:"100%",height:"100%",transform:dir<0?"scaleX(-1)":"none"}}>
      {fish.map((f,i) => (
        <g key={i} transform={`translate(${f.x},${f.y}) scale(${f.s})`}>
          <ellipse cx="8" cy="5" rx="10" ry="5"/>
          <path d="M-2,5 L-10,0 L-10,10 Z"/>
        </g>
      ))}
    </svg>
  );
}

export function OceanBubbles() {
  // Burbujas
  const bubbles = Array.from({length:22},(_,i)=>({
    id:i,
    size: i%4===0 ? 18+Math.sin(i)*8 : i%3===0 ? 10+Math.cos(i)*4 : 3+Math.sin(i*1.7)*3,
    x: 4+i*4.2+Math.cos(i*0.8)*12,
    dur: i%4===0 ? 14+Math.sin(i)*4 : 6+Math.sin(i)*3,
    delay: -(i*0.7),
    swayDur: 3+Math.cos(i*1.3)*1.5,
    opacity: i%4===0 ? 0.15 : i%3===0 ? 0.25 : 0.45,
  }));

  // Animales marinos — pasan lentamente a distintas profundidades
  // dir: 1 = izquierda→derecha, -1 = derecha→izquierda
  const creatures = [
    { Comp:WhaleSVG,     y:"10%", w:180, h:58,  dur:50, delay:0,   op:0.14, dir: 1  },
    { Comp:SharkSVG,     y:"30%", w:140, h:45,  dur:36, delay:-14, op:0.18, dir:-1  },
    { Comp:MantaSVG,     y:"52%", w:150, h:68,  dur:44, delay:-8,  op:0.13, dir: 1  },
    { Comp:FishSchoolSVG,y:"22%", w:110, h:55,  dur:28, delay:-20, op:0.22, dir:-1  },
    { Comp:WhaleSVG,     y:"68%", w:120, h:38,  dur:62, delay:-30, op:0.09, dir: 1  },
    { Comp:SharkSVG,     y:"42%", w:100, h:32,  dur:42, delay:-6,  op:0.12, dir: 1  },
    { Comp:FishSchoolSVG,y:"60%", w:80,  h:40,  dur:24, delay:-38, op:0.16, dir:-1  },
    { Comp:MantaSVG,     y:"18%", w:110, h:50,  dur:55, delay:-22, op:0.10, dir:-1  },
  ];

  return (
    <>
      <style>{`
        @keyframes creatureSwimLR {
          0%   { transform:translateX(-220px); opacity:0; }
          5%   { opacity:var(--cop); }
          92%  { opacity:var(--cop); }
          100% { transform:translateX(110vw); opacity:0; }
        }
        @keyframes creatureSwimRL {
          0%   { transform:translateX(110vw); opacity:0; }
          5%   { opacity:var(--cop); }
          92%  { opacity:var(--cop); }
          100% { transform:translateX(-220px); opacity:0; }
        }
        @keyframes creatureBob {
          0%,100% { margin-top:0px; }
          50%     { margin-top:var(--bob,8px); }
        }
        @keyframes lightCone {
          0%,100% { opacity:var(--lop); transform:rotate(var(--lrot)) scaleX(1); }
          50%     { opacity:calc(var(--lop)*1.8); transform:rotate(var(--lrot)) scaleX(1.12); }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>

        {/* FONDO — abismo oscuro */}
        <div style={{position:"fixed",inset:0,
          background:"linear-gradient(to bottom,#001830 0%,#04080F 40%,#001025 100%)",opacity:0.6}}/>

        {/* RAYOS DE LUZ — conos suaves desde la superficie (no más rectángulos) */}
        {[
          {x:"12%",rot:-12,op:0.055,dur:10,delay:0  },
          {x:"28%",rot: -5,op:0.070,dur:14,delay:-4 },
          {x:"44%",rot:  2,op:0.060,dur:11,delay:-7 },
          {x:"60%",rot:  8,op:0.065,dur:16,delay:-2 },
          {x:"78%",rot: 15,op:0.050,dur:12,delay:-9 },
        ].map((r,i)=>(
          <div key={i} style={{
            "--lop":r.op,
            "--lrot":`${r.rot}deg`,
            position:"absolute",top:"-2%",left:r.x,
            width:180,height:"75%",
            background:`linear-gradient(to bottom,
              rgba(0,200,255,${r.op*2.5}) 0%,
              rgba(0,150,220,${r.op}) 30%,
              rgba(0,80,180,${r.op*0.4}) 65%,
              transparent 85%)`,
            transform:`rotate(${r.rot}deg)`,
            transformOrigin:"top center",
            borderRadius:"0 0 50% 50%",
            animation:`lightCone ${r.dur}s ${r.delay}s ease-in-out infinite`,
          }}/>
        ))}

        {/* BRILLO AMBIENTAL */}
        <div style={{position:"fixed",top:-80,left:"2%",width:600,height:600,borderRadius:"50%",
          background:"radial-gradient(circle,#00C8FF0D 0%,transparent 50%)",
          animation:"neonPulseA 12s ease-in-out infinite"}}/>
        <div style={{position:"fixed",bottom:-120,right:"-8%",width:540,height:540,borderRadius:"50%",
          background:"radial-gradient(circle,#0055FF0F 0%,transparent 50%)",
          animation:"neonPulseB 15s ease-in-out infinite"}}/>

        {/* ANIMALES MARINOS */}
        {creatures.map((c,i)=>(
          <div key={i} style={{
            "--cop":c.op,
            "--bob":`${4+i%3*4}px`,
            position:"absolute",
            top:c.y,
            left:0,
            width:c.w,height:c.h,
            color:`rgba(0,200,255,${c.op})`,
            animation:`${c.dir>0?"creatureSwimLR":"creatureSwimRL"} ${c.dur}s ${c.delay}s linear infinite,
                       creatureBob ${3+i*0.8}s ${-i*0.5}s ease-in-out infinite`,
            willChange:"transform",
          }}>
            <c.Comp dir={c.dir}/>
          </div>
        ))}

        {/* BURBUJAS */}
        {bubbles.map(b=>(
          <div key={b.id} style={{
            position:"absolute",bottom:-20,left:`${b.x}%`,
            width:b.size,height:b.size,borderRadius:"50%",
            background:`radial-gradient(circle at 30% 25%,#00C8FF${Math.round(b.opacity*80).toString(16).padStart(2,"0")},transparent 70%)`,
            border:`1px solid #00C8FF${Math.round(b.opacity*120).toString(16).padStart(2,"0")}`,
            boxShadow:b.size>12?`0 0 ${b.size}px #00C8FF20`:"none",
            animation:`bubbleRise ${b.dur}s ${b.delay}s infinite ease-in, bubbleSway ${b.swayDur}s ${b.delay*0.4}s infinite ease-in-out`,
            willChange:"transform,opacity",backfaceVisibility:"hidden",
          }}/>
        ))}

      </div>
    </>
  );
}
