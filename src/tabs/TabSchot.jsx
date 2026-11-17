import { useEffect, useMemo, useState } from "react";
import { SCHOT_DIAS, SCHOT_ESP, SCHOT_HOTEL } from "../constants/schot.js";
import { getSchotAsistencia, marcarSchot } from "../lib/supabaseApi.js";
import { todayISO } from "../utils/dates.js";
import { displayName } from "../utils/displayName.js";
import { SpriteBecado } from "../components/map/SpriteBecado.jsx";
import { AVATAR_IDENTITY } from "../constants/avatarIdentity.js";
import { getAvatares } from "../lib/supabaseApi.js";

const HOTEL_COLOR = { Sheraton: "#36414d", Enjoy: "#8a6a56" };
const COL_W = 132;   // ancho de cada sala
const HORA_W = 44;   // columna de la hora, fija a la izquierda

// Dos charlas chocan si empiezan a menos de 20 min una de otra: no se alcanza a
// cambiar de sala, y menos de hotel.
const MINUTOS_BLOQUE = 20;
const m2 = h => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

// El mismo muñeco pixel art del mapa. `looks` trae la personalización
// compartida; si alguien no la tiene, el sprite usa sus valores por defecto.
function Ficha({ nombre, looks, size = 22 }) {
  return (
    <span title={displayName(nombre)} style={{display:"block",flexShrink:0,lineHeight:0}}>
      <SpriteBecado look={looks?.[nombre]} size={size} alt={displayName(nombre)}/>
    </span>
  );
}

