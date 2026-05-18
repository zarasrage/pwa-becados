import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { todayISO, offsetDate, formatDate, getWeekDates } from "../utils/dates.js";
import { Spinner } from "../components/ui/Spinner.jsx";
import { FELLOWS } from "../data/fellows.js";
import { useApiData } from "../hooks/useApiData.js";
import { API_TOKEN } from "../constants/api.js";

const EQUIPOS = [
  { id: 1, nombre: "Mano",          color: "#EF4444", cirujanos: ["BRANES ROCIO ALEJANDRA FRANCISCA","BREYER JUAN MANUEL","FERRADA PAULINA","GOMEZ CARLOS JOSE","GUERRA CARLOS JAVIER","GATICA PAMELA","HERES VICTORIA","MATHEUS JESUS ALBERTO","PEREZ ALFONSO JAVIER","SOTELO PAULA ALEJANDRA","STURIZA VANJA MARIA","URRUTIA ESTEBAN FELIPE","VERGARA PAMELA ISABEL","VERGARA LAURA","GUTIERREZ JAIME","BASAURI TOMAS"] },
  { id: 2, nombre: "Hombro",        color: "#F97316", cirujanos: ["AMOEDO FELIPE","LOPEZ SEBASTIAN","ROJAS WALTER ANDRES","SULZER SUSAN CHRISTIN","VARGAS JORGE MAURICIO","VARGAS PABLO CESAR"] },
  { id: 3, nombre: "Cadera",        color: "#3B82F6", cirujanos: ["GONZALEZ JAIME ARNOLDO","NUNEZ MANUEL JOSE","TELIAS ALBERTO LUIS"] },
  { id: 4, nombre: "Rodilla",       color: "#EAB308", cirujanos: ["BUSTOS FELIPE IGNACIO","CASTRO NICOLAS CRISTIAN","FRANULIC NICOLAS ALEJANDRO","GAGGERO NICOLAS SANTIAGO","INNOCENTI PIERO ANTONIO","KOCH MARCO ANTONIO","LASO JOSE IGNACIO","MUNOZ JOSE TOMAS","OLIVIERI RODRIGO ALEJANDRO","VALIENTE DIEGO ALBERTO JESUS"] },
  { id: 5, nombre: "Tobillo y pie", color: "#22C55E", cirujanos: ["ABARCA MARIO CRISTOBAL","BASTIAS GONZALO FELIPE","BERGERET JUAN","CHARNAY PIERRE BARTHELEMY","CUCHACOVICH NATALIO RENE","LAYSECA ALVARO","MELO RODRIGO HORACIO","MENA JAVIER IGNACIO","PARADA CRISTIAN GONZALO","PEREZ LUIS CARLOS","PIGA CAMILO ANTONIO","QUEZADA JOSE","SELMAN LUIS FELIPE","VALDERRAMA IGNACIO ANDRES","ZAGAL PATRICIO ALFONSO"] },
  { id: 6, nombre: "Columna",       color: "#A855F7", cirujanos: ["CIRILLO JUAN IGNACIO","FLEIDERMAN JOSE GERARDO","GIMBERNAT MARCOS EDUARDO","TAPIA CARLOS"] },
];

const EQUIPO_TO_ROT = {
  "Mano": "M", "Hombro": "H", "Cadera": "CyP",
  "Rodilla": "R", "Tobillo y Pie": "TyP", "Columna": "Col",
};

const PABELLON_COLORS = [
  "#348FFF","#FF6B6B","#4CAF50","#FF9800",
  "#9C27B0","#00BCD4","#F06292","#8BC34A",
];

function normalizarNombre(n) {
  if (!n) return "";
  return n.toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z\s]/g, "")
    .trim();
}

