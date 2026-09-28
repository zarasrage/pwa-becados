import { useEffect, useState } from "react";
import { getSeminarioBecadosUNAB } from "../lib/supabaseApi.js";
import { getArtroRegistros } from "../lib/supabaseApi.js";

// Paleta de acentos para que cada tarjeta se vea distinta
const TONOS = [
  "#4F6EFF", "#E8186A", "#13C045", "#F59E0B", "#8B73FF",
  "#06B6D4", "#FB923C", "#EF4444", "#14B8A6", "#A855F7",
  "#22C55E", "#0EA5E9", "#F472B6", "#EAB308", "#6366F1",
];

function fmt(ms) {
  const t = Math.max(0, Math.floor(ms));
  return `${String(Math.floor(t/60000)).padStart(2,"0")}:${String(Math.floor((t%60000)/1000)).padStart(2,"0")}`;
}

// Selección de becado para entrar al registro de artroscopía (solo UNAB).
// Muestra de paso cuántos tiempos lleva cada uno y su mejor marca.
export function ArtroBecados({ onPick, onBack, T }) {
  const [becados, setBecados] = useState([]);
  const [resumen, setResumen] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([getSeminarioBecadosUNAB(), getArtroRegistros()])
      .then(([bs, regs]) => {
        setBecados(bs.map(b => b.nombre));
        const acc = {};
        for (const r of regs) {
          const a = acc[r.becado] || (acc[r.becado] = { n: 0, mejor: null });
          a.n++;
          if (a.mejor === null || r.ms < a.mejor) a.mejor = r.ms;
        }
        setResumen(acc);
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40,position:"relative",zIndex:1}}>
      <div style={{position:"fixed",top:-80,left:-60,width:260,height:260,borderRadius:"50%",background:`${T.accent}14`,filter:"blur(60px)",pointerEvents:"none",zIndex:0}}/>

      <div style={{padding:"calc(var(--sat) + 14px) 60px 0 16px",display:"flex",alignItems:"center",gap:9,marginBottom:6,position:"relative",zIndex:1}}>
        <button className="press" onClick={onBack}
          style={{width:32,height:32,borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase"}}>
          Artro
        </div>
      </div>

      <div style={{padding:"0 16px 18px",position:"relative",zIndex:1}}>
        <div className="anim" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:800,color:T.text,lineHeight:1.1}}>
          Registro de tiempos
        </div>
        <div className="anim" style={{fontSize:13,color:T.muted,marginTop:3}}>
          Elige un becado para ver o cargar sus tiempos
        </div>
      </div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        {cargando ? (
          <div style={{textAlign:"center",padding:50,color:T.muted,fontSize:13}}>Cargando…</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {becados.map((n, i) => {
              const c = TONOS[i % TONOS.length];
              const r = resumen[n];
              return (
                <button key={n} className="press anim" onClick={() => onPick(n)}
                  style={{
                    animationDelay:`${i*28}ms`,
                    position:"relative",overflow:"hidden",
                    display:"flex",alignItems:"center",gap:13,
                    background:T.surface,
                    border:`1px solid ${T.border}`,
                    borderRadius:16,padding:"13px 14px",cursor:"pointer",textAlign:"left",
                    fontFamily:"'Inter',sans-serif",
                  }}>
                  {/* franja de color a la izquierda */}
                  <span style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:c}}/>
                  <span style={{
                    width:42,height:42,borderRadius:13,flexShrink:0,marginLeft:4,
                    background:`linear-gradient(135deg, ${c}28 0%, ${c}10 100%)`,
                    color:c,fontWeight:800,fontSize:17,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                  }}>
                    {n.charAt(0).toUpperCase()}
                  </span>
                  <span style={{flex:1,minWidth:0}}>
                    <span style={{
                      display:"block",fontSize:15,fontWeight:700,color:T.text,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      fontFamily:"'Bricolage Grotesque',sans-serif",
                    }}>
                      {n}
                    </span>
                    <span style={{fontSize:11.5,color:T.muted}}>
                      {r ? `${r.n} ${r.n === 1 ? "tiempo" : "tiempos"} · mejor ${fmt(r.mejor)}` : "sin tiempos aún"}
                    </span>
                  </span>
                  <span style={{fontSize:15,color:c,flexShrink:0,opacity:0.8}}>›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
