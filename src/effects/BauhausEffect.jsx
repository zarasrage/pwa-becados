// BAUHAUS — Geometría pura en movimiento. Círculo rojo, cuadrado azul, triángulo amarillo.
// Concepto: un afiche de Dessau 1925 que cobra vida en cámara lenta sobre papel crema.
// Tiempos primos (41s, 53s, 61s, 67s) → la composición se reacomoda sin repetirse.
export function BauhausEffect() {
  const RED = "#E1301F", BLUE = "#1F4FD8", YELLOW = "#F5C21B", INK = "#141414";

  // Fila de puntos que se encienden en secuencia
  const dots = Array.from({length:6}, (_, i) => i);

  return (
    <>
      <style>{`
        @keyframes bhFloatA { 0%,100% { transform:translate(0,0); } 50% { transform:translate(-6vw,4vh); } }
        @keyframes bhFloatB { 0%,100% { transform:translate(0,0) rotate(0deg); } 50% { transform:translate(5vw,-3vh) rotate(90deg); } }
        @keyframes bhSpin   { to { transform:rotate(360deg); } }
        @keyframes bhSpinR  { to { transform:rotate(-360deg); } }
        @keyframes bhBar    { 0%,100% { transform:translateX(-8vw) rotate(-32deg); } 50% { transform:translateX(8vw) rotate(-28deg); } }
        @keyframes bhDot    { 0%,100% { transform:scale(0.55); opacity:0.25; } 15% { transform:scale(1); opacity:1; } 35% { transform:scale(0.55); opacity:0.25; } }
        @keyframes bhHalf   { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(180deg); } }
        @media (prefers-reduced-motion: reduce) {
          .bauhaus-fx * { animation:none !important; }
        }
      `}</style>
      <div className="bauhaus-fx" style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden",
        background:"#F2EEE3"}}>

        {/* RETÍCULA */}
        <div style={{position:"absolute",inset:0,
          backgroundImage:`linear-gradient(${INK}0A 1px, transparent 1px), linear-gradient(90deg, ${INK}0A 1px, transparent 1px)`,
          backgroundSize:"32px 32px"}}/>

        {/* CÍRCULO ROJO — protagonista */}
        <div style={{position:"absolute",top:"-9vh",right:"-22vw",width:"78vw",height:"78vw",maxWidth:380,maxHeight:380,
          borderRadius:"50%",background:RED,opacity:0.15,
          animation:"bhFloatA 41s ease-in-out infinite"}}/>

        {/* ÓRBITA PUNTEADA + satélite */}
        <div style={{position:"absolute",top:"6vh",right:"-6vw",width:"58vw",height:"58vw",maxWidth:290,maxHeight:290,
          animation:"bhSpin 53s linear infinite"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`1.5px dashed ${INK}`,opacity:0.18}}/>
          <div style={{position:"absolute",top:-7,left:"50%",marginLeft:-7,width:14,height:14,borderRadius:"50%",background:INK,opacity:0.55}}/>
        </div>

        {/* CUADRADO AZUL */}
        <div style={{position:"absolute",bottom:"14vh",left:"-12vw",width:"46vw",height:"46vw",maxWidth:230,maxHeight:230,
          background:BLUE,opacity:0.12,
          animation:"bhFloatB 67s ease-in-out infinite"}}/>

        {/* SEMICÍRCULO AZUL — pivotea como un balancín */}
        <div style={{position:"absolute",top:"38vh",left:"8vw",width:"26vw",height:"13vw",maxWidth:130,maxHeight:65,
          transformOrigin:"50% 100%",
          animation:"bhHalf 29s ease-in-out infinite"}}>
          <div style={{width:"100%",height:"100%",borderRadius:"999px 999px 0 0",background:BLUE,opacity:0.2}}/>
        </div>

        {/* TRIÁNGULO AMARILLO */}
        <div style={{position:"absolute",top:"46vh",right:"6vw",width:"44vw",height:"44vw",maxWidth:220,maxHeight:220,
          animation:"bhSpinR 61s linear infinite"}}>
          <div style={{width:"100%",height:"100%",background:YELLOW,opacity:0.32,
            clipPath:"polygon(50% 6%, 96% 86%, 4% 86%)"}}/>
        </div>

        {/* BARRA NEGRA DIAGONAL */}
        <div style={{position:"absolute",top:"62vh",left:"-20vw",width:"140vw",height:10,background:INK,opacity:0.07,
          animation:"bhBar 47s ease-in-out infinite"}}/>
        <div style={{position:"absolute",top:"calc(62vh + 22px)",left:"-20vw",width:"140vw",height:3,background:RED,opacity:0.18,
          animation:"bhBar 47s ease-in-out infinite"}}/>

        {/* FILA DE PUNTOS — metrónomo */}
        <div style={{position:"absolute",bottom:"calc(96px + var(--sab))",left:"8vw",display:"flex",gap:10}}>
          {dots.map(i=>(
            <div key={i} style={{width:9,height:9,borderRadius:"50%",
              background: i===2 ? RED : i===4 ? BLUE : INK,opacity:0.25,
              animation:`bhDot 4.2s ${i*0.35}s ease-in-out infinite`}}/>
          ))}
        </div>

        {/* PAPEL — viñeta cálida */}
        <div style={{position:"absolute",inset:0,
          background:"radial-gradient(ellipse 100% 80% at 50% 40%, transparent 55%, rgba(120,95,40,0.10) 100%)"}}/>
      </div>
    </>
  );
}
