import { useEffect, useRef, useState } from "react";
import { todayISO } from "../utils/dates.js";
import { getArtroRegistros, addArtroRegistro, deleteArtroRegistro } from "../lib/supabaseApi.js";
import { ciclosConPendiente, agruparEnCiclos, siguiente, recomendacion, llenasDe, REPS_POR_CICLO } from "../utils/artroCiclos.js";

// Los ids quedan guardados dentro de cada registro: no cambiarlos a la ligera
// (hoy se pueden cambiar sin migrar porque no hay registros previos).
// Mano abierta; la izquierda es la misma silueta espejada.
function Mano({ izq, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      style={{transform: izq ? "scaleX(-1)" : "none",flexShrink:0}}>
      <path d="M18 11V6a2 2 0 0 0-4 0"/>
      <path d="M14 10V4a2 2 0 0 0-4 0v2"/>
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  );
}

const TIPOS = [
  // El orden es el orden en que se deben hacer: de izquierda a derecha.
  { id: "Lineas",    label: "Líneas",    img: "/artro/lineas.webp" },
  { id: "Circulos",  label: "Círculos",  img: "/artro/circulos.webp" },
  { id: "Numeros",   label: "Números",   img: "/artro/numeros.webp" },
  { id: "Laberinto", label: "Laberinto", img: "/artro/laberinto.webp" },
  // Tubos 1 son los cilindros verticales; Tubos 2, los horizontales.
  { id: "Tubos1",    label: "Tubos 1",   img: "/artro/tubos-1.webp" },
  // Bloqueados: todavía no les toca a estos becados.
  { id: "Tubos2",    label: "Tubos 2",   img: "/artro/tubos-2.webp", bloqueado: true },
  { id: "Manguito",  label: "Manguito",  img: "/artro/manguito.webp", bloqueado: true },
  { id: "Meniscos",  label: "Meniscos",  img: "/artro/meniscos.webp", bloqueado: true },
];

// Ícono de mano; el izquierdo es el mismo espejado.
function IconoMano({ espejo }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: espejo ? "scaleX(-1)" : "none" }}>
      <path d="M18 11V6a2 2 0 0 0-4 0"/>
      <path d="M14 10V4a2 2 0 0 0-4 0v2"/>
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  );
}

