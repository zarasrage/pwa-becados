// SHODO — 書道 — Pincelazos de tinta que barren la pantalla. Un solo concepto brutal.
// Cada trazo se revela de izquierda a derecha como una pincelada real.
// Tiempos primos (13s, 19s, 23s, 29s, 37s) → patrón no se repite por ~2 horas.
export function WabiEffect() {

  // ─── TRAZOS PRINCIPALES ───────────────────────────────────────────
  // Cada trazo define: posición, dimensiones, rotación, timing, opacidad
  const strokes = [
    // trazo maestro — diagonal ancho, ocupa casi toda la pantalla
    { x:"-5%",  y:"28%", w:"110%", h:52, rot:-4,  dur:13, delay:0,   op:0.13, origin:"left" },
    // trazo vertical izquierdo — caligrafía de tachi
    { x:"18%",  y:"-5%", w:28,     h:"110%", rot:2,  dur:19, delay:-6,  op:0.09, origin:"top", vert:true },
    // trazo horizontal fino — como un trazo de pincel seco
    { x:"5%",   y:"55%", w:"90%",  h:18, rot:1,   dur:23, delay:-12, op:0.11, origin:"left" },
    // trazo diagonal inverso — de derecha a izquierda
    { x:"-5%",  y:"12%", w:"110%", h:38, rot:8,   dur:29, delay:-20, op:0.08, origin:"left" },
    // trazo vertical derecho — equilibra la composición
    { x:"72%",  y:"-5%", w:20,     h:"110%", rot:-3, dur:37, delay:-9,  op:0.07, origin:"top", vert:true },
    // trazo grueso central — el más dramático
    { x:"-5%",  y:"42%", w:"110%", h:80, rot:-2,  dur:17, delay:-30, op:0.10, origin:"left" },
    // micro trazo diagonal — detalle
    { x:"40%",  y:"65%", w:"50%",  h:8,  rot:14,  dur:31, delay:-15, op:0.09, origin:"left" },
  ];

  // ─── POLVO DORADO ─────────────────────────────────────────────────
  const gold = Array.from({length:42}, (_, i) => ({
    id:i,
    x: i * 2.4 + Math.sin(i * 2.3) * 11,
    startY: 20 + Math.cos(i * 1.9) * 55,
    size: 1.0 + Math.sin(i * 2.7) * 0.55,
    dur: 16 + Math.cos(i * 1.4) * 6,
    delay: -(i * 0.7),
    sway: 18 + Math.sin(i * 3.1) * 14,
    op: 0.55 + Math.sin(i * 2.2) * 0.22,
  }));

  // ─── SALPICADURAS DE TINTA ────────────────────────────────────────
  // Pequeñas manchas que aparecen donde el pincel impacta
  const splatter = Array.from({length:18}, (_, i) => ({
    id:i,
    x: (i * 5.8 + Math.sin(i * 2.1) * 20) % 95,
    y: (i * 4.9 + Math.cos(i * 1.8) * 18) % 90,
    size: 3 + Math.sin(i * 2.4) * 2.5,
    dur: 8 + Math.cos(i * 1.6) * 3,
    delay: -(i * 1.1),
    op: 0.06 + Math.sin(i * 2.8) * 0.03,
  }));

  return (
    <>
      <style>{`
        @keyframes strokeReveal {
          0%,3%    { clip-path:inset(0 100% 0 0); opacity:0; }
          8%       { opacity:var(--sop); }
          32%,62%  { clip-path:inset(0 0% 0 0);   opacity:var(--sop); }
          98%,100% { clip-path:inset(0 0% 0 0);   opacity:0; }
        }
        @keyframes strokeRevealVert {
          0%,3%    { clip-path:inset(100% 0 0 0); opacity:0; }
          8%       { opacity:var(--sop); }
          32%,62%  { clip-path:inset(0% 0 0 0);   opacity:var(--sop); }
          98%,100% { clip-path:inset(0% 0 0 0);   opacity:0; }
        }
        @keyframes goldRise {
          0%   { transform:translateY(0) translateX(0); opacity:0; }
          8%   { opacity:var(--gop); }
          90%  { opacity:var(--gop); }
          100% { transform:translateY(-70vh) translateX(var(--gsw)px); opacity:0; }
        }
        @keyframes splatPop {
          0%,100% { transform:scale(0); opacity:0; }
          12%     { transform:scale(1.3); opacity:var(--spop); }
          30%,70% { transform:scale(1);   opacity:var(--spop); }
          90%     { opacity:0; }
        }
        @keyframes paperPulse {
          0%,100% { opacity:1; }
          50%     { opacity:0.94; }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>

        {/* PERGAMINO */}
        <div style={{position:"fixed",inset:0,
          background:"linear-gradient(158deg,#FAF7EE 0%,#F7F2E6 30%,#F3ECD8 65%,#EEE5CC 100%)",
          animation:"paperPulse 20s ease-in-out infinite"}}/>

        {/* AGUADA DE FONDO — manchas tenues de tinta diluida */}
        <div style={{position:"fixed",top:"5%",left:"55%",width:"50%",height:"50%",
          background:"radial-gradient(ellipse,rgba(26,20,12,0.04) 0%,transparent 65%)",borderRadius:"50%"}}/>
        <div style={{position:"fixed",top:"45%",left:"-5%",width:"45%",height:"55%",
          background:"radial-gradient(ellipse,rgba(26,20,12,0.03) 0%,transparent 60%)",borderRadius:"50%"}}/>

        {/* SALPICADURAS DE TINTA */}
        {splatter.map(p=>(
          <div key={p.id} style={{
            "--spop":p.op,
            position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
            width:p.size,height:p.size,borderRadius:"50%",
            background:"rgba(20,14,8,0.70)",
            animation:`splatPop ${p.dur}s ${p.delay}s ease-out infinite`,
          }}/>
        ))}

        {/* TRAZOS DE PINCEL — el concepto central */}
        {strokes.map((s,i)=>(
          <div key={i} style={{
            "--sop":s.op,
            position:"absolute",
            left:s.x, top:s.y,
            width:s.w, height:s.h,
            transform:`rotate(${s.rot}deg)`,
            transformOrigin:`${s.origin} center`,
            overflow:"hidden",
            animation:`${s.vert?"strokeRevealVert":"strokeReveal"} ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}>
            {/* textura del trazo — variación de presión del pincel */}
            <div style={{
              position:"absolute",inset:0,
              background:s.vert
                ? `linear-gradient(180deg,transparent 2%,rgba(18,12,6,${s.op*5}) 8%,rgba(22,16,8,${s.op*7}) 30%,rgba(18,12,6,${s.op*6}) 55%,rgba(22,16,8,${s.op*7}) 75%,rgba(18,12,6,${s.op*4}) 92%,transparent 98%)`
                : `linear-gradient(90deg,transparent 1%,rgba(18,12,6,${s.op*5}) 4%,rgba(24,16,8,${s.op*7}) 20%,rgba(20,14,6,${s.op*6}) 45%,rgba(24,18,8,${s.op*7}) 70%,rgba(18,12,6,${s.op*4}) 92%,transparent 99%)`,
            }}/>
            {/* borde del pincel — textura fibrosa */}
            <div style={{
              position:"absolute",
              top: s.vert ? 0 : "-30%",
              left: s.vert ? "-30%" : 0,
              right: s.vert ? "-30%" : 0,
              bottom: s.vert ? 0 : "-30%",
              background:s.vert
                ? `radial-gradient(ellipse 60% 100% at 50% 50%,rgba(10,6,2,${s.op*3}) 0%,transparent 70%)`
                : `radial-gradient(ellipse 100% 55% at 50% 50%,rgba(10,6,2,${s.op*3}) 0%,transparent 70%)`,
            }}/>
          </div>
        ))}

        {/* POLVO DORADO */}
        {gold.map(p=>(
          <div key={p.id} style={{
            "--gop":p.op,
            "--gsw":p.sway,
            position:"absolute",
            left:`${p.x}%`,top:`${p.startY}%`,
            width:p.size,height:p.size,borderRadius:"50%",
            background:"#C8A010",
            boxShadow:`0 0 ${p.size*3}px rgba(200,160,10,0.80)`,
            animation:`goldRise ${p.dur}s ${p.delay}s ease-in-out infinite`,
            willChange:"transform,opacity",
          }}/>
        ))}

        {/* VELO CÁLIDO INFERIOR */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,height:"20%",
          background:"linear-gradient(to top,rgba(180,140,8,0.10),transparent)"}}/>

      </div>
    </>
  );
}