function getApellidoCirujano(equipoField) {
  if (!equipoField) return null;
  const palabrasField = new Set(normalizarNombre(equipoField).split(/\s+/));
  for (const eq of EQUIPOS) {
    for (const c of eq.cirujanos) {
      const partes = normalizarNombre(c).split(/\s+/);
      const apellido = partes[0], nombre = partes[1];
      if (apellido && nombre && palabrasField.has(apellido) && palabrasField.has(nombre)) {
        return apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase();
      }
    }
  }
  // Fallback para cirujanos no listados: campo viene NOMBRE NOMBRE APELLIDO APELLIDO
  const partes = equipoField.trim().split(/\s+/);
  const ap = partes.length >= 3 ? partes[partes.length - 2] : partes[partes.length - 1];
  return ap ? ap.charAt(0).toUpperCase() + ap.slice(1).toLowerCase() : null;
}

function cirujanoEnEquipo(equipoField, cirujanos) {
  if (!equipoField) return false;
  const palabrasField = new Set(normalizarNombre(equipoField).split(/\s+/));
  return cirujanos.some(c => {
    const partes = normalizarNombre(c).split(/\s+/);
    const apellido = partes[0];
    const nombre   = partes[1];
    if (!apellido || !nombre) return false;
    return palabrasField.has(apellido) && palabrasField.has(nombre);
  });
}

function formatHora(hora) {
  if (!hora) return "--:--";
  return hora.slice(0, 5);
}

