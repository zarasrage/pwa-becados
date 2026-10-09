import { useCallback, useEffect, useState } from "react";
import { todayISO } from "../../utils/dates.js";
import { getPabellonK, dispararPabellonK, responderPabellonK } from "../../lib/supabaseApi.js";

function horaDe(ts) {
  try {
    return new Date(ts).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

const VERDE = "#13C045";
const ROJO  = "#EF4444";

function Cabecera({ onBack, T }) {
  return (
    <div style={{padding:"calc(var(--sat) + 14px) 16px 0",flexShrink:0}}>
      <button className="press" onClick={onBack} aria-label="Volver"
        style={{width:32,height:32,borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub}}>‹</button>
    </div>
  );
}

function Grupo({ titulo, nombres, color, T }) {
  return (
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:6}}>
        <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:800,color}}>
          {nombres.length}
        </span>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:T.muted,textTransform:"uppercase"}}>
          {titulo}
        </span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        {nombres.length === 0
          ? <span style={{fontSize:12,color:T.muted}}>—</span>
          : nombres.map(n => (
              <span key={n} style={{fontSize:11.5,fontWeight:600,color,background:`${color}14`,
                border:`1px solid ${color}35`,borderRadius:99,padding:"2px 8px"}}>{n}</span>
            ))}
      </div>
    </div>
  );
}

// Quién va, quién no y quién todavía no contesta.
function Resultado({ reg, T }) {
  const r = reg.respuestas || {};
  const van = Object.keys(r).filter(n => r[n] === "voy").sort();
  const no  = Object.keys(r).filter(n => r[n] === "no").sort();
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 15px"}}>
      <div style={{display:"flex",gap:14}}>
        <Grupo titulo="van" nombres={van} color={VERDE} T={T}/>
        <Grupo titulo="no van" nombres={no} color={ROJO} T={T}/>
      </div>
    </div>
  );
}

