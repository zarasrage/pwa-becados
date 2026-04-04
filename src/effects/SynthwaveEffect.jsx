// ✦ SYNTHWAVE V2 — Sliced venetian-blind sun sinking, perspective grid scrolling,
//   scattered stars, sun reflection on the ground, rich atmospheric glow
export function SynthwaveEffect() {
  // Perspective grid — horizontal lines get closer together toward horizon
  // Simulating depth: lines at 52%, 56%, 60%, 64%, 68%, 73%, 78%, 84%, 91%, 98%
  const gridH = [52,55,58,62,66,71,77,83,90,97];
  // Vertical lines converging to center vanishing point
  const gridV = Array.from({length:12},(_,i)=>{
    const spread = (i - 5.5) / 5.5; // -1 to +1
    return { left: 50 + spread * 48, skew: -spread * 12 };
  });
  // Stars — scattered in the sky (top half)
  const stars = Array.from({length:20},(_,i)=>({
    id:i,
    x: Math.sin(i*137.5)*45+50,
    y: Math.cos(i*97.3)*20+12,
    size: i%6===0 ? 2.5 : i%3===0 ? 1.8 : 1,
    dur: 1.5+Math.cos(i)*1,
    delay: -(i*0.35),
  }));
  // Sun slices — 5 horizontal gaps cut through the sun
  const sunSlices = [22,34,46,58,70]; // percentage positions within the sun

  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {/* Sky gradient — deep purple → magenta at horizon */}
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(to bottom, #06001A 0%, #12002A 30%, #2D0050 48%, #0A0015 100%)",
        opacity:0.9}}/>

      {/* ═══ STARS ═══ */}
      {stars.map(s=>(
        <div key={s.id} style={{
          position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
          width:s.size,height:s.size,borderRadius:"50%",
          background:"#FFFFFF",
          boxShadow:`0 0 ${s.size*3}px #FFFFFF80`,
          animation:`starPop ${s.dur}s ${s.delay}s ease-in-out infinite`,
          opacity:0.3,
          willChange:"opacity",
        }}/>
      ))}

      {/* ═══ SUN — sliced venetian-blind style ═══ */}
      {/* Sun body */}
      <div style={{
        position:"fixed",top:"28%",left:"50%",
        width:130,height:130,borderRadius:"50%",
        background:"linear-gradient(to bottom, #FF006E 0%, #FF4800 35%, #FF8C00 60%, #FFD700 100%)",
        boxShadow:"0 0 50px #FF006E90, 0 0 100px #FF006E50, 0 0 150px #FF480030",
        transform:"translateX(-50%)",
        animation:"sunSink 30s ease-in-out infinite alternate, neonPulseA 4s ease-in-out infinite",
        overflow:"hidden",
      }}>
        {/* Venetian blind slices — horizontal black bars across the sun */}
        {sunSlices.map((pct,i)=>(
          <div key={i} style={{
            position:"absolute",left:0,right:0,top:`${pct}%`,height: i%2===0 ? 4 : 3,
            background:"#0A0015",
            opacity:0.7 + (i*0.05),
          }}/>
        ))}
      </div>

      {/* Sun upper glow */}
      <div style={{position:"fixed",top:"18%",left:"30%",right:"30%",height:200,
        background:"radial-gradient(ellipse at 50% 80%, #FF006E30 0%, #FF480015 40%, transparent 70%)"}}/>

      {/* ═══ HORIZON LINE — bright neon strip ═══ */}
      <div style={{position:"fixed",top:"50%",left:"-10%",right:"-10%",height:3,
        background:"linear-gradient(90deg, transparent, #FF006E, #00F5FF, #FF006E, transparent)",
        boxShadow:"0 0 30px #FF006E, 0 0 60px #00F5FF60"}}/>

      {/* ═══ SUN REFLECTION below horizon ═══ */}
      <div style={{
        position:"fixed",top:"51%",left:"50%",transform:"translateX(-50%) scaleY(-0.5)",
        width:160,height:130,borderRadius:"50%",
        background:"radial-gradient(ellipse, #FF006E35 0%, #FF880020 40%, transparent 65%)",
        animation:"neonPulseB 4s ease-in-out infinite",
        opacity:0.6,
      }}/>
      {/* Reflection streak — elongated glow */}
      <div style={{position:"fixed",top:"52%",left:"35%",right:"35%",height:120,
        background:"radial-gradient(ellipse at 50% 0%, #FF006E20, #FF880010 40%, transparent 70%)",
        animation:"neonPulseA 5s ease-in-out infinite"}}/>

      {/* ═══ PERSPECTIVE GRID — FLOOR ═══ */}
      {/* Horizontal lines — spacing increases toward viewer (bottom) */}
      {gridH.map((t,i)=>{
        const proximity = i / gridH.length; // 0=far, 1=near
        const brightness = Math.round(20 + proximity * 50);
        const alpha = Math.round(proximity * 80 + 20).toString(16).padStart(2,"0");
        return (
          <div key={`gh${i}`} style={{
            position:"fixed",top:`${t}%`,left:0,right:0,height:1,
            background:`linear-gradient(90deg, transparent 3%, #FF006E${alpha} 50%, transparent 97%)`,
            animation:`neonPulseA ${4+i*0.8}s ease-in-out infinite`,
            opacity: 0.3 + proximity * 0.6,
          }}/>
        );
      })}
      {/* Vertical lines — converge to vanishing point at horizon center */}
      {gridV.map((v,i)=>(
        <div key={`gv${i}`} style={{
          position:"fixed",
          left:`${v.left}%`,
          top:"50%",bottom:0,
          width:1,
          background:`linear-gradient(to bottom, #00F5FF50, #00F5FF20 40%, transparent)`,
          transform:`skewX(${v.skew}deg)`,
          transformOrigin:"top center",
          animation:`neonPulseB ${5+i*0.4}s ease-in-out infinite`,
          opacity:0.4,
        }}/>
      ))}

      {/* Grid scroll overlay — gives illusion of forward movement */}
      <div style={{
        position:"fixed",left:0,right:0,top:"50%",bottom:0,
        backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 38px, #00F5FF10 38px, #00F5FF10 40px)",
        backgroundSize:"100% 80px",
        animation:"gridScroll 3s linear infinite",
        opacity:0.4,
      }}/>

      {/* Atmospheric glow — top sky shimmer */}
      <div style={{position:"fixed",top:"-10%",left:"20%",right:"20%",height:250,
        background:"radial-gradient(ellipse, #FF006E18 0%, transparent 55%)"}}/>
      {/* Bottom floor glow */}
      <div style={{position:"fixed",bottom:"-5%",left:"5%",right:"5%",height:200,
        background:"radial-gradient(ellipse at 50% 100%, #00F5FF14 0%, transparent 55%)"}}/>
      {/* Side atmosphere */}
      <div style={{position:"fixed",top:"45%",left:"-5%",width:"30%",height:"30%",
        background:"radial-gradient(circle, #FF006E0A, transparent 60%)",
        animation:"neonPulseB 9s ease-in-out infinite"}}/>
      <div style={{position:"fixed",top:"45%",right:"-5%",width:"30%",height:"30%",
        background:"radial-gradient(circle, #00F5FF0A, transparent 60%)",
        animation:"neonPulseA 11s ease-in-out infinite"}}/>
    </div>
  );
}