function PacienteCard({ r, color, T, summaryGroups }) {
  const [expanded, setExpanded] = useState(false);
  const [asistente, setAsistente] = useState(() => {
    try { return localStorage.getItem(`asistente_${r.id}`) || ""; } catch { return ""; }
  });
  const [asignando, setAsignando] = useState(false);
  const [otroMode, setOtroMode]   = useState(false);
  const [otroTexto, setOtroTexto] = useState("");

  const especialidadEquipo = EQUIPOS.find(eq => cirujanoEnEquipo(r.equipo, eq.cirujanos));
  const rotCode    = especialidadEquipo ? EQUIPO_TO_ROT[especialidadEquipo.nombre] : null;
  const becadosDisp = rotCode ? (summaryGroups?.[rotCode] || []) : [];
  const fellowsDisp = especialidadEquipo
    ? FELLOWS.filter(f => f.especialidad === especialidadEquipo.nombre)
    : [];

  const toggle = () => {
    setExpanded(e => {
      if (e) { setAsignando(false); setOtroMode(false); }
      return !e;
    });
  };

  const asignar = (nombre) => {
    setAsistente(nombre);
    try { localStorage.setItem(`asistente_${r.id}`, nombre); } catch {}
    setAsignando(false); setOtroMode(false); setOtroTexto("");
  };

  const remover = () => {
    setAsistente("");
    try { localStorage.removeItem(`asistente_${r.id}`); } catch {}
  };

  return (
    <div onClick={toggle}
      style={{
        background: r.cancelada ? `${T.surface}88` : T.surface,
        border: `1px solid ${r.cancelada ? T.border+"66" : T.border}`,
        borderRadius: 12, padding: "10px 13px",
        cursor: "pointer", opacity: r.cancelada ? 0.5 : 1,
        position: "relative", overflow: "hidden",
      }}>
      <div style={{ position:"absolute",left:0,top:0,bottom:0,width:3,background:r.cancelada?T.muted:color,borderRadius:"12px 0 0 12px" }}/>
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
          <div style={{ minWidth:44,textAlign:"center",background:`${color}18`,borderRadius:8,padding:"4px 0" }}>
            <div style={{ fontSize:13,fontWeight:700,color,lineHeight:1 }}>{formatHora(r.hora)}</div>
            {r.hora_fin && <div style={{ fontSize:10,color:T.muted,lineHeight:1,marginTop:2 }}>{formatHora(r.hora_fin)}</div>}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:r.cancelada?"line-through":"none" }}>
              {r.paciente || "—"}
            </div>
            <div style={{ fontSize:11,color:T.muted,marginTop:1 }}>
              {r.rut || "—"}
              {r.tipo_paciente && <span style={{ marginLeft:6,background:`${color}22`,color,borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:600 }}>{r.tipo_paciente}</span>}
              {r.cancelada && <span style={{ marginLeft:6,background:"#FF6B6B22",color:"#FF6B6B",borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:600 }}>CANCELADA</span>}
            </div>
            {r.diagnostico && (
              <div style={{ fontSize:12,color:T.sub,marginTop:4,fontStyle:"italic",whiteSpace:expanded?"normal":"nowrap",overflow:expanded?"visible":"hidden",textOverflow:expanded?"unset":"ellipsis" }}>
                {r.diagnostico}
              </div>
            )}
            {r.cirugia && (
              <div style={{ fontSize:12,fontWeight:500,color:T.text,marginTop:2,whiteSpace:expanded?"normal":"nowrap",overflow:expanded?"visible":"hidden",textOverflow:expanded?"unset":"ellipsis" }}>
                ✂️ {r.cirugia}
              </div>
            )}
          </div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0 }}>
            {r.equipo && <span style={{ fontSize:10,color:T.muted,background:T.surface2,borderRadius:99,padding:"1px 7px",border:`1px solid ${T.border}`,whiteSpace:"nowrap" }}>{getApellidoCirujano(r.equipo)}</span>}
            <span style={{ fontSize:13,color:T.muted }}>{expanded?"▾":"›"}</span>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:6 }}>

            {/* Asistente */}
            <div onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                <span style={{ color:T.muted,fontSize:11 }}>Asistente ·</span>
                {asistente ? (
                  <>
                    <span style={{ fontSize:12,color:T.text,fontWeight:500 }}>{asistente}</span>
                    <span onClick={remover} style={{ fontSize:11,color:T.muted,cursor:"pointer",padding:"0 2px" }}>✕</span>
                  </>
                ) : !asignando ? (
                  <span onClick={() => setAsignando(true)}
                    style={{ fontSize:11,fontWeight:600,color:"#348FFF",cursor:"pointer" }}>
                    + Asignar
                  </span>
                ) : null}
              </div>

              {asignando && !otroMode && (
                <div style={{ display:"flex",flexDirection:"column",gap:6,marginTop:6 }}>
                  {becadosDisp.length > 0 && (
                    <div>
                      <div style={{ fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4 }}>Becados rotando</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                        {becadosDisp.map(nombre => (
                          <button key={nombre} onClick={() => asignar(nombre)}
                            style={{ borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:600,border:`1px solid ${especialidadEquipo?.color||T.border}`,background:`${especialidadEquipo?.color||"#348FFF"}18`,color:especialidadEquipo?.color||T.sub,cursor:"pointer" }}>
                            {nombre.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {fellowsDisp.length > 0 && (
                    <div>
                      <div style={{ fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4 }}>Fellows</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                        {fellowsDisp.map(f => (
                          <button key={f.nombre} onClick={() => asignar(f.nombre)}
                            style={{ borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:600,border:`1px solid ${f.color}`,background:`${f.color}18`,color:f.color,cursor:"pointer" }}>
                            {f.nombre.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display:"flex",gap:4 }}>
                    <button onClick={() => setOtroMode(true)}
                      style={{ borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:600,border:`1px solid ${T.border}`,background:T.surface2,color:T.sub,cursor:"pointer" }}>
                      Otro
                    </button>
                    <button onClick={() => setAsignando(false)}
                      style={{ borderRadius:99,padding:"3px 10px",fontSize:11,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {asignando && otroMode && (
                <div style={{ display:"flex",gap:6,marginTop:6,alignItems:"center" }}>
                  <input
                    value={otroTexto}
                    onChange={e => setOtroTexto(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter" && otroTexto.trim()) asignar(otroTexto.trim()); }}
                    placeholder="Nombre del asistente..."
                    autoFocus
                    style={{ flex:1,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 10px",fontSize:12,color:T.text,outline:"none",fontFamily:"'Inter',sans-serif" }}
                  />
                  <button onClick={() => otroTexto.trim() && asignar(otroTexto.trim())}
                    style={{ borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:600,background:"#348FFF",color:"#fff",border:"none",cursor:"pointer" }}>✓</button>
                  <button onClick={() => setOtroMode(false)}
                    style={{ borderRadius:8,padding:"4px 10px",fontSize:12,background:"transparent",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer" }}>✕</button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export function TabPabellones({ onBack, T }) {
  const [fecha, setFecha]           = useState(todayISO);
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [equipoSel, setEquipoSel]   = useState(null); // null = todos

  // Fetch summary (becados por rotación) para la semana de la fecha seleccionada
  const monday = useMemo(() => getWeekDates(fecha)[0], [fecha]);
  const summaryParams = useMemo(() => ({ route: "summary", date: monday, token: API_TOKEN }), [monday]);
  const { data: summary } = useApiData(summaryParams);
  const summaryGroups = summary?.groups || {};

  // Cargar tabla quirúrgica cuando cambia la fecha
  useEffect(() => {
    setLoading(true);
    setError(null);
    supabase
      .from("tabla_quirurgica")
      .select("*")
      .eq("fecha", fecha)
      .order("pabellon", { ascending: true })
      .order("hora",     { ascending: true })
      .then(({ data: rows, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return; }
        setData(rows || []);
        setLoading(false);
      });
  }, [fecha]);

  // Filtrar por equipo si hay uno seleccionado
  const equipoActivo = equipoSel ? EQUIPOS.find(e => e.id === equipoSel) : null;
  const esDeAlgunEquipo = (r) => EQUIPOS.some(eq => cirujanoEnEquipo(r.equipo, eq.cirujanos));
  const dataFiltrada = equipoSel === "otros"
    ? data.filter(r => !esDeAlgunEquipo(r))
    : equipoActivo
      ? data.filter(r => cirujanoEnEquipo(r.equipo, equipoActivo.cirujanos))
      : data;

  // Agrupar por pabellón
  const grouped = dataFiltrada.reduce((acc, row) => {
    const key = row.pabellon || "Sin pabellón";
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
  const pabellones = Object.keys(grouped);
  const total      = dataFiltrada.filter(r => !r.cancelada).length;
  const canceladas = dataFiltrada.filter(r => r.cancelada).length;

  const equipoColor = equipoActivo?.color ?? null;

  return (
    <div style={{ minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40 }}>

      {/* Header */}
      <div style={{ position:"sticky",top:0,zIndex:10,background:T.bg,paddingTop:"calc(var(--sat) + 12px)",paddingBottom:10,borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"0 16px" }}>
          <button onClick={onBack} className="press"
            style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",fontSize:13,color:T.sub,fontWeight:500 }}>
            ‹ Volver
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15,fontWeight:700,color:T.text }}>Pabellones</div>
            <div style={{ fontSize:11,color:T.muted,textTransform:"capitalize" }}>{formatDate(fecha)}</div>
          </div>
        </div>

        {/* Navegación fecha */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"8px 16px 0" }}>
          <button className="press" onClick={() => setFecha(f => offsetDate(f, -1))}
            style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 14px",fontSize:16,color:T.sub }}>‹</button>
          <button className="press" onClick={() => setFecha(todayISO())}
            style={{ background:fecha===todayISO()?"#348FFF":T.surface,border:`1px solid ${fecha===todayISO()?"#348FFF":T.border}`,borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:600,color:fecha===todayISO()?"#fff":T.sub }}>
            Hoy
          </button>
          <button className="press" onClick={() => setFecha(f => offsetDate(f, 1))}
            style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 14px",fontSize:16,color:T.sub }}>›</button>
        </div>

        {/* Filtro por equipo */}
        <div style={{ display:"flex",gap:6,padding:"8px 16px 0",overflowX:"auto",scrollbarWidth:"none" }}>
          <button className="press" onClick={() => setEquipoSel(null)}
            style={{ flexShrink:0,borderRadius:99,padding:"5px 12px",fontSize:11,fontWeight:600,border:`1px solid ${!equipoSel?"#348FFF":T.border}`,background:!equipoSel?"#348FFF":T.surface,color:!equipoSel?"#fff":T.sub }}>
            Todos
          </button>
          {EQUIPOS.map(eq => (
            <button key={eq.id} className="press" onClick={() => setEquipoSel(equipoSel===eq.id ? null : eq.id)}
              style={{ flexShrink:0,borderRadius:99,padding:"5px 12px",fontSize:11,fontWeight:600,border:`1px solid ${equipoSel===eq.id?eq.color:T.border}`,background:equipoSel===eq.id?eq.color:T.surface,color:equipoSel===eq.id?"#fff":T.sub }}>
              {eq.nombre}
            </button>
          ))}
          <button className="press" onClick={() => setEquipoSel(equipoSel==="otros" ? null : "otros")}
            style={{ flexShrink:0,borderRadius:99,padding:"5px 12px",fontSize:11,fontWeight:600,border:`1px solid ${equipoSel==="otros"?"#94A3B8":T.border}`,background:equipoSel==="otros"?"#94A3B8":T.surface,color:equipoSel==="otros"?"#fff":T.sub }}>
            Otros
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding:"14px 16px" }}>
        {loading ? (
          <div style={{ display:"flex",justifyContent:"center",paddingTop:60 }}><Spinner/></div>
        ) : error ? (
          <div style={{ textAlign:"center",paddingTop:60,color:"#FF6B6B",fontSize:14 }}>Error: {error}</div>
        ) : pabellones.length === 0 ? (
          <div style={{ textAlign:"center",paddingTop:60 }}>
            <div style={{ fontSize:32,marginBottom:10,opacity:0.2 }}>🔪</div>
            <div style={{ fontSize:14,color:T.muted }}>
              {equipoSel === "otros" ? "Sin cirugías de otros equipos para este día" : equipoSel ? "Sin cirugías de este equipo para este día" : "Sin tabla quirúrgica para este día"}
            </div>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div style={{ display:"flex",gap:8,marginBottom:16 }}>
              <div style={{ flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 12px",textAlign:"center" }}>
                <div style={{ fontSize:20,fontWeight:700,color:equipoColor||T.text }}>{total}</div>
                <div style={{ fontSize:10,color:T.muted }}>cirugías</div>
              </div>
              <div style={{ flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 12px",textAlign:"center" }}>
                <div style={{ fontSize:20,fontWeight:700,color:T.text }}>{pabellones.length}</div>
                <div style={{ fontSize:10,color:T.muted }}>pabellones</div>
              </div>
              {canceladas > 0 && (
                <div style={{ flex:1,background:"#FF6B6B11",border:`1px solid #FF6B6B33`,borderRadius:10,padding:"8px 12px",textAlign:"center" }}>
                  <div style={{ fontSize:20,fontWeight:700,color:"#FF6B6B" }}>{canceladas}</div>
                  <div style={{ fontSize:10,color:"#FF6B6B" }}>canceladas</div>
                </div>
              )}
            </div>

            {/* Pabellones */}
            {pabellones.map((pab, idx) => {
              const color = equipoColor || PABELLON_COLORS[idx % PABELLON_COLORS.length];
              return (
                <div key={pab} style={{ marginBottom:20 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0 }}/>
                    <div style={{ fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color }}>{pab}</div>
                    <div style={{ fontSize:10,color:T.muted,background:T.surface2,borderRadius:99,padding:"1px 7px",border:`1px solid ${T.border}` }}>
                      {grouped[pab].filter(r=>!r.cancelada).length} cirugías
                    </div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                    {grouped[pab].map((r, i) => <PacienteCard key={r.id||i} r={r} color={color} T={T} summaryGroups={summaryGroups}/>)}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
