// Cerulean Noon — cielo mediterráneo vivo, nubes que cruzan, pájaros que vuelan
export function CieloEffect() {
  // Grupos de nubes que se desplazan horizontalmente
  const cloudLayers = [
    // capa 1 — nubes grandes, fondo
    { clouds:[
      {x:"-12%",y:"1%", w:310,h:115},
      {x:"12%", y:"-2%",w:240,h:100},
      {x:"26%", y:"3%", w:175,h:82},
      {x:"36%", y:"7%", w:120,h:66},
    ], dur:70, delay:0,   dir:"cloudDrift1", op:0.60},
    { clouds:[
      {x:"54%", y:"0%", w:260,h:98},
      {x:"70%", y:"-1%",w:200,h:88},
      {x:"83%", y:"4%", w:155,h:72},
    ], dur:82, delay:-28, dir:"cloudDrift2", op:0.54},
    // capa 2 — nubes medias
    { clouds:[
      {x:"1%",  y:"17%",w:225,h:82},
      {x:"18%", y:"14%",w:178,h:72},
      {x:"30%", y:"18%",w:135,h:60},
    ], dur:55, delay:-38, dir:"cloudDrift1", op:0.42},
    { clouds:[
      {x:"60%", y:"16%",w:240,h:86},
      {x:"76%", y:"13%",w:188,h:76},
      {x:"89%", y:"17%",w:145,h:64},
    ], dur:68, delay:-16, dir:"cloudDrift2", op:0.38},
    // capa 3 — nubes lejanas
    { clouds:[
      {x:"22%", y:"32%",w:275,h:72},
      {x:"40%", y:"29%",w:210,h:62},
      {x:"55%", y:"33%",w:162,h:56},
    ], dur:90, delay:-52, dir:"cloudDrift1", op:0.24},
    // nube pequeña frontal — más rápida
    { clouds:[
      {x:"3%",  y:"8%", w:155,h:56},
      {x:"18%", y:"6%", w:112,h:50},
    ], dur:42, delay:-20, dir:"cloudDrift2", op:0.48},
  ];

  // Rayos de sol desde arriba-derecha
  const rays = [
    {x:"58%",rot:-5, dur:28,op:0.10},
    {x:"70%",rot: 4, dur:36,op:0.12},
    {x:"80%",rot:12, dur:22,op:0.09},
    {x:"90%",rot:18, dur:44,op:0.07},
  ];

  // Pájaros — se desplazan por el cielo de izquierda a derecha
  const birds = Array.from({length:9},(_,i)=>({
    id:i,
    y:5+i*4.8,
    scale:0.7+i%3*0.25,
    dur:28+i*8, delay:-(i*6.5),
    op:0.35+i%3*0.12,
  }));

  return (
    <>
      <style>{`
        @keyframes birdGlide {
          0%   { transform:translateX(-60px); }
          100% { transform:translateX(115vw); }
        }
        @keyframes skyRay {
          0%,100% { opacity:var(--ro); }
          50%     { opacity:calc(var(--ro)*2.2); }
        }
        @keyframes sunHalo {
          0%,100% { opacity:0.85; transform:scale(1); }
          50%     { opacity:1;    transform:scale(1.07); }
        }
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",contain:"layout style paint"}}>
        {/* cielo mediterráneo — azul vivo y saturado */}
        <div style={{position:"fixed",inset:0,
          background:"linear-gradient(175deg,#48B4E8 0%,#62C6F0 22%,#87D9FF 50%,#AEEAFF 78%,#D4F2FF 100%)"}}/>

        {/* halo solar — arriba derecha */}
        <div style={{position:"fixed",top:"-18%",right:"-8%",
          width:360,height:360,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(255,255,210,0.98) 0%,rgba(255,228,80,0.55) 24%,rgba(14,165,233,0.14) 52%,transparent 70%)",
          animation:"sunHalo 13s ease-in-out infinite"}}/>

        {/* corona solar */}
        <div style={{position:"fixed",top:"-30%",right:"-18%",
          width:560,height:560,borderRadius:"50%",
          background:"radial-gradient(circle,transparent 36%,rgba(255,200,60,0.10) 50%,transparent 65%)",
          animation:"sunHalo 18s -5s ease-in-out infinite"}}/>

        {/* brillo en la parte alta */}
        <div style={{position:"fixed",top:0,left:0,right:0,height:"38%",
          background:"linear-gradient(to bottom,rgba(255,255,255,0.28),transparent)"}}/>

        {/* nubes esponjosas multicapa que se desplazan */}
        {cloudLayers.map((g,gi)=>(
          <div key={gi} style={{
            position:"absolute",inset:0,
            animation:`${g.dir} ${g.dur}s ${g.delay}s ease-in-out infinite alternate`,
          }}>
            {g.clouds.map((p,pi)=>(
              <div key={pi} style={{
                position:"absolute",left:p.x,top:p.y,width:p.w,height:p.h,
                background:`radial-gradient(ellipse,rgba(255,255,255,${g.op}) 0%,rgba(220,242,255,${g.op*0.55}) 46%,transparent 74%)`,
                borderRadius:"50%",
              }}/>
            ))}
          </div>
        ))}

        {/* rayos de sol suaves */}
        {rays.map((r,i)=>(
          <div key={i} style={{
            "--ro":r.op,
            position:"absolute",top:"-6%",left:r.x,
            width:100,height:"94%",
            background:`linear-gradient(180deg,rgba(255,252,180,${r.op*2.2}) 0%,rgba(14,165,233,${r.op}) 40%,transparent 75%)`,
            transform:`rotate(${r.rot}deg)`,transformOrigin:"top center",
            animation:`skyRay ${r.dur}s ${-i*7}s ease-in-out infinite`,
          }}/>
        ))}

        {/* pájaros — V shapes cruzando el cielo */}
        {birds.map(b=>(
          <div key={b.id} style={{
            position:"absolute",
            top:`${b.y}%`, left:0,
            width:22*b.scale, height:10*b.scale,
            opacity:b.op,
            animation:`birdGlide ${b.dur}s ${b.delay}s linear infinite`,
          }}>
            {/* ala izquierda */}
            <div style={{
              position:"absolute",
              right:"50%",bottom:0,
              width:12*b.scale,height:2*b.scale,
              background:"rgba(24,58,100,0.55)",
              transform:"rotate(-22deg)",transformOrigin:"right bottom",
              borderRadius:2,
            }}/>
            {/* ala derecha */}
            <div style={{
              position:"absolute",
              left:"50%",bottom:0,
              width:12*b.scale,height:2*b.scale,
              background:"rgba(24,58,100,0.55)",
              transform:"rotate(22deg)",transformOrigin:"left bottom",
              borderRadius:2,
            }}/>
          </div>
        ))}

        {/* reflejo suave abajo */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,height:"22%",
          background:"linear-gradient(to top,rgba(180,228,255,0.22),transparent)"}}/>
      </div>
    </>
  );
}
