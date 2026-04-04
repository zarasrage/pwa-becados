// ── ⛈️ TORMENTA — Electric storm with lightning strikes, rain, wind ─────────
// El único tema con "eventos": relámpagos que iluminan todo de golpe.
// 3 capas de flash con duraciones primas (7s, 11s, 17s) → patrón no se repite
// en 22 minutos. Lluvia diagonal con ráfagas de viento. Nubes rodando.

export function LightningBoltSVG({ x, w, h, delay, dur }) {
  // Cada rayo es un zigzag SVG con glow
  return (
    <svg style={{
      position:"absolute",left:`${x}%`,top:0,width:w,height:h,
      animation:`boltStrike ${dur}s ${delay}s linear infinite`,
      opacity:0,willChange:"opacity,transform",
    }} viewBox="0 0 60 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 0 L22 120 L38 130 L18 260 L34 270 L12 400"
        stroke="#E0F4FF" strokeWidth="3" strokeLinecap="round"
        fill="none" opacity="0.9"/>
      <path d="M32 0 L22 120 L38 130 L18 260 L34 270 L12 400"
        stroke="#00E5FF" strokeWidth="6" strokeLinecap="round"
        fill="none" opacity="0.4"/>
      {/* Branch */}
      <path d="M22 120 L4 200" stroke="#C0F0FF" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M18 260 L40 320" stroke="#C0F0FF" strokeWidth="1.5" fill="none" opacity="0.5"/>
    </svg>
  );
}

