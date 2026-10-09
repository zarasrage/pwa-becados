// TOPO — Carta topográfica viva. Curvas de nivel que respiran, escáner de altitud, cumbres marcadas.
// Concepto: mapa de expedición andina, estética outdoor técnica. Salvia, tinta y naranja señal.
// Tiempos primos (43s, 59s, 71s) → las curvas nunca se alinean igual.

// Curva de nivel cerrada e irregular alrededor de (cx,cy) — determinista, sin random
function contour(cx, cy, r, seed, k) {
  const pts = [];
  const N = 72;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r * (1
      + 0.16 * Math.sin(3 * a + seed + k * 0.22)
      + 0.09 * Math.sin(5 * a - seed * 1.7 + k * 0.15)
      + 0.05 * Math.cos(7 * a + seed * 2.3));
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 0.82).toFixed(1)}`);
  }
  return "M" + pts.join("L") + "Z";
}

const PEAKS = [
  { cx:300, cy:170, levels:14, step:17, seed:1.3, dur:59, label:"2.847" },
  { cx:70,  cy:560, levels:12, step:19, seed:4.1, dur:71, label:"1.912" },
  { cx:330, cy:780, levels:9,  step:16, seed:2.6, dur:43, label:"1.204" },
];

const PATHS = PEAKS.map(p =>
  Array.from({length:p.levels}, (_, k) => ({ d: contour(p.cx, p.cy, 10 + k * p.step, p.seed, k), index: k % 5 === 4 }))
);

export function TopoEffect() {
  const INK = "#2E4A3C", SIGNAL = "#FF5A1F";

  return (
    <>
      <style>{`
        @keyframes topoBreath {
          0%,100% { transform:rotate(0deg) scale(1); }
          50%     { transform:rotate(9deg) scale(1.06); }
        }
        @keyframes topoScan {
          0%   { transform:translateY(-6vh); opacity:0; }
          8%   { opacity:1; }
          92%  { opacity:1; }
          100% { transform:translateY(106vh); opacity:0; }
        }
        @keyframes topoPing {
          0%   { transform:scale(0.4); opacity:0.7; }
          100% { transform:scale(3.2); opacity:0; }
        }
        @keyframes topoDash { to { stroke-dashoffset:-48; } }
        @media (prefers-reduced-motion: reduce) {
          .topo-fx * { animation:none !important; }
        }
      `}</style>
      <div className="topo-fx" style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden",
        background:"linear-gradient(180deg,#F1F3EE 0%,#EAEFE7 100%)"}}>

        <svg viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
          {/* Cuadrícula UTM */}
          {Array.from({length:5}, (_, i) => (
            <line key={"v"+i} x1={i*100} y1={0} x2={i*100} y2={900} stroke={INK} strokeOpacity={0.07} strokeWidth={0.8}/>
          ))}
          {Array.from({length:10}, (_, i) => (
            <line key={"h"+i} x1={0} y1={i*100} x2={400} y2={i*100} stroke={INK} strokeOpacity={0.07} strokeWidth={0.8}/>
          ))}

          {/* Curvas de nivel */}
          {PEAKS.map((p, pi) => (
            <g key={pi} style={{transformOrigin:`${p.cx}px ${p.cy}px`, animation:`topoBreath ${p.dur}s ease-in-out infinite`}}>
              {PATHS[pi].map((c, k) => (
                <path key={k} d={c.d} fill="none" stroke={INK}
                  strokeOpacity={c.index ? 0.26 : 0.13}
                  strokeWidth={c.index ? 1.4 : 0.8}/>
              ))}
            </g>
          ))}

          {/* Ruta de expedición — sendero punteado entre cumbres */}
          <path d="M300,170 C240,300 120,380 70,560 S260,700 330,780" fill="none"
            stroke={SIGNAL} strokeOpacity={0.45} strokeWidth={1.6} strokeDasharray="6 6"
            style={{animation:"topoDash 3s linear infinite"}}/>
        </svg>

        {/* Cumbres — ping + cota */}
        {PEAKS.map((p, i) => (
          <div key={i} style={{position:"absolute",left:`${p.cx/4}%`,top:`${p.cy/9}%`}}>
            <div style={{position:"absolute",left:-5,top:-5,width:10,height:10,borderRadius:"50%",border:`1.5px solid ${SIGNAL}`,
              animation:`topoPing 2.8s ${i*0.9}s ease-out infinite`}}/>
            <div style={{position:"absolute",left:-3,top:-3,width:6,height:6,borderRadius:"50%",background:SIGNAL,opacity:0.8}}/>
            <div style={{position:"absolute",left:9,top:-7,fontFamily:"'JetBrains Mono',monospace",fontSize:9,
              color:INK,opacity:0.45,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>▲ {p.label} m</div>
          </div>
        ))}

        {/* Escáner de altitud */}
        <div style={{position:"absolute",left:0,right:0,top:0,height:1,
          animation:"topoScan 17s linear infinite",willChange:"transform,opacity"}}>
          <div style={{height:1,background:`linear-gradient(90deg, transparent, ${SIGNAL}AA 20%, ${SIGNAL}AA 80%, transparent)`}}/>
          <div style={{height:28,marginTop:-28,background:`linear-gradient(0deg, ${SIGNAL}14, transparent)`}}/>
        </div>

        {/* Coordenadas — Santiago */}
        <div style={{position:"absolute",left:8,top:"50%",transform:"rotate(-90deg) translateX(50%)",transformOrigin:"left top",
          fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:"0.25em",color:INK,opacity:0.32,whiteSpace:"nowrap"}}>
          33°26′S · 70°39′W · ESC 1:25.000
        </div>

        {/* Viñeta */}
        <div style={{position:"absolute",inset:0,
          background:"radial-gradient(ellipse 100% 85% at 50% 45%, transparent 60%, rgba(46,74,60,0.08) 100%)"}}/>
      </div>
    </>
  );
}