// Llamado de Pabellón K. Solo se puede apretar una vez al día para todos; quien
// lo recibe contesta "voy" o "no voy" desde acá, porque iPhone no muestra los
// botones de respuesta dentro de la notificación.
export function PabellonK({ becado, onBack, T }) {
  const hoy = todayISO();
  const [reg, setReg]           = useState(null);  // { fecha, por, ts, respuestas } de hoy
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [perdido, setPerdido]   = useState(false); // alguien se adelantó al llamar
  const [fallo, setFallo]       = useState("");

  const refrescar = useCallback(async () => {
    const r = await getPabellonK();
    setReg(r?.fecha === hoy ? r : null);
  }, [hoy]);

  useEffect(() => {
    let vivo = true;
    getPabellonK()
      .then(r => { if (vivo) setReg(r?.fecha === hoy ? r : null); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [hoy]);

  const usado    = !!reg;
  const fueMio   = reg?.por === becado;
  const miRpta   = reg?.respuestas?.[becado] || null;

  // El llamado se dispara en el servidor: ahí se aplica el candado del día y se
  // mandan las notificaciones. Si las claves de push todavía no están puestas,
  // se cae al camino directo contra Supabase: el candado igual funciona, pero
  // sin aviso al resto.
  const llamar = async () => {
    try {
      const r = await fetch("/.netlify/functions/pabellon-k", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ becado, hoy }),
      });
      if (r.ok) {
        const d = await r.json();
        if (typeof d.ok === "boolean") return d;
      }
    } catch { /* sin red o función caída */ }
    return await dispararPabellonK(becado, hoy);
  };

  const apretar = async () => {
    if (usado || enviando) return;
    setEnviando(true);
    const { ok, reg: actual } = await llamar();
    if (actual?.fecha === hoy) setReg(actual);
    setPerdido(!ok);
    setEnviando(false);
    if (ok && navigator.vibrate) navigator.vibrate([40, 60, 120]);
  };

  const responder = async (respuesta) => {
    if (enviando) return;
    setEnviando(true); setFallo("");
    const actual = await responderPabellonK(becado, hoy, respuesta);
    if (actual) setReg(actual);
    else { setFallo("No se pudo guardar tu respuesta. Inténtalo de nuevo."); await refrescar(); }
    setEnviando(false);
  };

  const marco = {
    position:"fixed",inset:0,zIndex:300,background:T.bg,maxWidth:480,margin:"0 auto",
    display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif",
  };

  // ── Hay llamado y no es mío: contestar ────────────────────────────────────
  if (usado && !fueMio) {
    return (
      <div style={marco}>
        <Cabecera onBack={onBack} T={T}/>
        <div style={{flex:1,overflowY:"auto",padding:"10px 16px calc(var(--sab) + 22px)",
          display:"flex",flexDirection:"column",gap:14}}>

          <div style={{textAlign:"center",paddingTop:6}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:ROJO,textTransform:"uppercase"}}>
              Llamado a Pabellón K
            </div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:25,fontWeight:800,color:T.text,marginTop:4,lineHeight:1.15}}>
              {reg.por} está llamando
            </div>
            {reg.ts && <div style={{fontSize:12.5,color:T.muted,marginTop:3}}>a las {horaDe(reg.ts)}</div>}
          </div>

          <div style={{display:"flex",gap:10}}>
            {[
              { id:"voy", texto:"VOY",    color:VERDE },
              { id:"no",  texto:"NO VOY", color:ROJO  },
            ].map(b => {
              const elegido = miRpta === b.id;
              return (
                <button key={b.id} className="press" onClick={() => responder(b.id)} disabled={enviando}
                  style={{
                    flex:1,minHeight:120,borderRadius:20,cursor:enviando?"wait":"pointer",
                    border: elegido ? "none" : `2px solid ${b.color}55`,
                    background: elegido ? `linear-gradient(160deg, ${b.color} 0%, ${b.color}CC 100%)` : `${b.color}0E`,
                    boxShadow: elegido ? `0 8px 24px ${b.color}55` : "none",
                    color: elegido ? "#fff" : b.color,
                    fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:800,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,
                    opacity: enviando ? 0.7 : 1,transition:"background 0.18s, box-shadow 0.18s",
                  }}>
                  {b.texto}
                  {elegido && <span style={{fontSize:11,fontWeight:700,opacity:0.9}}>tu respuesta</span>}
                </button>
              );
            })}
          </div>

          {fallo && (
            <div style={{fontSize:12,color:ROJO,textAlign:"center"}}>{fallo}</div>
          )}
          {miRpta && !fallo && (
            <div style={{fontSize:12,color:T.muted,textAlign:"center"}}>
              Puedes cambiar tu respuesta tocando la otra.
            </div>
          )}

          <Resultado reg={reg} T={T}/>
        </div>
      </div>
    );
  }

  // ── Es mi llamado: ver quién contestó ─────────────────────────────────────
  if (usado && fueMio) {
    return (
      <div style={marco}>
        <Cabecera onBack={onBack} T={T}/>
        <div style={{flex:1,overflowY:"auto",padding:"10px 16px calc(var(--sab) + 22px)",
          display:"flex",flexDirection:"column",gap:14}}>
          <div style={{textAlign:"center",paddingTop:6}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase"}}>
              Tu llamado de hoy
            </div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:25,fontWeight:800,color:T.text,marginTop:4}}>
              Pabellón K
            </div>
            {reg.ts && <div style={{fontSize:12.5,color:T.muted,marginTop:3}}>lanzado a las {horaDe(reg.ts)}</div>}
          </div>

          <Resultado reg={reg} T={T}/>

          <button className="press" onClick={refrescar}
            style={{alignSelf:"center",height:34,padding:"0 16px",borderRadius:10,
              border:`1px solid ${T.border}`,background:T.surface2,
              fontSize:12.5,fontWeight:600,color:T.sub,cursor:"pointer"}}>
            ↻ Actualizar
          </button>

          <div style={{fontSize:12,color:T.muted,textAlign:"center",lineHeight:1.5}}>
            Se vuelve a habilitar mañana.
          </div>
        </div>
      </div>
    );
  }

  // ── Todavía no hay llamado: el botón ──────────────────────────────────────
  return (
    <div style={marco}>
      <Cabecera onBack={onBack} T={T}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:"14px 16px calc(var(--sab) + 22px)",minHeight:0}}>
        <button
          onClick={apretar}
          disabled={enviando || cargando}
          style={{
            // Disco: ocupa el ancho disponible pero nunca más que el alto, para
            // que siga siendo un círculo en pantallas chicas.
            width:"min(100%, 70vh)",aspectRatio:"1",maxHeight:"100%",
            border:"none",borderRadius:"50%",
            background:"linear-gradient(160deg,#FF2D2D 0%,#C81E1E 100%)",
            boxShadow:"0 14px 40px rgba(200,30,30,0.45)",
            color:"#fff",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,
            padding:20,transition:"transform 0.1s ease",
            opacity: cargando ? 0.6 : 1,
          }}
          onPointerDown={e => { if (!enviando) e.currentTarget.style.transform = "scale(0.97)"; }}
          onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{
            fontFamily:"'Bricolage Grotesque',sans-serif",
            fontSize:44,fontWeight:800,lineHeight:1,letterSpacing:"-0.02em",textAlign:"center",
          }}>
            PABELLON<br/>K
          </span>
          <span style={{fontSize:13,fontWeight:600,opacity:0.85}}>
            {cargando ? "Cargando…" : enviando ? "Llamando…" : "Toca para llamar"}
          </span>
        </button>

        <div style={{marginTop:16,textAlign:"center",fontSize:13,color:T.muted,lineHeight:1.5}}>
          {perdido && <div style={{fontWeight:700,color:ROJO,marginBottom:4}}>Alguien se te adelantó.</div>}
          Solo se puede apretar <strong style={{color:T.sub}}>una vez al día para todos</strong>.
          <div style={{fontSize:12,marginTop:4}}>Úsalo con moderación.</div>
        </div>
      </div>
    </div>
  );
}