export function StormEffect() {
  // Rain config: 40 drops, fast fall, slight wind angle
  const drops = Array.from({length:40},(_,i)=>({
    id:i,
    x: (i*2.5 + Math.sin(i*3.7)*6) % 100,
    h: 16 + Math.sin(i*1.3)*12,      // 4-28px tall
    w: i%5===0 ? 2 : 1,               // most thin, some thicker
    dur: 0.5 + Math.sin(i*0.7)*0.25 + (i%3)*0.15,  // 0.25-0.9s (very fast)
    delay: -(i*0.12 + Math.cos(i)*0.3),
    opacity: i%4===0 ? 0.6 : i%3===0 ? 0.4 : 0.25,
  }));

  // Cloud config: 5 dark masses drifting at top
  const clouds = [
    { x:"-15%", y:"-8%", w:"55%", h:140, opacity:0.35, dur:28, dir:"alternate", anim:"cloudDrift1" },
    { x:"30%",  y:"-12%",w:"50%", h:120, opacity:0.25, dur:35, dir:"alternate-reverse", anim:"cloudDrift2" },
    { x:"55%",  y:"-5%", w:"45%", h:100, opacity:0.30, dur:22, dir:"alternate", anim:"cloudDrift1" },
    { x:"-5%",  y:"2%",  w:"40%", h:80,  opacity:0.18, dur:40, dir:"alternate-reverse", anim:"cloudDrift2" },
    { x:"65%",  y:"0%",  w:"35%", h:90,  opacity:0.22, dur:32, dir:"alternate", anim:"cloudDrift1" },
  ];

  // Electric arc orbs: brief glow points
  const arcs = [
    { x:"15%", y:"20%", size:240, dur:7,  delay:0 },
    { x:"70%", y:"35%", size:200, dur:11, delay:-3 },
    { x:"40%", y:"60%", size:180, dur:17, delay:-8 },
  ];

  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
      {/* Storm sky gradient — deep navy → near-black */}
      <div style={{position:"fixed",inset:0,
        background:"linear-gradient(175deg, #0A1228 0%, #04060E 35%, #020410 70%, #060818 100%)",
        opacity:0.9}}/>

      {/* Cloud layers — no blur, wide soft gradients */}
      {clouds.map((c,i)=>(
        <div key={i} style={{
          position:"fixed",left:c.x,top:c.y,width:c.w,height:c.h,
          background:"radial-gradient(ellipse at 50% 80%, #0A1428 0%, #06101E80 40%, transparent 70%)",
          borderRadius:"50%",
          opacity:c.opacity,
          animation:`${c.anim} ${c.dur}s ease-in-out infinite ${c.dir}`,
        }}/>
      ))}

      {/* Undercloud ambient light — reflects lightning color faintly */}
      <div style={{position:"fixed",top:0,left:"10%",right:"10%",height:"20%",
        background:"radial-gradient(ellipse at 50% 100%, #00E5FF06, transparent 60%)",
        animation:"neonPulseA 8s ease-in-out infinite"}}/>

      {/* ═══ LIGHTNING FLASH LAYERS ═══ */}
      {/* Three overlapping full-screen flashes at prime-number intervals */}
      {/* → combined pattern doesn't repeat for ~22 minutes */}
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 30% 15%, #C0E8FF, #4080C060 40%, transparent 70%)",
        animation:"lightningFlashA 7s linear infinite",
        opacity:0,
      }}/>
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 65% 10%, #E0F4FF, #6090D050 40%, transparent 70%)",
        animation:"lightningFlashB 11s linear infinite",
        opacity:0,
      }}/>
      <div style={{
        position:"fixed",inset:0,
        background:"radial-gradient(ellipse at 45% 20%, #D0EEFF, #5088C040 40%, transparent 70%)",
        animation:"lightningFlashC 17s linear infinite",
        opacity:0,
      }}/>

      {/* ═══ LIGHTNING BOLTS ═══ */}
      {/* SVG zigzag bolts that appear during flash windows */}
      <LightningBoltSVG x={22} w={60} h="55%" delay={0} dur={7}/>
      <LightningBoltSVG x={62} w={50} h="48%" delay={-2} dur={11}/>
      <LightningBoltSVG x={42} w={55} h="52%" delay={-5} dur={17}/>

      {/* ═══ ELECTRIC ARC GLOWS ═══ */}
      {/* Brief illumination at bolt strike points */}
      {arcs.map((a,i)=>(
        <div key={i} style={{
          position:"fixed",left:a.x,top:a.y,
          width:a.size,height:a.size,borderRadius:"50%",
          background:"radial-gradient(circle, #00E5FF18 0%, #00A0FF08 30%, transparent 55%)",
          animation:`lightningFlashA ${a.dur}s ${a.delay}s linear infinite`,
          opacity:0,
        }}/>
      ))}

      {/* ═══ RAIN ═══ */}
      {/* Wind container — tilts all rain slightly, with gusting */}
      <div style={{
        position:"fixed",inset:"-10% -5% 0 -5%",
        animation:"windGust 6s ease-in-out infinite",
        transformOrigin:"top center",
      }}>
        {drops.map(d=>(
          <div key={d.id} style={{
            position:"absolute",
            left:`${d.x}%`,
            top:-30,
            width:d.w,
            height:d.h,
            borderRadius:d.w,
            background:`linear-gradient(to bottom, transparent, #80C8E8${Math.round(d.opacity*255).toString(16).padStart(2,"0")} 30%, #B0DEFF${Math.round(d.opacity*200).toString(16).padStart(2,"0")} 70%, transparent)`,
            animation:`rainFall ${d.dur}s ${d.delay}s linear infinite`,
            willChange:"transform,opacity",
            backfaceVisibility:"hidden",
          }}/>
        ))}
      </div>

      {/* Ground splash zone — subtle reflected glow at bottom */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"18%",
        background:"linear-gradient(to top, #00E5FF06, transparent)"}}/>

      {/* Horizon glow — distant storm light */}
      <div style={{position:"fixed",bottom:"8%",left:"-10%",right:"-10%",height:100,
        background:"radial-gradient(ellipse at 50% 100%, #102040 0%, transparent 60%)",
        animation:"neonPulseB 12s ease-in-out infinite"}}/>

      {/* Top darkening — storm ceiling */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:"15%",
        background:"linear-gradient(to bottom, #02040A, transparent)"}}/>

      {/* Bottom ground fade */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:"25%",
        background:"linear-gradient(to top, #04060E 15%, transparent)"}}/>
    </div>
  );
}
