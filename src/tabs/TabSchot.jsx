import { useEffect, useMemo, useState } from "react";
import { SCHOT_DIAS } from "../constants/schot.js";
import { getSchotAsistencia, marcarSchot } from "../lib/supabaseApi.js";
import { todayISO } from "../utils/dates.js";
import { displayName } from "../utils/displayName.js";

const HOTEL_COLOR = { Sheraton: "#2a78d6", Enjoy: "#b06a4a" };

// Color estable por nombre, para que cada becado se reconozca de un vistazo.
const TONOS = [
  "#4F6EFF", "#E8186A", "#13C045", "#F59E0B", "#8B73FF",
  "#06B6D4", "#FB923C", "#EF4444", "#14B8A6", "#A855F7",
  "#22C55E", "#0EA5E9", "#F472B6", "#EAB308", "#6366F1",
];
const tono = n => TONOS[[...String(n)].reduce((a, c) => a + c.charCodeAt(0), 0) % TONOS.length];

// Dos charlas chocan si empiezan a menos de 20 min una de otra: en la práctica
// no se alcanza a cambiar de sala, y menos de hotel.
const MINUTOS_BLOQUE = 20;
const m2 = h => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

function Ficha({ nombre, size = 18 }) {
  const c = tono(nombre);
  return (
    <span title={displayName(nombre)} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: c, color: "#fff",
      fontSize: size * 0.5, fontWeight: 800, lineHeight: 1,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Bricolage Grotesque',sans-serif",
      boxShadow: "0 0 0 1.5px rgba(255,255,255,0.85)",
    }}>
      {displayName(nombre).charAt(0).toUpperCase()}
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
  const [guardando, setGuardando] = useState(null);   // id de la charla en curso
  const [soloMias, setSoloMias] = useState(false);

  useEffect(() => {
    let vivo = true;
    getSchotAsistencia()
      .then(a => { if (vivo) setAsistencia(a); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  const d = SCHOT_DIAS[dia];
  const mias = useMemo(() => new Set(asistencia[becado] || []), [asistencia, becado]);

  // Quién va a cada charla.
  const porCharla = useMemo(() => {
    const m = {};
    for (const [n, ids] of Object.entries(asistencia)) {
      for (const id of ids || []) (m[id] ||= []).push(n);
    }
    for (const v of Object.values(m)) v.sort();
    return m;
  }, [asistencia]);

  // Charlas del día que chocan con algo que ya marqué.
  const choca = (c) => {
    if (mias.has(c.id)) return false;
    return d.charlas.some(o =>
      o.id !== c.id && mias.has(o.id) && Math.abs(m2(o.hora) - m2(c.hora)) < MINUTOS_BLOQUE);
  };

  async function alternar(c) {
    if (guardando) return;
    const va = !mias.has(c.id);
    if (va && choca(c)) return;
    setGuardando(c.id);
    const next = await marcarSchot(becado, c.id, va);
    if (next) setAsistencia(next);
    setGuardando(null);
  }

  // Agrupadas por hora, y dentro de cada hora por hotel y sala.
  const bloques = useMemo(() => {
    const vis = soloMias ? d.charlas.filter(c => mias.has(c.id)) : d.charlas;
    const m = {};
    for (const c of vis) (m[c.hora] ||= []).push(c);
    return Object.keys(m).sort().map(h => ({
      hora: h,
      charlas: m[h].sort((a, b) => a.hotel.localeCompare(b.hotel) || a.sala.localeCompare(b.sala)),
    }));
  }, [d, soloMias, mias]);

  const misDelDia = d.charlas.filter(c => mias.has(c.id)).length;

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",
      fontFamily:"'Inter',sans-serif",paddingBottom:40,position:"relative",zIndex:1}}>

      <div style={{padding:"calc(var(--sat) + 14px) 60px 0 16px",position:"relative",zIndex:1}}>
        <div style={{fontSize:11.5,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase"}}>
          62° Congreso SCHOT · Viña del Mar
        </div>
        <button className="press" onClick={onChangeBecado}
          style={{background:"none",border:"none",padding:0,textAlign:"left",marginTop:2}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:23,fontWeight:800,
            color:T.text,lineHeight:1.1,textTransform:"capitalize"}}>{displayName(becado)}</div>
          <div style={{fontSize:12.5,color:T.muted,marginTop:1}}>toca para cambiar</div>
        </button>
      </div>

      {/* Días */}
      <div style={{display:"flex",gap:5,padding:"14px 16px 0",position:"relative",zIndex:1}}>
        {SCHOT_DIAS.map((x, i) => (
          <button key={x.fecha} className="press" onClick={() => setDia(i)}
            style={{
              flex:1,padding:"8px 2px",borderRadius:10,border:"none",
              background: i === dia ? T.accent : T.surface2,
              color: i === dia ? "#fff" : T.muted,
              fontSize:12,fontWeight: i === dia ? 700 : 500,cursor:"pointer",
              fontFamily:"'Inter',sans-serif",lineHeight:1.25,
            }}>
            {x.label.split(" ")[0].slice(0,3)}<br/>
            <span style={{fontSize:14,fontWeight:800}}>{x.label.split(" ")[1]}</span>
          </button>
        ))}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px 10px",position:"relative",zIndex:1}}>
        <span style={{fontSize:12.5,color:T.sub}}>
          {d.charlas.length} charlas · <strong style={{color:T.accent}}>{misDelDia} marcadas</strong>
        </span>
        <button className="press" onClick={() => setSoloMias(s => !s)}
          style={{
            marginLeft:"auto",height:28,padding:"0 11px",borderRadius:99,cursor:"pointer",
            border:`1px solid ${soloMias ? T.accent : T.border}`,
            background: soloMias ? `${T.accent}18` : T.surface,
            fontSize:12,fontWeight:700,color: soloMias ? T.accent : T.sub,
          }}>
          {soloMias ? "✓ Solo las mías" : "Solo las mías"}
        </button>
      </div>

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        {cargando ? (
          <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>Cargando…</div>
        ) : bloques.length === 0 ? (
          <div style={{textAlign:"center",padding:"36px 16px",background:T.surface,
            border:`1px dashed ${T.border}`,borderRadius:14,color:T.muted,fontSize:13}}>
            {soloMias ? "No has marcado ninguna charla de este día." : "Sin presentaciones del HT este día."}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {bloques.map(b => (
              <div key={b.hora}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,
                    fontWeight:800,color:T.text,fontVariantNumeric:"tabular-nums"}}>{b.hora}</span>
                  <span style={{flex:1,height:1,background:T.border}}/>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {b.charlas.map(c => {
                    const voy = mias.has(c.id);
                    const bloqueada = !voy && choca(c);
                    const gente = porCharla[c.id] || [];
                    const hc = HOTEL_COLOR[c.hotel] || T.muted;
                    return (
                      <button key={c.id} className="press" onClick={() => alternar(c)}
                        disabled={bloqueada || guardando === c.id}
                        style={{
                          width:"100%",textAlign:"left",cursor: bloqueada ? "not-allowed" : "pointer",
                          background: voy ? `${T.accent}12` : T.surface,
                          border:`1px solid ${voy ? T.accent+"60" : T.border}`,
                          borderLeft:`3px solid ${voy ? T.accent : hc}`,
                          borderRadius:12,padding:"10px 12px",
                          opacity: bloqueada ? 0.45 : 1,
                          fontFamily:"'Inter',sans-serif",
                          display:"flex",flexDirection:"column",gap:5,
                        }}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:11,fontWeight:700,color:hc}}>{c.hotel}</span>
                          <span style={{fontSize:11,color:T.muted}}>·</span>
                          <span style={{fontSize:11,fontWeight:600,color:T.sub}}>{c.sala}</span>
                          <span style={{fontSize:11,color:T.muted,fontVariantNumeric:"tabular-nums"}}>{c.hora}</span>
                          {c.panel  && <Etiqueta texto="PANEL"  color="#0EA5E9"/>}
                          {c.becado && <Etiqueta texto="BECADO" color="#A855F7"/>}
                        </div>

                        <div style={{fontSize:13.5,fontWeight:700,color:T.text,lineHeight:1.3}}>
                          {c.titulo}
                        </div>
                        <div style={{fontSize:12.5,color:T.sub}}>{c.presentador}</div>

                        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:1,minHeight:20}}>
                          {gente.map(n => <Ficha key={n} nombre={n}/>)}
                          {bloqueada && (
                            <span style={{fontSize:11,fontWeight:700,color:"#EF4444",marginLeft:"auto"}}>
                              choca con otra
                            </span>
                          )}
                          {!bloqueada && (
                            <span style={{marginLeft:"auto",fontSize:11.5,fontWeight:700,
                              color: voy ? T.accent : T.muted}}>
                              {guardando === c.id ? "…" : voy ? "✓ voy" : "marcar"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Etiqueta({ texto, color }) {
  return (
    <span style={{
      fontSize:9.5,fontWeight:800,letterSpacing:"0.06em",color,
      background:`${color}1C`,border:`1px solid ${color}45`,
      borderRadius:5,padding:"1px 5px",
    }}>{texto}</span>
  );
}
