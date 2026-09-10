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
const MEDALLAS = ["🥇", "🥈", "🥉"];
// Tonos con contraste suficiente tanto en temas claros como oscuros
const MEDALLA_COLOR = ["#E8B008", "#94A3B8", "#C67C3E"];

// Staff que también puede corregir puntaje (sin PIN, solo +1 / -1)
const SEMINARIO_STAFF = ["Innocenti", "Valiente", "C. Rojas", "Koch", "Popin", "Tommy"];
const STAFF_COLOR = "#14B8A6";

// ── Selección de quién eres (15 becados UNAB + staff) ───────────────────────
function SelectBecadoJuego({ becados, onPick, T }) {
  return (
    <>
      <div className="anim" style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:44,lineHeight:1,marginBottom:8}}>🎯</div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:24,fontWeight:800,color:T.text,lineHeight:1.1}}>
          Seminario
        </div>
        <div style={{fontSize:12.5,color:T.muted,marginTop:4}}>Elige quién eres para entrar</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {becados.map((b, i) => {
          const esMod = b.nombre === SEMINARIO_MODERADOR;
          const ac = esMod ? MEDALLA_COLOR[0] : T.accent;
          return (
            <button key={b.id} className="press anim" onClick={() => onPick(b)}
              style={{
                animationDelay:`${i*22}ms`,
                position:"relative",
                display:"flex",alignItems:"center",gap:9,
                background: esMod ? `linear-gradient(135deg, ${ac}20 0%, ${ac}08 100%)` : T.surface,
                border:`1.5px solid ${esMod ? ac+"60" : T.border}`,
                borderRadius:14,padding:"11px 11px",cursor:"pointer",textAlign:"left",
                fontFamily:"'Inter',sans-serif",minWidth:0,overflow:"hidden",
                boxShadow: esMod ? `0 0 18px ${ac}22` : "none",
              }}>
              <span style={{
                width:32,height:32,borderRadius:10,flexShrink:0,
                background:`${ac}1E`,color:ac,fontWeight:800,fontSize:14,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Bricolage Grotesque',sans-serif",
              }}>
                {esMod ? "★" : b.nombre.charAt(0).toUpperCase()}
              </span>
              <span style={{minWidth:0,flex:1}}>
                <span style={{display:"block",fontSize:13.5,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {b.nombre}
                </span>
                {esMod && (
                  <span style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.06em",color:ac,textTransform:"uppercase",marginTop:1}}>
                    Moderador
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Staff */}
      <div className="anim" style={{marginTop:18,animationDelay:"340ms"}}>
        <div style={{
          display:"flex",alignItems:"center",gap:6,marginBottom:8,
          fontSize:11.5,fontWeight:700,letterSpacing:"0.1em",
          color:STAFF_COLOR,textTransform:"uppercase",
        }}>
          <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:STAFF_COLOR}}/>
          Staff
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {SEMINARIO_STAFF.map((nombre, i) => (
            <button key={nombre} className="press anim" onClick={() => onPick({ nombre, esStaff:true })}
              style={{
                animationDelay:`${360 + i*22}ms`,
                display:"flex",alignItems:"center",gap:9,
                background:`linear-gradient(135deg, ${STAFF_COLOR}18 0%, ${STAFF_COLOR}06 100%)`,
                border:`1.5px solid ${STAFF_COLOR}55`,
                borderRadius:14,padding:"11px 11px",cursor:"pointer",textAlign:"left",
                fontFamily:"'Inter',sans-serif",minWidth:0,overflow:"hidden",
              }}>
              <span style={{
                width:32,height:32,borderRadius:10,flexShrink:0,
                background:`${STAFF_COLOR}1E`,color:STAFF_COLOR,fontWeight:800,fontSize:15,
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                🩺
              </span>
              <span style={{
                minWidth:0,flex:1,fontSize:13.5,fontWeight:600,color:T.text,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              }}>
                {nombre}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── PIN para entrar al modo moderador ───────────────────────────────────────
function PinModerador({ onSuccess, onCancel, T }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  function tecla(k) {
    if (k === "⌫") { setErr(false); setPin(p => p.slice(0,-1)); return; }
    if (k === "" || pin.length >= 4) return;
    setErr(false);
    const next = pin + String(k);
    setPin(next);
    if (next.length === 4) {
      if (next === PIN_MODERADOR) setTimeout(onSuccess, 120);
      else setTimeout(() => { setErr(true); setPin(""); }, 120);
    }
  }

  return (
    <div className="anim" style={{textAlign:"center",paddingTop:8}}>
      <div style={{fontSize:38,lineHeight:1,marginBottom:10}}>🔒</div>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>
        Panel de moderador
      </div>
      <div style={{fontSize:12,color:T.muted,marginBottom:22}}>Ingresa tu código de acceso</div>

      <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:8}}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:44,height:52,borderRadius:12,
            border:`2px solid ${err ? "#EF4444" : pin.length > i ? T.accent : T.border}`,
            background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:20,fontWeight:800,color:T.text,
            transition:"border-color 0.15s",
            boxShadow: pin.length > i && !err ? `0 0 12px ${T.accent}25` : "none",
          }}>
            {pin[i] ? "●" : ""}
          </div>
        ))}
      </div>
      <div style={{height:18,marginBottom:8}}>
        {err && <span style={{color:"#EF4444",fontSize:12,fontWeight:600}}>PIN incorrecto</span>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:260,margin:"0 auto 16px"}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i) => (
          <button key={i} className="press" disabled={k===""} onClick={() => tecla(k)}
            style={{
              height:52,borderRadius:12,
              border:`1px solid ${k==="" ? "transparent" : T.border}`,
              background: k==="" ? "transparent" : T.surface,
              fontSize:19,fontWeight:600,
              color: k==="⌫" ? T.muted : T.text,
              cursor: k==="" ? "default" : "pointer",
              fontFamily:"'Bricolage Grotesque',sans-serif",
            }}>
            {k}
          </button>
        ))}
      </div>

      <button className="press" onClick={onCancel}
        style={{fontSize:12,fontWeight:600,color:T.muted,background:"none",
          border:`1px solid ${T.border}`,borderRadius:99,padding:"7px 18px",cursor:"pointer"}}>
        Volver
      </button>
    </div>
  );
}

