import { useEffect, useRef, useState } from "react";
import { todayISO } from "../utils/dates.js";
import { safeStorage } from "../utils/storage.js";
import { getBecados, getArtroRegistros, addArtroRegistro, deleteArtroRegistro } from "../lib/supabaseApi.js";

// Los ids quedan guardados dentro de cada registro: no cambiarlos a la ligera
// (hoy se pueden cambiar sin migrar porque no hay registros previos).
const TIPOS = [
  { id: "Numeros",   label: "Números",   img: "/artro/numeros.webp" },
  { id: "Lineas",    label: "Líneas",    img: "/artro/lineas.webp" },
  { id: "Laberinto", label: "Laberinto", img: "/artro/laberinto.webp" },
  { id: "Tubos1",    label: "Tubos 1",   img: "/artro/tubos-1.webp" },
  { id: "Tubos2",    label: "Tubos 2",   img: "/artro/tubos-2.webp" },
  { id: "Manguito",  label: "Manguito",  img: "/artro/manguito.webp" },
  { id: "Meniscos",  label: "Meniscos",  img: "/artro/meniscos.webp" },
];

// "Sin tapa" se entrena con la cúpula transparente; "con tapa", con la opaca.
const TAPAS = [
  { conTapa: true,  label: "Con tapa", img: "/artro/tapa-con.webp" },
  { conTapa: false, label: "Sin tapa", img: "/artro/tapa-sin.webp" },
];

// Rangos por universidad (mismo orden por id que usa el resto de la app)
const GRUPOS = [
  { label: "UNAB",   desde: 0,  hasta: 15 },
  { label: "UANDES", desde: 15, hasta: 33 },
  { label: "IST",    desde: 33, hasta: 36 },
];

