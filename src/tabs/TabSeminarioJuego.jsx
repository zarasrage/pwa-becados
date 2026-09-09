import { useEffect, useState } from "react";
import {
  SEMINARIO_MODERADOR,
  getSeminarioBecadosUNAB,
  getOrAssignSeminarioNumero,
  getSeminarioRanking,
  getSeminarioPuntosPorBecado,
  addSeminarioPuntos,
} from "../lib/supabaseApi.js";

const PIN_MODERADOR = "0001";

// ── Selección de quién eres (15 becados UNAB) ───────────────────────────────
function SelectBecadoJuego({ becados, onPick, T }) {
  return (
    <>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>
        ¿Quién eres?
      </div>
      <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Solo becados UNAB</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {becados.map(b => (
          <button key={b.id} className="press" onClick={() => onPick(b)}
            style={{display:"flex",alignItems:"center",gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:11,padding:"10px 10px",cursor:"pointer",textAlign:"left",fontFamily:"'Inter',sans-serif"}}>
            <span style={{width:28,height:28,borderRadius:8,background:`${T.accent}18`,color:T.accent,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {b.nombre.charAt(0).toUpperCase()}
            </span>
            <span style={{fontSize:13.5,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.nombre}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ── PIN para entrar al modo moderador ───────────────────────────────────────
function PinModerador({ onSuccess, onCancel, T }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  function submit() {
    if (pin === PIN_MODERADOR) onSuccess();
    else { setErr(true); setPin(""); }
  }

  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>
        PIN de moderador
      </div>
      <div style={{fontSize:12,color:T.muted,marginBottom:18}}>Ingresa el código para entrar al panel</div>
      <input
        type="password" inputMode="numeric" maxLength={4} value={pin}
        onChange={e => { setErr(false); setPin(e.target.value.replace(/[^0-9]/g,"")); }}
        onKeyDown={e => e.key === "Enter" && submit()}
        style={{width:120,textAlign:"center",fontSize:22,letterSpacing:"0.3em",padding:"10px 0",
          borderRadius:10,border:`1px solid ${err ? "#EF4444" : T.border}`,background:T.surface2,
          color:T.text,outline:"none",marginBottom:14}}
        autoFocus
      />
      {err && <div style={{color:"#EF4444",fontSize:12,marginBottom:10}}>PIN incorrecto</div>}
      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
        <button className="press" onClick={onCancel}
          style={{height:40,padding:"0 16px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,color:T.sub,fontSize:13,fontWeight:600,cursor:"pointer"}}>
          Volver
        </button>
        <button className="press" onClick={submit}
          style={{height:40,padding:"0 20px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          Entrar
        </button>
      </div>
    </div>
  );
}

// ── Panel del moderador: asignar puntos ─────────────────────────────────────
function PanelModerador({ becados, T }) {
  const [puntos, setPuntos] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // becado_id en vuelo

  async function load() {
    setLoading(true);
    setPuntos(await getSeminarioPuntosPorBecado());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function sumar(becadoId, delta) {
    setSaving(becadoId);
    setPuntos(p => ({ ...p, [becadoId]: (p[becadoId] || 0) + delta })); // optimista
    await addSeminarioPuntos(becadoId, delta);
    setSaving(null);
  }

  const participantes = becados.filter(b => b.nombre !== SEMINARIO_MODERADOR);

  return (
    <>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:T.text,marginBottom:2}}>
        Panel de moderador
      </div>
      <div style={{fontSize:12,color:T.muted,marginBottom:16}}>
        +1 respuesta medio correcta · +2 respuesta completamente correcta
      </div>
      {loading ? (
        <div style={{textAlign:"center",padding:30,color:T.muted,fontSize:13}}>Cargando…</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {participantes.map(b => (
            <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:11,padding:"10px 12px"}}>
              <span style={{flex:1,fontSize:13.5,fontWeight:600,color:T.text}}>{b.nombre}</span>
              <span style={{fontSize:13,fontWeight:700,color:T.accent,minWidth:26,textAlign:"center"}}>{puntos[b.id] || 0}</span>
              <button className="press" disabled={saving===b.id} onClick={() => sumar(b.id, 1)}
                style={{width:34,height:34,borderRadius:9,border:`1px solid ${T.accent}50`,background:`${T.accent}15`,color:T.accent,fontWeight:700,fontSize:14,cursor:"pointer"}}>
                +1
              </button>
              <button className="press" disabled={saving===b.id} onClick={() => sumar(b.id, 2)}
                style={{width:34,height:34,borderRadius:9,border:"none",background:T.accent,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                +2
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Vista de participante: número grande + ranking en vivo ──────────────────
function VistaParticipante({ becado, T }) {
  const [numero, setNumero] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  useEffect(() => {
    getOrAssignSeminarioNumero(becado.id).then(setNumero);
  }, [becado.id]);

  async function loadRanking() {
    setLoadingRanking(true);
    setRanking(await getSeminarioRanking());
    setLoadingRanking(false);
  }
  useEffect(() => { loadRanking(); }, []);

  return (
    <>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:8}}>
          Tu número
        </div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:88,fontWeight:800,color:T.accent,lineHeight:1}}>
          {numero ?? "…"}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",color:T.muted,textTransform:"uppercase"}}>
          Ranking
        </div>
        <button className="press" onClick={loadRanking}
          style={{height:28,padding:"0 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,color:T.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>
          ↻ Actualizar
        </button>
      </div>
      {loadingRanking ? (
        <div style={{textAlign:"center",padding:20,color:T.muted,fontSize:13}}>Cargando…</div>
      ) : ranking.length === 0 ? (
        <div style={{textAlign:"center",padding:20,color:T.muted,fontSize:13}}>Todavía no hay puntos</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {ranking.map((r, i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 12px"}}>
              <span style={{fontSize:12,fontWeight:700,color:T.muted,width:18}}>{i+1}</span>
              <span style={{flex:1,fontSize:13.5,fontWeight:600,color:T.text}}>{r.nombre}</span>
              <span style={{fontSize:13,fontWeight:700,color:T.accent}}>{r.puntos}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── TabSeminarioJuego ────────────────────────────────────────────────────────
export function TabSeminarioJuego({ onBack, T }) {
  const [becados, setBecados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("select"); // select | pin | moderador | participante
  const [yo, setYo] = useState(null);

  useEffect(() => {
    getSeminarioBecadosUNAB().then(b => { setBecados(b); setLoading(false); });
  }, []);

  function handlePick(b) {
    setYo(b);
    setStep(b.nombre === SEMINARIO_MODERADOR ? "pin" : "participante");
  }

  function reset() { setYo(null); setStep("select"); }

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40,position:"relative",zIndex:1}}>
      <div style={{padding:"calc(var(--sat) + 14px) 16px 0",display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <button className="press" onClick={step==="select" ? onBack : reset}
          style={{width:30,height:30,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
        <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase"}}>Seminario</div>
      </div>

      <div style={{padding:"0 16px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>Cargando…</div>
        ) : step === "select" ? (
          <SelectBecadoJuego becados={becados} onPick={handlePick} T={T}/>
        ) : step === "pin" ? (
          <PinModerador onSuccess={()=>setStep("moderador")} onCancel={reset} T={T}/>
        ) : step === "moderador" ? (
          <PanelModerador becados={becados} T={T}/>
        ) : (
          <VistaParticipante becado={yo} T={T}/>
        )}
      </div>
    </div>
  );
}