// ── Panel para asignar puntos ────────────────────────────────────────────────
// modo "moderador": -2/-1/+1/+2 · modo "staff": solo -1/+1
function PanelModerador({ becados, T, modo = "moderador", nombreStaff }) {
  const esStaff = modo === "staff";
  const [puntos, setPuntos] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [flash, setFlash] = useState(null); // { id, delta }

  async function load() {
    setLoading(true);
    setPuntos(await getSeminarioPuntosPorBecado());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function sumar(becadoId, delta) {
    setSaving(becadoId);
    setFlash({ id: becadoId, delta });
    setTimeout(() => setFlash(f => (f && f.id === becadoId ? null : f)), 650);
    setPuntos(p => ({ ...p, [becadoId]: Math.max(0, (p[becadoId] || 0) + delta) }));
    await addSeminarioPuntos(becadoId, delta);
    setSaving(null);
  }

  const participantes = becados
    .filter(b => b.nombre !== SEMINARIO_MODERADOR)
    .map(b => ({ ...b, pts: puntos[b.id] || 0 }))
    .sort((a,b) => b.pts - a.pts || a.nombre.localeCompare(b.nombre));

  const maxPts = Math.max(1, ...participantes.map(p => p.pts));

  const ac = esStaff ? STAFF_COLOR : T.accent;

  const Btn = ({ onClick, label, tone }) => {
    const rojo = tone === "menos";
    // El botón "principal" va sólido: +2 para el moderador, +1 para staff
    const solido = label === (esStaff ? "+1" : "+2");
    return (
      <button className="press" onClick={onClick}
        style={{
          width: esStaff ? 40 : 32,height:32,borderRadius:10,flexShrink:0,
          border: solido ? "none" : `1px solid ${rojo ? "#EF444455" : ac+"55"}`,
          background: solido ? ac : rojo ? "#EF444416" : `${ac}16`,
          color: solido ? "#fff" : rojo ? "#EF4444" : ac,
          fontWeight:800,fontSize:12.5,cursor:"pointer",
          fontFamily:"'Bricolage Grotesque',sans-serif",
        }}>
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="anim" style={{
        background:`linear-gradient(135deg, ${ac}18 0%, ${ac}06 100%)`,
        border:`1px solid ${ac}35`,borderRadius:16,padding:"14px 16px",marginBottom:16,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <span style={{fontSize:18}}>{esStaff ? "🩺" : "🎛️"}</span>
          <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:T.text}}>
            {esStaff ? nombreStaff : "Panel de moderador"}
          </span>
        </div>
        <div style={{fontSize:11.5,color:T.sub,lineHeight:1.5}}>
          {esStaff ? (
            <><b style={{color:ac}}>+1</b> por buena respuesta · <b style={{color:"#EF4444"}}>−1</b> para corregir</>
          ) : (
            <><b style={{color:ac}}>+1</b> respuesta a medias · <b style={{color:ac}}>+2</b> respuesta completa · <b style={{color:"#EF4444"}}>−</b> para corregir</>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>Cargando…</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {participantes.map((b, i) => {
            const medalla = b.pts > 0 && i < 3 ? MEDALLAS[i] : null;
            const mc = b.pts > 0 && i < 3 ? MEDALLA_COLOR[i] : null;
            const f = flash && flash.id === b.id ? flash : null;
            return (
              <div key={b.id} className="anim" style={{
                animationDelay:`${i*20}ms`,
                position:"relative",overflow:"hidden",
                display:"flex",alignItems:"center",gap:7,
                background:T.surface,
                border:`1px solid ${mc ? mc+"45" : T.border}`,
                borderRadius:13,padding:"9px 11px",
              }}>
                {/* barra de progreso de fondo */}
                <div style={{
                  position:"absolute",left:0,top:0,bottom:0,
                  width:`${(b.pts / maxPts) * 100}%`,
                  background:`linear-gradient(90deg, ${mc || ac}14, transparent)`,
                  pointerEvents:"none",transition:"width 0.35s ease",
                }}/>
                <span style={{
                  width:22,textAlign:"center",fontSize:13,flexShrink:0,
                  fontWeight:800,color:mc || T.muted,
                  fontFamily:"'Bricolage Grotesque',sans-serif",zIndex:1,
                }}>
                  {medalla || i+1}
                </span>
                <span style={{
                  flex:1,minWidth:0,fontSize:13.5,fontWeight:600,color:T.text,zIndex:1,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                }}>
                  {b.nombre}
                </span>
                <span style={{position:"relative",zIndex:1,flexShrink:0,minWidth:30,textAlign:"center"}}>
                  <span style={{
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                    fontSize:17,fontWeight:800,color: b.pts > 0 ? (mc || ac) : T.muted,
                  }}>
                    {b.pts}
                  </span>
                  {f && (
                    <span style={{
                      position:"absolute",left:"50%",top:-14,transform:"translateX(-50%)",
                      fontSize:12,fontWeight:800,whiteSpace:"nowrap",
                      color: f.delta > 0 ? "#22C55E" : "#EF4444",
                      animation:"fadeUp 0.3s ease both",
                    }}>
                      {f.delta > 0 ? `+${f.delta}` : f.delta}
                    </span>
                  )}
                </span>
                <span style={{display:"flex",gap:4,zIndex:1,flexShrink:0}}>
                  {!esStaff && <Btn onClick={() => sumar(b.id,-2)} label="−2" tone="menos"/>}
                  <Btn onClick={() => sumar(b.id,-1)} label="−1" tone="menos"/>
                  <Btn onClick={() => sumar(b.id, 1)} label="+1" tone="mas"/>
                  {!esStaff && <Btn onClick={() => sumar(b.id, 2)} label="+2" tone="mas"/>}
                </span>
              </div>
            );
          })}
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

  const conPuntos = ranking.filter(r => r.puntos > 0);
  const podio = conPuntos.slice(0,3);
  const resto = conPuntos.slice(3);
  const miPuesto = conPuntos.findIndex(r => r.nombre === becado.nombre);

  return (
    <>
      {/* Número gigante */}
      <div className="anim" style={{
        position:"relative",textAlign:"center",
        background:`linear-gradient(160deg, ${T.accent}16 0%, ${T.accent}04 60%, transparent 100%)`,
        border:`1px solid ${T.accent}30`,borderRadius:22,
        padding:"26px 16px 30px",marginBottom:22,overflow:"hidden",
      }}>
        <div style={{
          position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          width:200,height:200,borderRadius:"50%",
          background:`${T.accent}22`,filter:"blur(46px)",pointerEvents:"none",
        }}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.16em",color:T.accent,textTransform:"uppercase",marginBottom:2}}>
            Tu número
          </div>
          <div style={{fontSize:12.5,color:T.muted,marginBottom:6}}>{becado.nombre}</div>
          <div style={{
            fontFamily:"'Bricolage Grotesque',sans-serif",
            fontSize:110,fontWeight:800,lineHeight:1,
            color:T.accent,
            textShadow:`0 0 40px ${T.accent}70, 0 0 14px ${T.accent}50`,
            animation: numero != null ? "fadeUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
          }}>
            {numero ?? "·"}
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:15}}>🏆</span>
          <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,fontWeight:800,color:T.text}}>
            Ranking
          </span>
          {miPuesto >= 0 && (
            <span style={{
              fontSize:10.5,fontWeight:700,color:T.accent,background:`${T.accent}18`,
              border:`1px solid ${T.accent}35`,borderRadius:99,padding:"2px 8px",
            }}>
              vas #{miPuesto+1}
            </span>
          )}
        </div>
        <button className="press" onClick={loadRanking} disabled={loadingRanking}
          style={{
            display:"flex",alignItems:"center",gap:5,height:30,padding:"0 11px",borderRadius:99,
            border:`1px solid ${T.border}`,background:T.surface2,color:T.sub,
            fontSize:12,fontWeight:600,cursor:"pointer",
          }}>
          <span style={{display:"inline-block",animation: loadingRanking ? "spin 0.7s linear infinite" : "none"}}>↻</span>
          Actualizar
        </button>
      </div>

      {loadingRanking && conPuntos.length === 0 ? (
        <div style={{textAlign:"center",padding:28,color:T.muted,fontSize:13}}>Cargando…</div>
      ) : conPuntos.length === 0 ? (
        <div style={{
          textAlign:"center",padding:"34px 16px",background:T.surface,
          border:`1px dashed ${T.border}`,borderRadius:14,
        }}>
          <div style={{fontSize:30,marginBottom:8,opacity:0.35}}>🎲</div>
          <div style={{fontSize:13,color:T.muted}}>Todavía nadie tiene puntos</div>
        </div>
      ) : (
        <>
          {/* Podio */}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:resto.length?10:0}}>
            {podio.map((r, i) => {
              const mc = MEDALLA_COLOR[i];
              const yo = r.nombre === becado.nombre;
              return (
                <div key={r.nombre} className="anim" style={{
                  animationDelay:`${i*45}ms`,
                  display:"flex",alignItems:"center",gap:11,
                  background: yo ? `linear-gradient(135deg, ${mc}1E 0%, ${mc}08 100%)` : T.surface,
                  border:`1.5px solid ${mc}${yo ? "70" : "40"}`,
                  borderRadius:15,padding: i===0 ? "14px 14px" : "11px 14px",
                  boxShadow:`0 0 ${i===0?20:10}px ${mc}1E`,
                }}>
                  <span style={{fontSize: i===0 ? 26 : 21,lineHeight:1,flexShrink:0}}>{MEDALLAS[i]}</span>
                  <span style={{flex:1,minWidth:0}}>
                    <span style={{
                      display:"block",fontSize: i===0 ? 16 : 14.5,fontWeight:700,color:T.text,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      fontFamily:"'Bricolage Grotesque',sans-serif",
                    }}>
                      {r.nombre}
                    </span>
                    {yo && <span style={{fontSize:10,fontWeight:700,color:mc,letterSpacing:"0.06em"}}>TÚ</span>}
                  </span>
                  <span style={{
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                    fontSize: i===0 ? 26 : 21,fontWeight:800,color:mc,flexShrink:0,
                  }}>
                    {r.puntos}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Resto */}
          {resto.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {resto.map((r, i) => {
                const yo = r.nombre === becado.nombre;
                return (
                  <div key={r.nombre} className="anim" style={{
                    animationDelay:`${(i+3)*35}ms`,
                    display:"flex",alignItems:"center",gap:10,
                    background: yo ? `${T.accent}12` : T.surface,
                    border:`1px solid ${yo ? T.accent+"45" : T.border}`,
                    borderRadius:11,padding:"8px 13px",
                  }}>
                    <span style={{fontSize:12,fontWeight:800,color:T.muted,width:18,fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                      {i+4}
                    </span>
                    <span style={{
                      flex:1,minWidth:0,fontSize:13.5,fontWeight:600,
                      color: yo ? T.accent : T.text,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    }}>
                      {r.nombre}{yo && " · tú"}
                    </span>
                    <span style={{fontSize:14,fontWeight:800,color: yo ? T.accent : T.sub,fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                      {r.puntos}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
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
    // Staff entra directo (sin PIN); el moderador pide PIN; el resto es participante
    if (b.esStaff) setStep("staff");
    else setStep(b.nombre === SEMINARIO_MODERADOR ? "pin" : "participante");
  }

  function reset() { setYo(null); setStep("select"); }

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40,position:"relative",zIndex:1}}>
      <div style={{position:"fixed",top:-70,right:-70,width:240,height:240,borderRadius:"50%",background:`${T.accent}0C`,filter:"blur(56px)",pointerEvents:"none",zIndex:0}}/>

      <div style={{padding:"calc(var(--sat) + 14px) 16px 0",display:"flex",alignItems:"center",gap:9,marginBottom:18,position:"relative",zIndex:1}}>
        <button className="press" onClick={step==="select" ? onBack : reset}
          style={{width:32,height:32,borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase"}}>
          Seminario
        </div>
      </div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        {loading ? (
          <div style={{textAlign:"center",padding:50,color:T.muted,fontSize:13}}>Cargando…</div>
        ) : step === "select" ? (
          <SelectBecadoJuego becados={becados} onPick={handlePick} T={T}/>
        ) : step === "pin" ? (
          <PinModerador onSuccess={()=>setStep("moderador")} onCancel={reset} T={T}/>
        ) : step === "moderador" ? (
          <PanelModerador becados={becados} T={T}/>
        ) : step === "staff" ? (
          <PanelModerador becados={becados} T={T} modo="staff" nombreStaff={yo?.nombre}/>
        ) : (
          <VistaParticipante becado={yo} T={T}/>
        )}
      </div>
    </div>
  );
}