const MANOS = [
  { id: "izq", label: "Izquierda", espejo: true  },
  { id: "der", label: "Derecha",   espejo: false },
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

export function TabArtro({ becado, onBack, T }) {
  const hoy = todayISO();

  // Cronómetro
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const startRef = useRef(0);   // performance.now() del arranque actual
  const accRef   = useRef(0);   // tiempo acumulado de tramos anteriores

  // Registro
  const [tipo, setTipo] = useState(TIPOS[0].id);
  const [mano, setMano] = useState("der");   // siempre queda una mano registrada
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [porBorrar, setPorBorrar] = useState(null);   // registro esperando confirmación

  useEffect(() => {
    getArtroRegistros().then(r => { setRegistros(r); setLoading(false); });
  }, []);

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
      mano,
      ms: Math.round(ms),
      // Marca de tiempo para poder ordenar dentro de un mismo día: sin esto,
      // dos registros del mismo día no tienen cómo desempatarse.
      ts: Date.now(),
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

  async function confirmarBorrado() {
    const reg = porBorrar;
    setPorBorrar(null);
    if (!reg) return;
    const lista = await deleteArtroRegistro(reg.id);
    if (lista) setRegistros(lista);
  }

  const puedeGuardar = ms > 0 && !saving;
  // El historial muestra sólo el ejercicio elegido arriba
  const misRegistros = registros.filter(r => r.becado === becado && r.tipo === tipo);
  // Más nuevo arriba: igual que el dibujo, el ciclo en curso queda primero y
  // dentro de él la repetición más reciente también.
  const ciclos = ciclosConPendiente(misRegistros);
  const ciclosDesc = [...ciclos].reverse();
  const toca = siguiente(agruparEnCiclos(misRegistros));

  // Qué ejercicio conviene hacer: el que arrastra el hueco más antiguo.
  const mios = registros.filter(r => r.becado === becado);
  const porTipo = {};
  for (const t of TIPOS) porTipo[t.id] = [];
  for (const r of mios) if (porTipo[r.tipo]) porTipo[r.tipo].push(r);
  // Los bloqueados no entran: si entraran serían siempre los más atrasados
  // (no tienen ningún registro) y la sugerencia nunca cambiaría.
  const candidatos = TIPOS.filter(t => !t.bloqueado).map(t => t.id);
  const sugerido = candidatos.length ? recomendacion(porTipo, candidatos) : null;
  const yaEstaEnSugerido = sugerido && sugerido.tipo === tipo && sugerido.mano === mano;

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
          <div style={{
              marginLeft:"auto",display:"flex",alignItems:"center",gap:6,
              height:30,padding:"0 10px 0 6px",borderRadius:99,
              border:`1px solid ${T.accent}35`,background:`${T.accent}12`,
              fontFamily:"'Inter',sans-serif",
            }}>
            <span style={{
              width:20,height:20,borderRadius:"50%",background:`${T.accent}25`,color:T.accent,
              fontSize:10.5,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              {becado.charAt(0).toUpperCase()}
            </span>
            <span style={{fontSize:12.5,fontWeight:600,color:T.accent}}>{becado}</span>
          </div>
        )}
      </div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>

        {/* Recomendación: arrastra el hueco más antiguo de todos los ejercicios */}
        {!loading && sugerido && (
          <button className="press" onClick={() => { setTipo(sugerido.tipo); setMano(sugerido.mano); }}
            style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,marginBottom:16,
              background: yaEstaEnSugerido ? `${T.accent}0E` : "#EF444410",
              border:`1.5px solid ${yaEstaEnSugerido ? T.accent+"45" : "#EF444455"}`,
              borderRadius:14,padding:"10px 12px",cursor:"pointer",textAlign:"left",
              fontFamily:"'Inter',sans-serif",
            }}>
            <span style={{fontSize:17,flexShrink:0}}>{yaEstaEnSugerido ? "✓" : "👉"}</span>
            <span style={{flex:1,minWidth:0}}>
              <span style={{display:"block",fontSize:10.5,fontWeight:700,letterSpacing:"0.07em",color:T.muted,textTransform:"uppercase"}}>
                Te toca hacer
              </span>
              <span style={{
                display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginTop:2,
                fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:14.5,fontWeight:800,
                color: yaEstaEnSugerido ? T.accent : "#EF4444",
              }}>
                {TIPOS.find(t => t.id === sugerido.tipo)?.label || sugerido.tipo}
                <span style={{fontSize:12.5,fontWeight:700,color:T.sub}}>
                  Ciclo {sugerido.ciclo} · R{sugerido.rep}
                </span>
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:12.5,fontWeight:700,color:T.sub}}>
                  <Mano izq={sugerido.mano === "izq"} size={12}/>{sugerido.mano}
                </span>
              </span>
            </span>
            {!yaEstaEnSugerido && (
              <span style={{fontSize:11,fontWeight:700,color:"#EF4444",flexShrink:0}}>ir →</span>
            )}
          </button>
        )}

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
              const bloq = !!t.bloqueado;
              return (
                <button key={t.id} className={bloq ? "" : "press"}
                  onClick={() => { if (!bloq) setTipo(t.id); }}
                  disabled={bloq}
                  aria-label={bloq ? `${t.label} — bloqueado` : t.label}
                  title={bloq ? "Todavía no disponible" : undefined}
                  style={{
                    position:"relative",flexShrink:0,width:96,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                    padding:"8px 6px 7px",borderRadius:14,
                    cursor: bloq ? "not-allowed" : "pointer",
                    border:`1.5px ${bloq ? "dashed" : "solid"} ${sel ? T.accent+"70" : T.border}`,
                    background: bloq ? T.surface2 : sel ? `${T.accent}12` : T.surface,
                    boxShadow: sel && !bloq ? `0 0 14px ${T.accent}20` : "none",
                    fontFamily:"'Inter',sans-serif",
                    transition:"border-color 0.15s, background 0.15s",
                  }}>
                  <Foto src={t.img} alt={t.label} T={T}
                    style={{
                      width:66,height:66,objectFit:"contain",
                      opacity: bloq ? 0.3 : sel ? 1 : 0.7,
                      filter: bloq ? "grayscale(1)" : sel ? "none" : "saturate(0.7)",
                      transition:"opacity 0.15s, filter 0.15s",
                    }}/>
                  <span style={{
                    fontSize:12,fontWeight: sel && !bloq ? 700 : 500,
                    color: bloq ? T.muted : sel ? T.accent : T.sub,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",
                  }}>
                    {t.label}
                  </span>
                  {bloq ? (
                    <span style={{
                      position:"absolute",top:5,right:5,
                      width:19,height:19,borderRadius:"50%",
                      background:T.surface,border:`1px solid ${T.border}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.muted}
                        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                  ) : sel && (
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

        {/* Mano */}
        <div className="anim" style={{marginBottom:20}}>
          <div style={{fontSize:11.5,fontWeight:700,letterSpacing:"0.08em",color:T.muted,textTransform:"uppercase",marginBottom:8}}>
            Mano
          </div>
          <div style={{display:"flex",gap:8}}>
            {MANOS.map(m => {
              const sel = mano === m.id;
              return (
                <button key={m.id} className="press" onClick={() => setMano(m.id)}
                  style={{
                    flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    height:46,borderRadius:13,cursor:"pointer",
                    border:`1.5px solid ${sel ? T.accent+"70" : T.border}`,
                    background: sel ? `${T.accent}12` : T.surface,
                    boxShadow: sel ? `0 0 14px ${T.accent}20` : "none",
                    color: sel ? T.accent : T.sub,
                    fontSize:14,fontWeight: sel ? 700 : 500,
                    fontFamily:"'Inter',sans-serif",
                    transition:"border-color 0.15s, background 0.15s",
                  }}>
                  <IconoMano espejo={m.espejo}/>
                  {m.label}
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
          <span style={{
            fontSize:11.5,fontWeight:700,color:T.accent,
            background:`${T.accent}16`,border:`1px solid ${T.accent}35`,
            borderRadius:99,padding:"2px 9px",
          }}>
            {TIPOS.find(t => t.id === tipo)?.label || tipo}
          </span>
          {misRegistros.length > 0 && (
            <span style={{fontSize:11,fontWeight:700,color:T.muted}}>{misRegistros.length}</span>
          )}
        </div>

        {/* Qué toca ahora en este ejercicio */}
        <div style={{
          display:"flex",alignItems:"center",gap:7,marginBottom:10,
          background:`${T.accent}0E`,border:`1px solid ${T.accent}33`,
          borderRadius:11,padding:"8px 11px",
        }}>
          <span style={{fontSize:10.5,fontWeight:700,letterSpacing:"0.07em",color:T.muted,textTransform:"uppercase"}}>
            Te toca
          </span>
          <span style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto",fontSize:12.5,fontWeight:700,color:T.accent}}>
            Ciclo {toca.ciclo} · R{toca.rep}
            <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
              <Mano izq={toca.mano === "izq"} size={12}/>{toca.mano}
            </span>
          </span>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:24,color:T.muted,fontSize:13}}>Cargando…</div>
        ) : misRegistros.length === 0 ? (
          <div style={{
            textAlign:"center",padding:"30px 16px",background:T.surface,
            border:`1px dashed ${T.border}`,borderRadius:14,
          }}>
            <div style={{fontSize:28,marginBottom:8,opacity:0.35}}>⏱️</div>
            <div style={{fontSize:13,color:T.muted}}>Todavía no tienes tiempos de este ejercicio</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {ciclosDesc.map((c, idx) => {
              const llenas = llenasDe(c);
              const completo = llenas === REPS_POR_CICLO * 2;
              return (
                <div key={c.n} className="anim" style={{
                  animationDelay:`${Math.min(idx,8)*30}ms`,
                  background:T.surface,border:`1px solid ${completo ? T.border : T.accent+"45"}`,
                  borderRadius:14,overflow:"hidden",
                }}>
                  <div style={{
                    display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
                    background:T.surface2,borderBottom:`1px solid ${T.border}`,
                  }}>
                    <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:13.5,fontWeight:800,color:T.text}}>
                      Ciclo {c.n}
                    </span>
                    <span style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:completo?"#13C045":T.muted}}>
                      {completo ? "completo" : `${llenas}/${REPS_POR_CICLO * 2}`}
                    </span>
                  </div>

                  <div style={{padding:"7px 10px 10px",display:"flex",flexDirection:"column",gap:5}}>
                    <div style={{display:"grid",gridTemplateColumns:`30px 1fr 1fr`,gap:6}}>
                      <span/>
                      {["der","izq"].map(m => (
                        <span key={m} style={{
                          display:"flex",alignItems:"center",justifyContent:"center",gap:4,
                          fontSize:10.5,fontWeight:700,letterSpacing:"0.06em",
                          color:T.muted,textTransform:"uppercase",
                        }}>
                          <Mano izq={m==="izq"} size={11}/>{m}
                        </span>
                      ))}
                    </div>

                    {[...c.reps].reverse().map(r => (
                      <div key={r.n} style={{display:"grid",gridTemplateColumns:`30px 1fr 1fr`,gap:6}}>
                        <span style={{
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:11,fontWeight:800,color:T.muted,
                          fontFamily:"'Bricolage Grotesque',sans-serif",
                        }}>
                          R{r.n}
                        </span>
                        {["der","izq"].map(m => {
                          const reg = r[m];
                          const esTurno = !reg && toca.ciclo === c.n && toca.rep === r.n && toca.mano === m;
                          if (!reg) return (
                            <span key={m} style={{
                              display:"flex",alignItems:"center",justifyContent:"center",
                              minHeight:34,borderRadius:9,
                              border:`1.5px dashed ${esTurno ? "#EF4444" : T.border}`,
                              background: esTurno ? "#EF444410" : "transparent",
                              fontSize:10.5,fontWeight:800,letterSpacing:"0.04em",
                              color: esTurno ? "#EF4444" : T.muted,
                            }}>
                              {esTurno ? "TE TOCA" : ""}
                            </span>
                          );
                          return (
                            <button key={m} className="press" onClick={() => setPorBorrar(reg)}
                              title={`${fechaCorta(reg.fecha)} — tocar para borrar`}
                              style={{
                                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                                minHeight:34,borderRadius:9,cursor:"pointer",
                                border:`1px solid ${T.border}`,background:T.surface2,
                                fontFamily:"'Inter',sans-serif",lineHeight:1.1,
                              }}>
                              <span style={{
                                fontFamily:"'Bricolage Grotesque',sans-serif",
                                fontSize:15,fontWeight:800,color:T.accent,
                                fontVariantNumeric:"tabular-nums",
                              }}>
                                {fmt(reg.ms)}
                              </span>
                              <span style={{fontSize:9.5,color:T.muted}}>{fechaCorta(reg.fecha)}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {porBorrar && (
        <div onClick={() => setPorBorrar(null)}
          style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",
            justifyContent:"center",padding:24,background:"rgba(0,0,0,0.55)"}}>
          <div onClick={e => e.stopPropagation()} className="anim"
            style={{width:"100%",maxWidth:330,background:T.surface,borderRadius:18,
              border:`1px solid ${T.border}`,padding:"22px 20px 18px",
              boxShadow:"0 12px 48px rgba(0,0,0,0.35)",textAlign:"center"}}>
            <div style={{fontSize:30,marginBottom:10}}>🗑️</div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>
              ¿Borrar este tiempo?
            </div>
            <div style={{fontSize:13,color:T.muted,marginBottom:18,lineHeight:1.45}}>
              {TIPOS.find(t => t.id === porBorrar.tipo)?.label || porBorrar.tipo}
              {" · "}{fmt(porBorrar.ms)}{" · "}{fechaCorta(porBorrar.fecha)}
              <br/>No se puede deshacer.
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="press" onClick={() => setPorBorrar(null)}
                style={{flex:1,height:44,borderRadius:12,border:`1px solid ${T.border}`,
                  background:T.surface2,color:T.sub,fontSize:14,fontWeight:600,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif"}}>
                Cancelar
              </button>
              <button className="press" onClick={confirmarBorrado}
                style={{flex:1,height:44,borderRadius:12,border:"none",
                  background:"#EF4444",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif"}}>
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