function fmt(ms) {
  const total = Math.max(0, Math.floor(ms));
  const min = Math.floor(total / 60000);
  const seg = Math.floor((total % 60000) / 1000);
  const cs  = Math.floor((total % 1000) / 10);
  return `${String(min).padStart(2,"0")}:${String(seg).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
}

function fechaCorta(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y, m-1, d).toLocaleDateString("es-CL", { day:"numeric", month:"short" });
}

// Imagen que reintenta sola si la carga falla (señal intermitente) y, si tras
// varios intentos no llega, muestra un recuadro neutro en vez del ícono roto.
const MAX_INTENTOS = 4;
function Foto({ src, alt, style, T }) {
  const [intento, setIntento] = useState(0);
  const [rendido, setRendido] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    // Si cambia la foto, se parte de cero
    setIntento(0); setRendido(false);
    return () => clearTimeout(timer.current);
  }, [src]);

  function alFallar() {
    if (intento >= MAX_INTENTOS) { setRendido(true); return; }
    // Espera creciente; el parámetro evita que reuse la respuesta fallida
    timer.current = setTimeout(() => setIntento(i => i + 1), 500 * (intento + 1));
  }

  if (rendido) {
    return (
      <span aria-label={alt} style={{
        ...style,
        display:"flex",alignItems:"center",justifyContent:"center",
        background:`${T.muted}14`,border:`1px dashed ${T.border}`,borderRadius:9,
        color:T.muted,fontSize:13,boxSizing:"border-box",
      }}>
        ⏱
      </span>
    );
  }

  return (
    <img
      src={intento === 0 ? src : `${src}?r=${intento}`}
      alt={alt}
      onError={alFallar}
      style={style}
    />
  );
}

// ── Selección de quién eres ──────────────────────────────────────────────────
function SelectBecadoArtro({ becados, onPick, T }) {
  return (
    <>
      <div className="anim" style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,lineHeight:1,marginBottom:8}}>⏱️</div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:800,color:T.text,lineHeight:1.1}}>
          ¿Quién eres?
        </div>
        <div style={{fontSize:12.5,color:T.muted,marginTop:4}}>Para registrar tus propios tiempos</div>
      </div>

      {GRUPOS.map(g => {
        const nombres = becados.slice(g.desde, g.hasta);
        if (!nombres.length) return null;
        return (
          <div key={g.label} className="anim" style={{marginBottom:14}}>
            <div style={{
              display:"flex",alignItems:"center",gap:6,marginBottom:7,
              fontSize:11,fontWeight:700,letterSpacing:"0.1em",
              color:T.muted,textTransform:"uppercase",
            }}>
              <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:T.muted}}/>
              {g.label}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {nombres.map(n => (
                <button key={n} className="press" onClick={() => onPick(n)}
                  style={{
                    display:"flex",alignItems:"center",gap:8,
                    background:T.surface,border:`1px solid ${T.border}`,
                    borderRadius:12,padding:"9px 10px",cursor:"pointer",textAlign:"left",
                    fontFamily:"'Inter',sans-serif",minWidth:0,overflow:"hidden",
                  }}>
                  <span style={{
                    width:28,height:28,borderRadius:9,flexShrink:0,
                    background:`${T.accent}18`,color:T.accent,fontWeight:800,fontSize:13,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                  }}>
                    {n.charAt(0).toUpperCase()}
                  </span>
                  <span style={{
                    minWidth:0,flex:1,fontSize:13,fontWeight:500,color:T.text,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                  }}>
                    {n}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function TabArtro({ onBack, T }) {
  const hoy = todayISO();

  // Quién registra (se recuerda entre sesiones)
  const [becados, setBecados] = useState([]);
  const [becado, setBecado] = useState(() => safeStorage.get("artroBecado") || "");

  // Cronómetro
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const startRef = useRef(0);   // performance.now() del arranque actual
  const accRef   = useRef(0);   // tiempo acumulado de tramos anteriores

  // Registro
  const [tipo, setTipo] = useState(TIPOS[0].id);
  const [conTapa, setConTapa] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    getBecados().then(r => setBecados(r.becados || [])).catch(() => setBecados([]));
    getArtroRegistros().then(r => { setRegistros(r); setLoading(false); });
  }, []);

  function elegirBecado(n) {
    safeStorage.set("artroBecado", n);
    setBecado(n);
  }

  useEffect(() => {
    if (!running) return;
    let raf;
    const tick = () => {
      setMs(accRef.current + (performance.now() - startRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  function toggle() {
    if (running) {
      accRef.current += performance.now() - startRef.current;
      setMs(accRef.current);
      setRunning(false);
    } else {
      startRef.current = performance.now();
      setRunning(true);
    }
  }

  function reiniciar() {
    accRef.current = 0;
    startRef.current = performance.now();
    setMs(0);
    setRunning(false);
  }

  async function guardar() {
    if (ms <= 0 || saving) return;
    setRunning(false);
    accRef.current = ms;
    setSaving(true);
    const registro = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      becado,
      fecha: hoy,
      tipo,
      conTapa,
      ms: Math.round(ms),
    };
    const lista = await addArtroRegistro(registro);
    if (lista) {
      setRegistros(lista);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1600);
      reiniciar();
    }
    setSaving(false);
  }

  async function borrar(id) {
    const lista = await deleteArtroRegistro(id);
    if (lista) setRegistros(lista);
  }

  const puedeGuardar = ms > 0 && !saving;
  const misRegistros = registros.filter(r => r.becado === becado);

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40,position:"relative",zIndex:1}}>
      <div style={{position:"fixed",top:-70,right:-70,width:240,height:240,borderRadius:"50%",background:`${T.accent}0C`,filter:"blur(56px)",pointerEvents:"none",zIndex:0}}/>

      {/* paddingRight extra: deja libre la esquina donde va el botón fijo de ajustes */}
      <div style={{padding:"calc(var(--sat) + 14px) 60px 0 16px",display:"flex",alignItems:"center",gap:9,marginBottom:18,position:"relative",zIndex:1}}>
        <button className="press" onClick={onBack}
          style={{width:32,height:32,borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase"}}>
          Artro
        </div>
        {becado && (
          <button className="press" onClick={() => { safeStorage.remove("artroBecado"); setBecado(""); }}
            style={{
              marginLeft:"auto",display:"flex",alignItems:"center",gap:6,
              height:30,padding:"0 10px 0 6px",borderRadius:99,
              border:`1px solid ${T.accent}35`,background:`${T.accent}12`,cursor:"pointer",
              fontFamily:"'Inter',sans-serif",
            }}>
            <span style={{
              width:20,height:20,borderRadius:"50%",background:`${T.accent}25`,color:T.accent,
              fontSize:10.5,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              {becado.charAt(0).toUpperCase()}
            </span>
            <span style={{fontSize:12.5,fontWeight:600,color:T.accent}}>{becado}</span>
            <span style={{fontSize:10,color:T.accent,opacity:0.7}}>▾</span>
          </button>
        )}
      </div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>

        {!becado ? (
          <SelectBecadoArtro becados={becados} onPick={elegirBecado} T={T}/>
        ) : (
        <>

        {/* Tipo de ejercicio — fila horizontal para no empujar el cronómetro */}
        <div className="anim" style={{marginBottom:14}}>
          <div style={{fontSize:11.5,fontWeight:700,letterSpacing:"0.08em",color:T.muted,textTransform:"uppercase",marginBottom:8}}>
            Tipo de ejercicio
          </div>
          <div style={{
            display:"flex",gap:8,overflowX:"auto",paddingBottom:4,
            scrollbarWidth:"none",WebkitOverflowScrolling:"touch",
          }}>
            {TIPOS.map(t => {
              const sel = tipo === t.id;
              return (
                <button key={t.id} className="press" onClick={() => setTipo(t.id)}
                  style={{
                    position:"relative",flexShrink:0,width:96,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                    padding:"8px 6px 7px",borderRadius:14,cursor:"pointer",
                    border:`1.5px solid ${sel ? T.accent+"70" : T.border}`,
                    background: sel ? `${T.accent}12` : T.surface,
                    boxShadow: sel ? `0 0 14px ${T.accent}20` : "none",
                    fontFamily:"'Inter',sans-serif",
                    transition:"border-color 0.15s, background 0.15s",
                  }}>
                  <Foto src={t.img} alt={t.label} T={T}
                    style={{
                      width:66,height:66,objectFit:"contain",
                      opacity: sel ? 1 : 0.7,
                      filter: sel ? "none" : "saturate(0.7)",
                      transition:"opacity 0.15s, filter 0.15s",
                    }}/>
                  <span style={{
                    fontSize:12,fontWeight: sel ? 700 : 500,
                    color: sel ? T.accent : T.sub,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",
                  }}>
                    {t.label}
                  </span>
                  {sel && (
                    <span style={{
                      position:"absolute",top:5,right:5,
                      width:17,height:17,borderRadius:"50%",background:T.accent,
                      color:"#fff",fontSize:10,fontWeight:800,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Con / sin tapa */}
        <div className="anim" style={{marginBottom:20}}>
          <div style={{fontSize:11.5,fontWeight:700,letterSpacing:"0.08em",color:T.muted,textTransform:"uppercase",marginBottom:8}}>
            Tapa
          </div>
          <div style={{display:"flex",gap:8}}>
            {TAPAS.map(t => {
              const sel = conTapa === t.conTapa;
              return (
                <button key={t.label} className="press" onClick={() => setConTapa(t.conTapa)}
                  style={{
                    position:"relative",flex:1,
                    display:"flex",alignItems:"center",gap:9,
                    padding:"8px 10px",borderRadius:13,cursor:"pointer",textAlign:"left",
                    border:`1.5px solid ${sel ? T.accent+"70" : T.border}`,
                    background: sel ? `${T.accent}12` : T.surface,
                    boxShadow: sel ? `0 0 14px ${T.accent}20` : "none",
                    fontFamily:"'Inter',sans-serif",
                    transition:"border-color 0.15s, background 0.15s",
                  }}>
                  <Foto src={t.img} alt={t.label} T={T}
                    style={{
                      width:44,height:44,objectFit:"contain",flexShrink:0,
                      opacity: sel ? 1 : 0.65,
                      transition:"opacity 0.15s",
                    }}/>
                  <span style={{
                    fontSize:13.5,fontWeight: sel ? 700 : 500,
                    color: sel ? T.accent : T.sub,
                  }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cronómetro */}
        <div className="anim" style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:20}}>
          <button className="press" onClick={toggle}
            style={{
              position:"relative",
              width:230,height:230,borderRadius:"50%",cursor:"pointer",
              border:`3px solid ${running ? "#EF4444" : T.accent}`,
              background: running
                ? `radial-gradient(circle at 50% 45%, #EF444422 0%, ${T.surface} 70%)`
                : `radial-gradient(circle at 50% 45%, ${T.accent}22 0%, ${T.surface} 70%)`,
              boxShadow: `0 0 34px ${running ? "#EF4444" : T.accent}33`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
              transition:"border-color 0.2s, box-shadow 0.2s",
            }}>
            <span style={{
              fontFamily:"'Bricolage Grotesque',sans-serif",
              fontSize:40,fontWeight:800,lineHeight:1,
              color:T.text,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.01em",
            }}>
              {fmt(ms)}
            </span>
            <span style={{
              fontSize:12,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",
              color: running ? "#EF4444" : T.accent,
            }}>
              {running ? "⏸ Pausar" : ms > 0 ? "▶ Continuar" : "▶ Iniciar"}
            </span>
          </button>
        </div>

        {/* Acciones */}
        <div style={{display:"flex",gap:8,marginBottom:26}}>
          <button className="press" onClick={reiniciar} disabled={ms === 0 && !running}
            style={{
              flex:1,height:48,borderRadius:13,cursor:"pointer",
              border:`1px solid ${T.border}`,background:T.surface2,
              color: ms === 0 && !running ? T.muted : T.sub,
              fontSize:14,fontWeight:600,fontFamily:"'Inter',sans-serif",
            }}>
            ↺ Reiniciar
          </button>
          <button className="press" onClick={guardar} disabled={!puedeGuardar}
            style={{
              flex:2,height:48,borderRadius:13,cursor: puedeGuardar ? "pointer" : "default",
              border:"none",
              background: guardado ? "#22C55E" : puedeGuardar ? T.accent : `${T.accent}40`,
              color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",
              transition:"background 0.2s",
            }}>
            {guardado ? "✓ Guardado" : saving ? "Guardando…" : "Guardar tiempo"}
          </button>
        </div>

        {/* Historial */}
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
          <span style={{fontSize:14}}>📋</span>
          <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,fontWeight:800,color:T.text}}>
            Mis tiempos
          </span>
          {misRegistros.length > 0 && (
            <span style={{fontSize:11,fontWeight:700,color:T.muted}}>{misRegistros.length}</span>
          )}
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:24,color:T.muted,fontSize:13}}>Cargando…</div>
        ) : misRegistros.length === 0 ? (
          <div style={{
            textAlign:"center",padding:"30px 16px",background:T.surface,
            border:`1px dashed ${T.border}`,borderRadius:14,
          }}>
            <div style={{fontSize:28,marginBottom:8,opacity:0.35}}>⏱️</div>
            <div style={{fontSize:13,color:T.muted}}>Todavía no tienes tiempos guardados</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {misRegistros.map((r, i) => {
              const t = TIPOS.find(x => x.id === r.tipo);
              return (
                <div key={r.id} className="anim" style={{
                  animationDelay:`${Math.min(i,10)*25}ms`,
                  display:"flex",alignItems:"center",gap:10,
                  background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:12,padding:"10px 12px",
                }}>
                  {t?.img
                    ? <Foto src={t.img} alt={t.label} T={T} style={{width:30,height:30,objectFit:"contain",flexShrink:0}}/>
                    : <span style={{fontSize:16,flexShrink:0}}>•</span>}
                  <span style={{flex:1,minWidth:0}}>
                    <span style={{display:"block",fontSize:13.5,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {t?.label || r.tipo}
                      <span style={{
                        fontSize:10.5,fontWeight:700,marginLeft:7,padding:"2px 7px",borderRadius:99,
                        color: r.conTapa ? T.accent : T.muted,
                        background: r.conTapa ? `${T.accent}16` : T.surface2,
                        border:`1px solid ${r.conTapa ? T.accent+"35" : T.border}`,
                      }}>
                        {r.conTapa ? "con tapa" : "sin tapa"}
                      </span>
                    </span>
                    <span style={{fontSize:11.5,color:T.muted}}>{fechaCorta(r.fecha)}</span>
                  </span>
                  <span style={{
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                    fontSize:16,fontWeight:800,color:T.accent,flexShrink:0,
                    fontVariantNumeric:"tabular-nums",
                  }}>
                    {fmt(r.ms)}
                  </span>
                  <button className="press" onClick={() => borrar(r.id)}
                    style={{
                      width:26,height:26,borderRadius:8,flexShrink:0,
                      border:`1px solid ${T.border}`,background:"transparent",
                      color:T.muted,fontSize:13,cursor:"pointer",lineHeight:1,
                    }}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        </>
        )}
      </div>
    </div>
  );
}
