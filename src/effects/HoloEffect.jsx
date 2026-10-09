// HOLO — Lámina holográfica perlada. Malla de color líquida + barrido iridiscente + destellos.
// Concepto: la luz rebotando sobre un sticker holográfico. Blanco limpio, color sólo en la luz.
// Tiempos primos (19s, 23s, 29s, 31s, 37s) → la malla nunca se ve igual.
export function HoloEffect() {

  // ─── MALLA LÍQUIDA ────────────────────────────────────────────────
  // Manchas de color enormes y muy suaves que derivan y se mezclan
  const blobs = [
    { c:"167,140,255", x:-18, y:-12, s:120, dur:23, delay:0   },
    { c:"120,220,255", x:42,  y:4,   s:105, dur:29, delay:-7  },
    { c:"255,170,210", x:4,   y:42,  s:115, dur:31, delay:-13 },
    { c:"150,245,205", x:52,  y:62,  s:100, dur:19, delay:-5  },
    { c:"255,215,150", x:-14, y:82,  s:90,  dur:37, delay:-17 },
  ];

  // ─── ORBES IRIDISCENTES ───────────────────────────────────────────
  const orbs = Array.from({length:7}, (_, i) => ({
    id:i,
    x: 6 + i * 13.5 + Math.sin(i * 2.1) * 5,
    size: 10 + Math.abs(Math.cos(i * 1.7)) * 18,
    dur: 26 + Math.sin(i * 1.3) * 8,
    delay: -(i * 4.1),
    spin: 6 + (i % 3) * 3,
  }));

  // ─── DESTELLOS ✦ ──────────────────────────────────────────────────
  const sparks = Array.from({length:16}, (_, i) => ({
    id:i,
    x: 4 + i * 6 + Math.cos(i * 2.7) * 4,
    y: 6 + Math.abs(Math.sin(i * 1.9)) * 86,
    size: 7 + Math.abs(Math.sin(i * 2.3)) * 7,
    dur: 3.2 + Math.abs(Math.cos(i * 1.4)) * 2.6,
    delay: -(i * 0.71),
  }));

  const grain = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

  return (
    <>
      <style>{`
        @keyframes holoDrift {
          0%,100% { transform:translate(0,0) scale(1); }
          33%     { transform:translate(14vw,9vh) scale(1.18); }
          66%     { transform:translate(-9vw,15vh) scale(0.88); }
        }
        @keyframes holoSheen {
          0%   { transform:translateX(-70%) rotate(0.001deg); }
          100% { transform:translateX(0%) rotate(0.001deg); }
        }
        @keyframes holoOrb {
          0%   { transform:translateY(0) rotate(0deg);      opacity:0; }
          10%  { opacity:0.9; }
          90%  { opacity:0.9; }
          100% { transform:translateY(-112vh) rotate(360deg); opacity:0; }
        }
        @keyframes holoHue {
          from { filter:hue-rotate(0deg); }
          to   { filter:hue-rotate(360deg); }
        }
        @keyframes holoSpark {
          0%,100% { transform:scale(0) rotate(0deg);   opacity:0; }
          45%,55% { transform:scale(1) rotate(90deg);  opacity:1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .holo-fx * { animation:none !important; }
        }
      `}</style>
      <div className="holo-fx" style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden",
        background:"linear-gradient(170deg,#FBFAFF 0%,#F4F2FC 45%,#F7F5FB 100%)"}}>

        {/* MALLA LÍQUIDA */}
        {blobs.map((b,i)=>(
          <div key={i} style={{
            position:"absolute",left:`${b.x}%`,top:`${b.y}%`,
            width:`${b.s}vw`,height:`${b.s}vw`,borderRadius:"50%",
            background:`radial-gradient(circle, rgba(${b.c},0.55) 0%, rgba(${b.c},0.22) 38%, rgba(${b.c},0) 68%)`,
            animation:`holoDrift ${b.dur}s ${b.delay}s ease-in-out infinite`,
            willChange:"transform",
          }}/>
        ))}

        {/* BARRIDO HOLOGRÁFICO — franja arcoíris que cruza en diagonal */}
        <div style={{position:"absolute",inset:"-20% -10%",transform:"rotate(-18deg)"}}>
          <div style={{
            position:"absolute",top:0,bottom:0,left:0,width:"340%",
            background:`linear-gradient(90deg,
              transparent 0%, transparent 38%,
              rgba(255,120,200,0.16) 42%, rgba(255,220,120,0.18) 45%,
              rgba(120,255,200,0.16) 48%, rgba(110,190,255,0.18) 51%,
              rgba(180,130,255,0.16) 54%, transparent 58%, transparent 100%)`,
            animation:"holoSheen 11s linear infinite",
            willChange:"transform",
          }}/>
        </div>

        {/* RETÍCULA DE PUNTOS — textura de lámina */}
        <div style={{position:"absolute",inset:0,
          backgroundImage:"radial-gradient(rgba(80,60,160,0.10) 1px, transparent 1.2px)",
          backgroundSize:"18px 18px",
          WebkitMaskImage:"linear-gradient(180deg, #000 0%, transparent 55%)",
          maskImage:"linear-gradient(180deg, #000 0%, transparent 55%)"}}/>

        {/* ORBES IRIDISCENTES */}
        {orbs.map(o=>(
          <div key={o.id} style={{
            position:"absolute",left:`${o.x}%`,bottom:-40,
            width:o.size,height:o.size,
            animation:`holoOrb ${o.dur}s ${o.delay}s linear infinite`,
            willChange:"transform,opacity",
          }}>
            <div style={{
              width:"100%",height:"100%",borderRadius:"50%",
              background:"conic-gradient(from 0deg,#FF9AD5,#FFE08A,#9CFFD6,#8EC8FF,#C7A2FF,#FF9AD5)",
              boxShadow:"inset -2px -3px 6px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(120,80,200,0.25), 0 4px 14px rgba(140,110,255,0.25)",
              opacity:0.75,
              animation:`holoHue ${o.spin}s linear infinite`,
            }}/>
          </div>
        ))}

        {/* DESTELLOS ✦ */}
        {sparks.map(s=>(
          <svg key={s.id} width={s.size} height={s.size} viewBox="0 0 24 24" style={{
            position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
            animation:`holoSpark ${s.dur}s ${s.delay}s ease-in-out infinite`,
            willChange:"transform,opacity",
          }}>
            <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z"
              fill={s.id%3===0?"#B49BFF":s.id%3===1?"#7FD8FF":"#FFA8D2"}/>
          </svg>
        ))}

        {/* GRANO — tacto de papel fotográfico */}
        <div style={{position:"absolute",inset:0,backgroundImage:grain,opacity:0.07,mixBlendMode:"multiply"}}/>

        {/* LUZ SUPERIOR */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:"30%",
          background:"linear-gradient(180deg,rgba(255,255,255,0.7),transparent)"}}/>
      </div>
    </>
  );
}
