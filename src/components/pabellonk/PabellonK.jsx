import { useEffect, useState } from "react";
import { todayISO } from "../../utils/dates.js";
import { getPabellonK, dispararPabellonK } from "../../lib/supabaseApi.js";

function horaDe(ts) {
  try {
    return new Date(ts).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

// Llamado de Pabellón K: un botón rojo a pantalla completa que solo se puede
// apretar una vez al día — y una vez que alguien lo aprieta, queda bloqueado
// para todos hasta el día siguiente.
export function PabellonK({ becado, onBack, T }) {
  const hoy = todayISO();
  const [reg, setReg]         = useState(null);   // { fecha, por, ts } del llamado de hoy
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [perdido, setPerdido]   = useState(false); // alguien se adelantó al apretar

  useEffect(() => {
    let vivo = true;
    getPabellonK()
      .then(r => { if (vivo) setReg(r?.fecha === hoy ? r : null); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [hoy]);

  const usado = !!reg;
  const fueMio = reg?.por === becado;

  const apretar = async () => {
    if (usado || enviando) return;
    setEnviando(true);
    const { ok, reg: actual } = await dispararPabellonK(becado, hoy);
    if (actual?.fecha === hoy) setReg(actual);
    setPerdido(!ok);
    setEnviando(false);
    if (ok && navigator.vibrate) navigator.vibrate([40, 60, 120]);
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:300,
      background:T.bg,maxWidth:480,margin:"0 auto",
      display:"flex",flexDirection:"column",
      fontFamily:"'Inter',sans-serif",
    }}>
      <div style={{padding:"calc(var(--sat) + 14px) 16px 0",flexShrink:0}}>
        <button className="press" onClick={onBack} aria-label="Volver"
          style={{width:32,height:32,borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub}}>‹</button>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"14px 16px calc(var(--sab) + 22px)",minHeight:0}}>
        <button
          onClick={apretar}
          disabled={usado || enviando || cargando}
          style={{
            flex:1,width:"100%",border:"none",borderRadius:26,
            background: usado
              ? "linear-gradient(160deg,#6B7280 0%,#4B5563 100%)"
              : "linear-gradient(160deg,#FF2D2D 0%,#C81E1E 100%)",
            boxShadow: usado ? "none" : "0 14px 40px rgba(200,30,30,0.45)",
            color:"#fff",cursor: usado ? "default" : "pointer",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,
            padding:20,transition:"transform 0.1s ease, background 0.25s ease",
            opacity: cargando ? 0.6 : 1,
          }}
          onPointerDown={e => { if (!usado && !enviando) e.currentTarget.style.transform = "scale(0.97)"; }}
          onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{
            fontFamily:"'Bricolage Grotesque',sans-serif",
            fontSize:52,fontWeight:800,lineHeight:0.95,letterSpacing:"-0.02em",textAlign:"center",
          }}>
            PABELLON<br/>K
          </span>
          <span style={{fontSize:13,fontWeight:600,opacity:0.85}}>
            {cargando ? "Cargando…" : enviando ? "Llamando…" : usado ? "Ya se usó hoy" : "Toca para llamar"}
          </span>
        </button>

        <div style={{marginTop:16,textAlign:"center"}}>
          {usado ? (
            <div style={{fontSize:13.5,color:T.sub,lineHeight:1.5}}>
              {perdido && !fueMio && (
                <div style={{fontWeight:700,color:"#F87171",marginBottom:4}}>Alguien se te adelantó.</div>
              )}
              <strong style={{color:T.text}}>{fueMio ? "Tú" : reg.por}</strong>
              {" "}llamó a Pabellón K hoy{reg.ts ? ` a las ${horaDe(reg.ts)}` : ""}.
              <div style={{fontSize:12,color:T.muted,marginTop:4}}>Se vuelve a habilitar mañana.</div>
            </div>
          ) : (
            <div style={{fontSize:13,color:T.muted,lineHeight:1.5}}>
              Solo se puede apretar <strong style={{color:T.sub}}>una vez al día para todos</strong>.
              <div style={{fontSize:12,marginTop:4}}>Úsalo con moderación.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
