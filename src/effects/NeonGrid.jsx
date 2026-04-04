// ✦ GLITCH V2 — Aggressive digital corruption: displacement jolts, data blocks,
//   heavy scanlines, flickering neon orbs, chaotic not clean
export function NeonGrid() {
  // Grid lines — kept but made more visible
  const hLines = [12, 28, 44, 58, 72, 86];
  const vLines = [15, 30, 50, 70, 85];
  // Corruption blocks — rectangles that flash like broken VRAM
  const corruptBlocks = [
    { x:"5%",  y:"12%", w:120, h:8,  dur:7,  delay:0,    anim:"corruptBlock" },
    { x:"55%", y:"35%", w:80,  h:12, dur:11, delay:-3,   anim:"corruptBlockB" },
    { x:"20%", y:"62%", w:140, h:6,  dur:9,  delay:-5,   anim:"corruptBlock" },
    { x:"65%", y:"78%", w:100, h:10, dur:13, delay:-8,   anim:"corruptBlockB" },
    { x:"10%", y:"48%", w:60,  h:14, dur:8,  delay:-2,   anim:"corruptBlock" },
    { x:"72%", y:"18%", w:90,  h:7,  dur:15, delay:-6,   anim:"corruptBlockB" },
    { x:"38%", y:"88%", w:110, h:5,  dur:10, delay:-4,   anim:"corruptBlock" },
  ];
  // Pixel clusters — tiny squares like dead pixels
  const pixels = Array.from({length:16},(_,i)=>({
    id:i,
    x: Math.sin(i*137.5)*45+50,
    y: Math.cos(i*97.3)*40+45,
    size: 2+Math.sin(i*2.3)*2,
    dur: 6+Math.cos(i)*4,
    delay: -(i*0.6),
    color: i%4===0?"#FF00FF":i%3===0?"#00FFFF":i%2===0?"#CC00FF":"#FFFFFF",
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {/* Heavy scanlines — actually visible */}
      <div style={{position:"absolute",inset:0,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 3px)",
        animation:"scanlineFlicker 3s ease-in-out infinite",
        pointerEvents:"none"}}/>

      {/* Tron horizontal grid lines — brighter */}
      {hLines.map((t,i)=>(
        <div key={`h${i}`} style={{
          position:"fixed",top:`${t}%`,left:0,right:0,height:1,
          background:`linear-gradient(90deg, transparent 3%, #CC00FF${i%2===0?"38":"20"} 50%, transparent 97%)`,
          animation:`neonPulseB ${4+i*1.2}s ${-i*1.5}s ease-in-out infinite`,
        }}/>
      ))}
      {/* Tron vertical grid lines */}
      {vLines.map((l,i)=>(
        <div key={`v${i}`} style={{
          position:"fixed",left:`${l}%`,top:0,bottom:0,width:1,
          background:`linear-gradient(180deg, transparent 3%, #FF00FF18 50%, transparent 97%)`,
          animation:`neonPulseA ${6+i*1.5}s ${-i*1.3}s ease-in-out infinite`,
        }}/>
      ))}

      {/* ═══ GLITCH DISPLACEMENT LAYERS ═══ */}
      {/* Full-screen copies of the glow shifted horizontally — creates the "broken screen" look */}
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 35% 25%, #CC00FF25, transparent 50%)",
        animation:"glitchJolt 7s linear infinite",
        willChange:"transform",
      }}/>
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 65% 70%, #00FFFF18, transparent 50%)",
        animation:"glitchJoltB 11s linear infinite",
        willChange:"transform",
      }}/>

      {/* ═══ CORRUPTION BLOCKS ═══ */}
      {/* VRAM-corruption rectangles that flash in and out */}
      {corruptBlocks.map((b,i)=>(
        <div key={`cb${i}`} style={{
          position:"fixed",left:b.x,top:b.y,
          width:b.w,height:b.h,
          background:`linear-gradient(90deg, #CC00FF${i%2===0?"50":"35"}, #FF00FF30, #00FFFF${i%3===0?"40":"20"}, transparent)`,
          animation:`${b.anim} ${b.dur}s ${b.delay}s linear infinite`,
          opacity:0,
        }}/>
      ))}

      {/* ═══ DEAD PIXEL CLUSTERS ═══ */}
      {pixels.map(p=>(
        <div key={`px${p.id}`} style={{
          position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
          width:p.size,height:p.size,
          background:p.color,
          boxShadow:`0 0 ${p.size*3}px ${p.color}80`,
          animation:`corruptBlock ${p.dur}s ${p.delay}s linear infinite`,
          opacity:0,
        }}/>
      ))}

      {/* ═══ NEON GLOW ORBS — with flicker ═══ */}
      <div style={{position:"fixed",top:"5%",left:"-12%",width:480,height:480,borderRadius:"50%",
        background:"radial-gradient(circle, #CC00FF22, transparent 50%)",
        animation:"neonPulseA 6s ease-in-out infinite, neonFlicker 7s linear infinite"}}/>
      <div style={{position:"fixed",bottom:"8%",right:"-15%",width:540,height:540,borderRadius:"50%",
        background:"radial-gradient(circle, #FF00FF1A, transparent 50%)",
        animation:"neonPulseB 8s ease-in-out infinite, neonFlicker 11s linear infinite"}}/>
      <div style={{position:"fixed",top:"40%",left:"32%",width:280,height:280,borderRadius:"50%",
        background:"radial-gradient(circle, #7700FF18, transparent 50%)",
        animation:"neonPulseA 10s 2s ease-in-out infinite reverse"}}/>
      {/* Cyan accent — flickers independently */}
      <div style={{position:"fixed",top:"58%",left:"-6%",width:320,height:320,borderRadius:"50%",
        background:"radial-gradient(circle, #00FFFF10, transparent 50%)",
        animation:"neonPulseB 13s 1s ease-in-out infinite, neonFlicker 13s 3s linear infinite"}}/>

      {/* Corner flare */}
      <div style={{position:"fixed",top:-30,right:-30,width:260,height:260,
        background:"radial-gradient(circle at 100% 0%, #CC00FF1A, transparent 50%)"}}/>

      {/* RGB split line — a signature horizontal neon strip that jolts */}
      <div style={{
        position:"fixed",top:"50%",left:0,right:0,height:2,
        background:"linear-gradient(90deg, transparent, #FF00FF80, #00FFFF60, #FF00FF80, transparent)",
        boxShadow:"0 0 12px #FF00FF, 0 -1px 0 #00FFFF, 0 1px 0 #FF006E",
        animation:"glitchJolt 7s linear infinite",
      }}/>
    </div>
  );
}