export function TabSchot({ becado, onChangeBecado, T }) {
  const hoy = todayISO();
  const [dia, setDia] = useState(() => {
    const i = SCHOT_DIAS.findIndex(d => d.fecha === hoy);
    return i >= 0 ? i : 0;
  });
  const [asistencia, setAsistencia] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [abierta, setAbierta] = useState(null);   // charla del detalle
  const [looks, setLooks] = useState({});

  // Identidad fija de cada avatar + lo que hayan personalizado en el mapa.
  useEffect(() => {
    let vivo = true;
    getAvatares()
      .then(comp => { if (vivo) setLooks(Object.fromEntries(
        [...new Set([...Object.keys(AVATAR_IDENTITY), ...Object.keys(comp || {})])]
          .map(n => [n, { ...AVATAR_IDENTITY[n], ...(comp || {})[n] }]))); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    let vivo = true;
    getSchotAsistencia()
      .then(a => { if (vivo) setAsistencia(a); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  const d = SCHOT_DIAS[dia];
  const mias = useMemo(() => new Set(asistencia[becado] || []), [asistencia, becado]);

  const porCharla = useMemo(() => {
    const m = {};
    for (const [n, ids] of Object.entries(asistencia)) for (const id of ids || []) (m[id] ||= []).push(n);
    for (const v of Object.values(m)) v.sort();
    return m;
  }, [asistencia]);

  const choca = (c) => !mias.has(c.id) && d.charlas.some(
    o => o.id !== c.id && mias.has(o.id) && Math.abs(m2(o.hora) - m2(c.hora)) < MINUTOS_BLOQUE);

  async function alternar(c) {
    if (guardando) return;
    const va = !mias.has(c.id);
    if (va && choca(c)) return;
    setGuardando(c.id);
    const next = await marcarSchot(becado, c.id, va);
    if (next) setAsistencia(next);
    setGuardando(null);
  }

  // Agrupa columnas por hotel, para la fila de cabecera que los abarca.
  const grupos = useMemo(() => {
    const g = [];
    for (const col of d.columnas) {
      const u = g[g.length - 1];
      if (u && u.hotel === col.hotel) u.n++;
      else g.push({ hotel: col.hotel, n: 1 });
    }
    return g;
  }, [d]);

  // Filas con charlas, y los huecos entre medio como banda.
  const filas = useMemo(() => {
    const out = [];
    for (let i = 0; i < d.filas.length; i++) {
      const slot = d.filas[i];
      if (i > 0) {
        const prev = d.filas[i - 1];
        if (m2(slot) - m2(prev) > 15) out.push({ hueco: true, desde: prev, hasta: slot });
      }
      out.push({ slot, charlas: d.charlas.filter(c => c.slot === slot) });
    }
    return out;
  }, [d]);

  const ancho = HORA_W + d.columnas.length * COL_W;
  const misDelDia = d.charlas.filter(c => mias.has(c.id)).length;

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",
      fontFamily:"'Inter',sans-serif",paddingBottom:30,position:"relative",zIndex:1}}>

      <div style={{padding:"calc(var(--sat) + 14px) 60px 0 14px"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase"}}>
          62° Congreso SCHOT · Viña del Mar
        </div>
        <button className="press" onClick={onChangeBecado}
          style={{background:"none",border:"none",padding:0,textAlign:"left",marginTop:2}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:21,fontWeight:800,
            color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>{displayName(becado)}</div>
          <div style={{fontSize:12,color:T.muted,marginTop:1}}>toca para cambiar</div>
        </button>
      </div>

      <div style={{display:"flex",gap:4,padding:"12px 14px 0"}}>
        {SCHOT_DIAS.map((x, i) => (
          <button key={x.fecha} className="press" onClick={() => setDia(i)}
            style={{
              flex:1,padding:"7px 2px",borderRadius:9,border:"none",
              background: i === dia ? T.accent : T.surface2,
              color: i === dia ? "#fff" : T.muted,
              fontSize:11,fontWeight: i === dia ? 700 : 500,cursor:"pointer",lineHeight:1.2,
            }}>
            {x.label.split(" ")[0].slice(0,3)}<br/>
            <span style={{fontSize:14,fontWeight:800}}>{x.label.split(" ")[1]}</span>
          </button>
        ))}
      </div>

      <div style={{padding:"9px 14px 8px",fontSize:12,color:T.sub}}>
        {d.charlas.length} presentaciones HT · <strong style={{color:T.accent}}>{misDelDia} marcadas</strong>
        <span style={{color:T.muted}}> · desliza para ver todas las salas</span>
      </div>

      {cargando ? (
        <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>Cargando…</div>
      ) : (
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",padding:"0 0 4px"}}>
          <div style={{width:ancho,minWidth:"100%"}}>

            {/* hoteles */}
            <div style={{display:"flex",position:"sticky",top:0,zIndex:3}}>
              <div style={{width:HORA_W,flexShrink:0,background:T.bg}}/>
              {grupos.map((g, i) => (
                <div key={i} style={{
                  width:g.n*COL_W,flexShrink:0,background:HOTEL_COLOR[g.hotel]||T.surface2,
                  color:"#fff",fontSize:11,fontWeight:800,letterSpacing:"0.06em",
                  padding:"5px 6px",textAlign:"center",
                  borderRight:`2px solid ${T.bg}`,
                }}>
                  {g.hotel.toUpperCase()}
                  <span style={{fontWeight:500,opacity:0.8}}> · {SCHOT_HOTEL[g.hotel]}</span>
                </div>
              ))}
            </div>

            {/* salas */}
            <div style={{display:"flex",position:"sticky",top:24,zIndex:3}}>
              <div style={{width:HORA_W,flexShrink:0,background:T.surface2,
                fontSize:10,fontWeight:700,color:T.muted,display:"flex",
                alignItems:"center",justifyContent:"center"}}>Hora</div>
              {d.columnas.map(col => (
                <div key={col.sala} style={{
                  width:COL_W,flexShrink:0,background:T.surface2,color:T.text,
                  fontSize:11.5,fontWeight:700,padding:"6px 4px",textAlign:"center",
                  borderLeft:`1px solid ${T.border}`,
                }}>{col.sala}</div>
              ))}
            </div>

            {filas.map((f, i) => f.hueco ? (
              <div key={`h${i}`} style={{
                display:"flex",alignItems:"center",justifyContent:"center",
                background:T.surface2,color:T.muted,fontSize:10.5,
                padding:"3px 0",borderTop:`1px solid ${T.border}`,
              }}>
                {f.desde} – {f.hasta} · sin presentaciones HT
              </div>
            ) : (
              <div key={f.slot} style={{display:"flex",borderTop:`1px solid ${T.border}`,minHeight:34}}>
                <div style={{
                  width:HORA_W,flexShrink:0,background:T.accent,color:"#fff",
                  fontSize:12,fontWeight:800,display:"flex",alignItems:"center",
                  justifyContent:"center",fontVariantNumeric:"tabular-nums",
                  position:"sticky",left:0,zIndex:2,
                }}>{f.slot}</div>

                {d.columnas.map(col => {
                  const aqui = f.charlas.filter(c => c.sala === col.sala);
                  return (
                    <div key={col.sala} style={{
                      width:COL_W,flexShrink:0,borderLeft:`1px solid ${T.border}`,
                      background:T.surface,padding:2,
                      display:"flex",flexDirection:"column",gap:2,
                    }}>
                      {aqui.map(c => {
                        const voy = mias.has(c.id);
                        const bloq = choca(c);
                        const gente = porCharla[c.id] || [];
                        const ce = SCHOT_ESP[c.esp] || T.muted;
                        return (
                          <button key={c.id} className="press" onClick={() => setAbierta(c)}
                            style={{
                              width:"100%",textAlign:"left",cursor:"pointer",
                              background: voy ? `${T.accent}18` : c.panel ? "#0EA5E90E" : c.becado ? "#A855F70E" : T.surface,
                              border:`1px solid ${voy ? T.accent : T.border}`,
                              borderLeft:`3px solid ${ce}`,borderRadius:5,
                              padding:"4px 5px",opacity: bloq ? 0.42 : 1,
                              fontFamily:"'Inter',sans-serif",
                              display:"flex",flexDirection:"column",gap:1,
                            }}>
                            <span style={{fontSize:10.5,fontWeight:800,color:ce,
                              fontVariantNumeric:"tabular-nums"}}>{c.hora}</span>
                            <span style={{fontSize:11,fontWeight:700,color:T.text,lineHeight:1.2}}>
                              {c.presentador}
                            </span>
                            {(c.panel || c.becado) && (
                              <span style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.05em",
                                color: c.panel ? "#0EA5E9" : "#A855F7"}}>
                                {c.panel ? "PANEL" : "BECADO"}
                              </span>
                            )}
                            <span style={{fontSize:10,color:T.sub,lineHeight:1.25}}>{c.titulo}</span>
                            {gente.length > 0 && (
                              <span style={{display:"flex",gap:2,flexWrap:"wrap",marginTop:1}}>
                                {gente.map(n => <Ficha key={n} nombre={n} looks={looks} size={22}/>)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* leyenda, igual que el pie del PDF */}
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",padding:"10px 14px 0"}}>
        {Object.entries(SCHOT_ESP).map(([k, v]) => (
          <span key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:10.5,color:T.sub}}>
            <span style={{width:9,height:9,borderRadius:2,background:v}}/>{k}
          </span>
        ))}
      </div>

      {abierta && (
        <Detalle charla={abierta} voy={mias.has(abierta.id)} bloqueada={choca(abierta)}
          gente={porCharla[abierta.id] || []} looks={looks} guardando={guardando === abierta.id}
          onAlternar={() => alternar(abierta)} onClose={() => setAbierta(null)} T={T}/>
      )}
    </div>
  );
}

// Al tocar una charla se abre el detalle: en la celda no cabe todo, y marcar
// desde acá evita hacerlo sin querer al desplazar la grilla.
function Detalle({ charla: c, voy, bloqueada, gente, looks, guardando, onAlternar, onClose, T }) {
  const ce = SCHOT_ESP[c.esp] || T.muted;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",
      background:"rgba(0,0,0,0.5)"}} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%",maxWidth:480,margin:"0 auto",background:T.surface,
        borderRadius:"18px 18px 0 0",padding:"18px 18px calc(var(--sab) + 22px)",
        boxShadow:"0 -4px 40px rgba(0,0,0,0.4)",fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9,flexWrap:"wrap"}}>
          <span style={{width:10,height:10,borderRadius:3,background:ce}}/>
          <span style={{fontSize:11.5,fontWeight:700,color:ce}}>{c.esp}</span>
          {c.panel  && <span style={{fontSize:10,fontWeight:800,color:"#0EA5E9"}}>PANEL</span>}
          {c.becado && <span style={{fontSize:10,fontWeight:800,color:"#A855F7"}}>BECADO</span>}
        </div>

        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:800,
          color:T.text,lineHeight:1.25}}>{c.titulo}</div>
        <div style={{fontSize:14,color:T.sub,marginTop:4}}>{c.presentador}</div>
        <div style={{fontSize:12.5,color:T.muted,marginTop:7}}>
          {c.hora} · {c.hotel} · {c.sala}
          <div style={{fontSize:11.5,marginTop:1}}>{SCHOT_HOTEL[c.hotel]}</div>
        </div>

        {gente.length > 0 && (
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginTop:12}}>
            <span style={{fontSize:11.5,color:T.muted}}>Van:</span>
            {gente.map(n => (
              <span key={n} style={{display:"flex",alignItems:"center",gap:4,
                background:T.surface2,borderRadius:99,padding:"2px 8px 2px 2px"}}>
                <Ficha nombre={n} looks={looks} size={26}/>
                <span style={{fontSize:11.5,color:T.sub}}>{displayName(n)}</span>
              </span>
            ))}
          </div>
        )}

        <button className="press" onClick={onAlternar} disabled={bloqueada || guardando}
          style={{
            width:"100%",marginTop:16,height:46,borderRadius:13,border:"none",
            background: bloqueada ? T.surface2 : voy ? "#EF4444" : T.accent,
            color: bloqueada ? T.muted : "#fff",
            fontSize:14.5,fontWeight:700,cursor: bloqueada ? "not-allowed" : "pointer",
            fontFamily:"'Inter',sans-serif",
          }}>
          {guardando ? "Guardando…"
            : bloqueada ? "Choca con otra que ya marcaste"
            : voy ? "Ya no voy" : "Voy a esta"}
        </button>
      </div>
    </div>
  );
}
