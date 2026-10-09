// QUIRÓFANO — Monitor en vivo sobre verde clínico. ECG y pletismografía barriendo, lámpara cialítica.
// Concepto: la sala de pabellón, limpia y silenciosa, con el pulso del paciente de fondo.
// HR 72 → 1 latido cada 0.833s. El trazo ECG cubre 4 latidos → 3.33s por barrido.

const BEAT = 100;
function ecgPath(beats, base) {
  let d = `M0,${base}`;
  for (let b = 0; b < beats; b++) {
    const x = b * BEAT;
    d += ` L${x+14},${base} Q${x+20},${base-7} ${x+26},${base}`        // P
       + ` L${x+34},${base} L${x+37},${base+5} L${x+41},${base-38}`    // Q-R
       + ` L${x+45},${base+12} L${x+48},${base} L${x+60},${base}`      // S
       + ` Q${x+70},${base-12} ${x+80},${base} L${x+BEAT},${base}`;     // T
  }
  return d;
}
function plethPath(beats, base) {
  let d = `M0,${base}`;
  for (let b = 0; b < beats; b++) {
    const x = b * BEAT;
    d += ` C${x+15},${base} ${x+20},${base-26} ${x+32},${base-26}`
       + ` C${x+44},${base-26} ${x+48},${base-8} ${x+56},${base-10}`
       + ` C${x+64},${base-12} ${x+72},${base} ${x+BEAT},${base}`;
  }
  return d;
}

const ECG   = ecgPath(4, 60);
const PLETH = plethPath(4, 60);

// Estela con degradé: tres segmentos con la misma cabeza, distinto largo y opacidad
function Trace({ d, color, dur, delay = 0 }) {
  const tails = [{ len:220, op:0.18, w:2 }, { len:110, op:0.45, w:2.2 }, { len:35, op:1, w:2.6 }];
  return (
    <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={{width:"100%",height:"100%",overflow:"visible"}}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.08} strokeWidth={1.5}/>
      {tails.map((t, i) => (
        <path key={i} d={d} pathLength={1000} fill="none" stroke={color} strokeOpacity={t.op}
          strokeWidth={t.w} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${t.len} 2000`} vectorEffect="non-scaling-stroke">
          <animate attributeName="stroke-dashoffset" from={t.len} to={t.len - 1000}
            dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"/>
        </path>
      ))}
      <circle r={3.2} fill={color} style={{filter:`drop-shadow(0 0 4px ${color})`}}>
        <animateMotion path={d} dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

export function QuirofanoEffect() {
  const GREEN = "#0A9E8A", BLUE = "#1C86D6", INK = "#0B3B33";
  const lampSpots = Array.from({length:7}, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    return { x: Math.cos(a) * 30, y: Math.sin(a) * 30 };
  });

  return (
    <>
      <style>{`
        @keyframes qxHeart { 0%,100% { transform:scale(1); } 12% { transform:scale(1.28); } 26% { transform:scale(1); } }
        @keyframes qxLamp  { 0%,100% { opacity:0.55; transform:translateX(-50%) scale(1); } 50% { opacity:0.8; transform:translateX(-50%) scale(1.04); } }
        @keyframes qxBlink { 0%,100% { opacity:0.35; } 50% { opacity:0.1; } }
        @media (prefers-reduced-motion: reduce) {
          .qx-fx * { animation:none !important; }
        }
      `}</style>
      <div className="qx-fx" style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden",
        background:"linear-gradient(180deg,#F2FAF8 0%,#E6F3EF 100%)"}}>

        {/* PAPEL DE ECG */}
        <div style={{position:"absolute",inset:0,
          backgroundImage:`linear-gradient(${GREEN}0D 1px, transparent 1px), linear-gradient(90deg, ${GREEN}0D 1px, transparent 1px),
                           linear-gradient(${GREEN}1A 1px, transparent 1px), linear-gradient(90deg, ${GREEN}1A 1px, transparent 1px)`,
          backgroundSize:"8px 8px, 8px 8px, 40px 40px, 40px 40px"}}/>

        {/* LÁMPARA CIALÍTICA */}
        <div style={{position:"absolute",top:-215,left:"50%",width:300,height:300,
          animation:"qxLamp 7s ease-in-out infinite"}}>
          <div style={{position:"absolute",inset:-80,borderRadius:"50%",
            background:"radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0) 70%)"}}/>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1.5px solid rgba(10,158,138,0.16)",
            background:"radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(220,240,236,0.35) 100%)"}}/>
          {lampSpots.map((s, i) => (
            <div key={i} style={{position:"absolute",left:`calc(50% + ${s.x}% - 22px)`,top:`calc(50% + ${s.y}% - 22px)`,
              width:44,height:44,borderRadius:"50%",
              background:"radial-gradient(circle, #FFFFFF 0%, rgba(210,240,235,0.9) 55%, rgba(150,200,190,0.2) 100%)",
              border:"1px solid rgba(10,158,138,0.14)",
              boxShadow:"0 0 18px rgba(255,255,255,0.9), inset 0 -3px 8px rgba(10,158,138,0.12)"}}/>
          ))}
        </div>

        {/* ECG */}
        <div style={{position:"absolute",left:0,right:0,top:"79%",height:"10%"}}>
          <Trace d={ECG} color={GREEN} dur={3.33}/>
        </div>

        {/* PLETISMOGRAFÍA SpO₂ */}
        <div style={{position:"absolute",left:0,right:0,top:"91%",height:"5%",opacity:0.75}}>
          <Trace d={PLETH} color={BLUE} dur={3.33} delay={-0.25}/>
        </div>

        {/* SIGNOS VITALES */}
        <div style={{position:"absolute",right:14,top:"calc(79% - 22px)",display:"flex",alignItems:"center",gap:6,
          fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:GREEN,opacity:0.6}}>
          <span style={{display:"inline-block",animation:"qxHeart 0.833s ease-out infinite"}}>♥</span>72
        </div>
        <div style={{position:"absolute",right:14,top:"calc(91% - 18px)",
          fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:BLUE,opacity:0.55}}>
          SpO₂ 98%
        </div>
        <div style={{position:"absolute",left:14,top:"calc(79% - 22px)",display:"flex",alignItems:"center",gap:6,
          fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:"0.15em",color:INK,opacity:0.35}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#E5484D",animation:"qxBlink 1.6s ease-in-out infinite"}}/>
          II · 25 mm/s
        </div>

        {/* Viñeta */}
        <div style={{position:"absolute",inset:0,
          background:"radial-gradient(ellipse 100% 85% at 50% 40%, transparent 60%, rgba(10,80,70,0.07) 100%)"}}/>
      </div>
    </>
  );
}
