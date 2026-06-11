import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { bumpDataVersion } from "../lib/supabaseApi.js";
import { todayISO, offsetDate } from "../utils/dates.js";

const ROTS_TODOS_TURNOS = ["H","M","CyP","R","TyP","Col","A","rx","F","CPQ"];
const ROTS_SOLO_NOCHE   = ["T","NHT"];

const TURNO_TABS = [
  { id:"N", label:"Noche",      color:"#4F6EFF" },
  { id:"D", label:"Día",        color:"#F59E0B" },
  { id:"P", label:"Poli",       color:"#06B6D4" },
  { id:"A", label:"Artro",      color:"#72FF00" },
  { id:"S", label:"Seminarios", color:"#E879F9" },
];

const TAG_OPTS = [
  { id:"Seminario Hombro",  label:"Hombro",  color:"#FB923C" },
  { id:"Seminario Mano",    label:"Mano",    color:"#F87171" },
  { id:"Seminario Cadera",  label:"Cadera",  color:"#60A5FA" },
  { id:"Seminario Rodilla", label:"Rodilla", color:"#FACC15" },
  { id:"Seminario Tobillo", label:"Tobillo", color:"#4ADE80" },
  { id:"Seminario Columna", label:"Columna", color:"#C084FC" },
];

const COL_LABELS_7 = ["LUNES","MARTES","MIÉRC","JUEVES","VIERNES","SÁB","DOM"];
const COL_LABELS_5 = ["LUNES","MARTES","MIÉRC","JUEVES","VIERNES"];

function getMondayOfWeek(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  const dow = dt.getDay();
  dt.setDate(dt.getDate() - (dow === 0 ? 6 : dow - 1));
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}

function get4Weeks(monday) {
  const dates = [];
  for (let i = 0; i < 28; i++) dates.push(offsetDate(monday, i));
  return dates;
}

function periodLabel(dates) {
  const months = [...new Set(dates.map(d => d.substring(0,7)))];
  return months.map(m => {
    const [y,mo] = m.split("-").map(Number);
    return new Date(y,mo-1,1).toLocaleDateString("es-CL",{month:"long",year:"numeric"});
  }).join(" / ");
}

function isWeekend(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  const dow = new Date(y,m-1,d).getDay();
  return dow === 0 || dow === 6;
}

function getDow(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d).getDay();
}

// ── BecadoPicker ─────────────────────────────────────────────────────────────
function BecadoPicker({ elegibles, nocheAyer, turnoType, onSelect, onClose, T }) {
  const [poliSub, setPoliSub] = useState(null); // null | "P" | "p"
  const hasConflict = n => (turnoType==="P"||turnoType==="D") && nocheAyer.includes(n);

  // Si es Poli y no eligió AM/PM, mostrar selector primero
  if (turnoType === "P" && poliSub === null) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",
        justifyContent:"flex-end",background:"rgba(0,0,0,0.55)"}} onClick={onClose}>
        <div onClick={e=>e.stopPropagation()} style={{background:T.surface,
          borderRadius:"16px 16px 0 0",padding:"20px 16px calc(var(--sab)+24px)",
          boxShadow:"0 -4px 40px rgba(0,0,0,0.4)"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.muted,letterSpacing:"0.08em",
            textTransform:"uppercase",marginBottom:16}}>
            Tipo de Poli
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="press" onClick={()=>setPoliSub("p")}
              style={{flex:1,padding:"18px 0",borderRadius:12,border:`2px solid #06B6D4`,
                background:"#06B6D415",fontSize:16,fontWeight:700,color:"#06B6D4",cursor:"pointer"}}>
              🌅 Poli AM
            </button>
            <button className="press" onClick={()=>setPoliSub("P")}
              style={{flex:1,padding:"18px 0",borderRadius:12,border:`2px solid #06B6D4`,
                background:"#06B6D415",fontSize:16,fontWeight:700,color:"#06B6D4",cursor:"pointer"}}>
              🌇 Poli PM
            </button>
          </div>
        </div>
      </div>
    );
  }

  const efectivoTipo = turnoType === "P" ? poliSub : turnoType;

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",
      justifyContent:"flex-end",background:"rgba(0,0,0,0.55)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,
        borderRadius:"16px 16px 0 0",maxHeight:"65vh",overflowY:"auto",
        paddingBottom:"calc(var(--sab)+16px)",boxShadow:"0 -4px 40px rgba(0,0,0,0.4)"}}>
        <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${T.border}`,
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>
            Agregar becado
          </span>
          {turnoType === "P" && (
            <span style={{fontSize:13,fontWeight:700,color:"#06B6D4",background:"#06B6D418",
              border:"1px solid #06B6D440",borderRadius:99,padding:"2px 8px",cursor:"pointer"}}
              onClick={()=>setPoliSub(null)}>
              {poliSub==="p"?"🌅 AM":"🌇 PM"} ↩
            </span>
          )}
        </div>
        {elegibles.length === 0 && (
          <div style={{padding:"20px 16px",fontSize:13,color:T.muted}}>No hay becados disponibles</div>
        )}
        {elegibles.map(nombre => {
          const conflicto = hasConflict(nombre);
          return (
            <button key={nombre} className="press"
              onClick={() => !conflicto && onSelect(nombre, efectivoTipo)}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                width:"100%",padding:"12px 16px",border:"none",background:"none",
                textAlign:"left",cursor:conflicto?"not-allowed":"pointer",opacity:conflicto?0.6:1}}>
              <span style={{fontSize:14,fontWeight:500,color:conflicto?"#EF4444":T.text}}>{nombre}</span>
              {conflicto && (
                <span style={{fontSize:12,fontWeight:700,color:"#EF4444",
                  background:"#EF444418",border:"1px solid #EF444440",
                  borderRadius:99,padding:"2px 8px"}}>Noche ayer</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Contadores ────────────────────────────────────────────────────────────────
function Contadores({ turnos, dates, tipo, T }) {
  const COLOR = { P:"#06B6D4", D:"#F59E0B", N:"#4F6EFF", A:"#72FF00" };
  const byBecado = {};
  for (const [date, entries] of Object.entries(turnos)) {
    if (!dates.includes(date)) continue;
    for (const e of entries) {
      const n = e.nombre || e; // soporta ambos formatos
      if (!byBecado[n]) byBecado[n] = [];
      byBecado[n].push(date);
    }
  }
  const entries = Object.entries(byBecado).sort((a,b)=>b[1].length-a[1].length);
  if (!entries.length) return null;

  function gapWarning(fechas) {
    if (tipo !== "N") return false;
    const sorted = [...fechas].sort();
    for (let i = 1; i < sorted.length; i++) {
      const [y1,m1,d1] = sorted[i-1].split("-").map(Number);
      const [y2,m2,d2] = sorted[i].split("-").map(Number);
      if ((new Date(y2,m2-1,d2)-new Date(y1,m1-1,d1))/86400000 < 6) return true;
    }
    return false;
  }

  return (
    <div style={{margin:"16px 0 0",background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,
        fontSize:13,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>
        Conteo del período
      </div>
      <div style={{padding:"6px 0"}}>
        {entries.map(([nombre, fechas]) => {
          const warn = gapWarning(fechas);
          return (
            <div key={nombre} style={{display:"flex",alignItems:"center",
              justifyContent:"space-between",padding:"6px 14px",
              borderBottom:`1px solid ${T.border}20`}}>
              <span style={{fontSize:12,color:warn?"#EF4444":T.text,fontWeight:warn?700:400}}>{nombre}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {warn && <span style={{fontSize:12,color:"#EF4444",fontWeight:700}}>⚠ &lt;6d</span>}
                <span style={{fontSize:12,fontWeight:700,color:COLOR[tipo],
                  background:`${COLOR[tipo]}18`,border:`1px solid ${COLOR[tipo]}30`,
                  borderRadius:99,padding:"2px 9px",minWidth:24,textAlign:"center"}}>
                  {fechas.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SeminarioPicker ───────────────────────────────────────────────────────────
function SeminarioPicker({ existing, onSave, onDelete, onAplazar, onClose, T }) {
  const [tag,       setTag]       = useState(existing?.tag       || "Seminario Hombro");
  const [presenter, setPresenter] = useState(existing?.presentador || "");
  const [titulo,    setTitulo]    = useState(existing?.titulo    || "");
  const [hora,      setHora]      = useState(existing?.hora      || "07:30");

  const canSave = presenter.trim() !== "";

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",
      justifyContent:"flex-end",background:"rgba(0,0,0,0.55)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,
        borderRadius:"16px 16px 0 0",padding:"20px 16px calc(var(--sab)+24px)",
        boxShadow:"0 -4px 40px rgba(0,0,0,0.4)"}}>

        <div style={{fontSize:13,fontWeight:700,color:T.muted,letterSpacing:"0.08em",
          textTransform:"uppercase",marginBottom:14}}>
          {existing ? "Editar seminario" : "Nuevo seminario"}
        </div>

        {/* Tag chips */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:6}}>Rotación</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {TAG_OPTS.map(t => (
              <button key={t.id} className="press" onClick={()=>setTag(t.id)}
                style={{padding:"4px 10px",borderRadius:99,
                  border:`1.5px solid ${tag===t.id?t.color:T.border}`,
                  background:tag===t.id?`${t.color}20`:"transparent",
                  fontSize:13,fontWeight:tag===t.id?700:500,
                  color:tag===t.id?t.color:T.muted,cursor:"pointer"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Presentador — free text */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:6}}>Presentador</div>
          <input value={presenter} onChange={e=>setPresenter(e.target.value)}
            placeholder="Nombre del presentador"
            style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",
              borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,
              color:T.text,fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
        </div>

        {/* Título */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:6}}>Título <span style={{fontWeight:400}}>(opcional)</span></div>
          <input value={titulo} onChange={e=>setTitulo(e.target.value)}
            placeholder="Título del seminario"
            style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",
              borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,
              color:T.text,fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
        </div>

        {/* Hora */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:6}}>Hora</div>
          <input value={hora} onChange={e=>setHora(e.target.value)}
            placeholder="07:30"
            style={{width:110,padding:"10px 12px",borderRadius:10,
              border:`1px solid ${T.border}`,background:T.surface2,
              color:T.text,fontSize:13,outline:"none",
              fontFamily:"'JetBrains Mono',monospace"}}/>
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {existing && (
            <button className="press" onClick={()=>onDelete(existing.id)}
              style={{flex:1,height:44,borderRadius:11,border:`1px solid #EF444440`,
                background:"#EF444418",fontSize:13,fontWeight:600,color:"#EF4444",cursor:"pointer"}}>
              Eliminar
            </button>
          )}
          {existing && (
            <button className="press" onClick={()=>onAplazar(existing.id)}
              style={{flex:1,height:44,borderRadius:11,border:`1px solid #F59E0B40`,
                background:"#F59E0B18",fontSize:13,fontWeight:600,color:"#F59E0B",cursor:"pointer"}}>
              Aplazar →
            </button>
          )}
          <button className="press"
            onClick={()=>canSave && onSave({ tag, presenter:presenter.trim(), titulo:titulo.trim(), hora })}
            disabled={!canSave}
            style={{flexBasis:"100%",height:44,borderRadius:11,border:"none",
              background:canSave?"#E879F9":"#E879F940",
              fontSize:13,fontWeight:700,color:canSave?"#fff":"#ffffff60",
              cursor:canSave?"pointer":"default"}}>
            {existing ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TabEditor ─────────────────────────────────────────────────────────────────
export function TabEditor({ onBack, allowedTipos, T }) {
  const today  = useMemo(() => todayISO(), []);
  const [monday, setMonday]   = useState(() => getMondayOfWeek(today));
  const visibleTabs = allowedTipos?.length ? TURNO_TABS.filter(t => allowedTipos.includes(t.id)) : TURNO_TABS;
  const [tipo, setTipo]       = useState(() => visibleTabs[0]?.id || "N");
  const [picker, setPicker]     = useState(null); // { date }
  const [semPicker, setSemPicker] = useState(null); // { date, existing }
  const [seminarios, setSeminarios] = useState({}); // { date: [{ id, tag, titulo, hora, presentador }] }
  const [saving, setSaving]   = useState(false);
  const [becados, setBecados] = useState([]);
  const [rotMap, setRotMap]   = useState({});
  const [turnos, setTurnos]   = useState({});
  const [nocheMap, setNocheMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]); // máx 5 acciones deshacer
  const [refreshSem, setRefreshSem] = useState(0);

  const dates = useMemo(() => get4Weeks(monday), [monday]);
  const start = dates[0];
  const end   = dates[dates.length-1];

  // Un día extra antes para detectar noche del día anterior al período
  const startMinus1 = offsetDate(start, -1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from("becados").select("id,nombre").order("id"),
      supabase.from("rotaciones")
        .select("becado_id,fecha_inicio,fecha_fin,codigo,becados(nombre)")
        .lte("fecha_inicio", end).gte("fecha_fin", start),
    ]).then(([bRes, rRes]) => {
      setBecados(bRes.data || []);
      const map = {};
      for (const r of rRes.data || []) {
        const nombre = r.becados?.nombre;
        if (!nombre) continue;
        if (!map[nombre]) map[nombre] = [];
        map[nombre].push(r);
      }
      setRotMap(map);
    }).finally(() => setLoading(false));
  }, [monday]);

  useEffect(() => {
    if (tipo === "S") return;
    Promise.all([
      supabase.from("turnos").select("fecha,tipo,becados(nombre)")
        .in("tipo", tipo === "P" ? ["P","p"] : [tipo]).gte("fecha", start).lte("fecha", end),
      supabase.from("turnos").select("fecha,becados(nombre)")
        .eq("tipo","N").gte("fecha", startMinus1).lte("fecha", end),
    ]).then(([tRes, nRes]) => {
      // Guardar { nombre, tipo } para distinguir P/p en Poli
      const tMap = {};
      for (const t of tRes.data||[]) {
        const n = t.becados?.nombre; if (!n) continue;
        if (!tMap[t.fecha]) tMap[t.fecha] = [];
        if (!tMap[t.fecha].find(x=>x.nombre===n)) tMap[t.fecha].push({ nombre:n, tipo:t.tipo });
      }
      setTurnos(tMap);
      const nMap = {};
      for (const n of nRes.data||[]) {
        const nombre = n.becados?.nombre; if (!nombre) continue;
        if (!nMap[n.fecha]) nMap[n.fecha] = [];
        nMap[n.fecha].push(nombre);
      }
      setNocheMap(nMap);
    });
  }, [tipo, monday]);

  function elegiblesParaDia(date, tipoTurno) {
    const allowed = tipoTurno === "N"
      ? [...ROTS_TODOS_TURNOS, ...ROTS_SOLO_NOCHE]
      : ROTS_TODOS_TURNOS;
    return becados.filter(b => {
      const rangos = rotMap[b.nombre] || [];
      return rangos.some(r =>
        allowed.includes(r.codigo) &&
        r.fecha_inicio <= date && r.fecha_fin >= date
      );
    }).map(b => b.nombre);
  }

  function nocheAyer(date) { return nocheMap[offsetDate(date,-1)] || []; }
  function yaAsignados(date) { return turnos[date] || []; } // [{ nombre, tipo }]
  function nombresAsignados(date) { return yaAsignados(date).map(x=>x.nombre); }

  function pushHistorial(entry) {
    setHistorial(prev => [entry, ...prev].slice(0, 5));
  }

  async function handleAdd(date, nombre, tipoEfectivo) {
    setPicker(null); setSaving(true);
    const b = becados.find(b => b.nombre === nombre);
    if (!b) { setSaving(false); return; }
    const t = tipoEfectivo || tipo;
    const { error } = await supabase.from("turnos")
      .upsert({ becado_id: b.id, fecha: date, tipo: t }, { onConflict:"becado_id,fecha,tipo" });
    if (!error) {
      setTurnos(prev => {
        const next = {...prev};
        if (!next[date]) next[date] = [];
        if (!next[date].find(x=>x.nombre===nombre)) next[date] = [...next[date], { nombre, tipo:t }];
        return next;
      });
      pushHistorial({ accion:"remove", date, nombre, tipo:t, becado_id:b.id });
      await bumpDataVersion();
    }
    setSaving(false);
  }

  async function handleRemove(date, nombre, tipoEfectivo) {
    setSaving(true);
    const b = becados.find(b => b.nombre === nombre);
    if (!b) { setSaving(false); return; }
    const t = tipoEfectivo || tipo;
    const { error } = await supabase.from("turnos")
      .delete().eq("becado_id",b.id).eq("fecha",date).eq("tipo", t);
    if (!error) {
      setTurnos(prev => {
        const next = {...prev};
        next[date] = (next[date]||[]).filter(x=>x.nombre!==nombre);
        return next;
      });
      pushHistorial({ accion:"add", date, nombre, tipo:t, becado_id:b.id });
      await bumpDataVersion();
    }
    setSaving(false);
  }

  async function handleUndo() {
    if (!historial.length || saving) return;
    const [last, ...rest] = historial;
    setSaving(true);
    if (last.accion === "remove") {
      // Deshacer un add → borrar
      await supabase.from("turnos")
        .delete().eq("becado_id",last.becado_id).eq("fecha",last.date).eq("tipo",last.tipo);
      setTurnos(prev => {
        const next = {...prev};
        next[last.date] = (next[last.date]||[]).filter(x=>x.nombre!==last.nombre);
        return next;
      });
    } else {
      // Deshacer un remove → re-agregar
      await supabase.from("turnos")
        .upsert({ becado_id:last.becado_id, fecha:last.date, tipo:last.tipo }, { onConflict:"becado_id,fecha,tipo" });
      setTurnos(prev => {
        const next = {...prev};
        if (!next[last.date]) next[last.date] = [];
        if (!next[last.date].find(x=>x.nombre===last.nombre))
          next[last.date] = [...next[last.date], { nombre:last.nombre, tipo:last.tipo }];
        return next;
      });
    }
    setHistorial(rest);
    await bumpDataVersion();
    setSaving(false);
  }

  // Seminarios load
  useEffect(() => {
    if (tipo !== "S") return;
    supabase.from("seminarios")
      .select("id, fecha, tag, titulo, hora, presentador_nombre, presentador_id, becados(nombre)")
      .gte("fecha", start).lte("fecha", end)
      .then(({ data }) => {
        const map = {};
        for (const s of data || []) {
          if (!map[s.fecha]) map[s.fecha] = [];
          map[s.fecha].push({
            id: s.id,
            tag: s.tag,
            titulo: s.titulo || "",
            hora: s.hora || "07:30",
            presentador: s.presentador_nombre || s.becados?.nombre || "",
          });
        }
        setSeminarios(map);
      });
  }, [tipo, monday, refreshSem]);

  async function handleSaveSem(date, { tag, presenter, titulo, hora }, existingId) {
    setSemPicker(null); setSaving(true);
    if (existingId) {
      const { error } = await supabase.from("seminarios")
        .update({ tag, titulo: titulo || null, hora, presentador_nombre: presenter, presentador_id: null })
        .eq("id", existingId);
      if (!error) {
        setSeminarios(prev => {
          const next = {...prev};
          next[date] = (next[date]||[]).map(s =>
            s.id===existingId ? {...s, tag, titulo, hora, presentador: presenter} : s
          );
          return next;
        });
        await bumpDataVersion();
      }
    } else {
      const { data, error } = await supabase.from("seminarios")
        .insert({ fecha: date, tag, titulo: titulo || null, hora, presentador_nombre: presenter, presentador_id: null })
        .select("id").single();
      if (!error && data) {
        setSeminarios(prev => {
          const next = {...prev};
          if (!next[date]) next[date] = [];
          next[date] = [...next[date], { id: data.id, tag, titulo, hora, presentador: presenter }];
          return next;
        });
        await bumpDataVersion();
      }
    }
    setSaving(false);
  }

  async function handleDeleteSem(id, date) {
    setSemPicker(null); setSaving(true);
    const { error } = await supabase.from("seminarios").delete().eq("id", id);
    if (!error) {
      setSeminarios(prev => {
        const next = {...prev};
        next[date] = (next[date]||[]).filter(s => s.id !== id);
        return next;
      });
      await bumpDataVersion();
    }
    setSaving(false);
  }

  async function handleAplazarSem(date) {
    setSemPicker(null); setSaving(true);
    const dow = getDow(date);
    const { data: futuros } = await supabase.from("seminarios")
      .select("id,fecha").gte("fecha", date);
    const aDesplazar = (futuros || []).filter(s => getDow(s.fecha) === dow);
    await Promise.all(
      aDesplazar.map(s =>
        supabase.from("seminarios").update({ fecha: offsetDate(s.fecha, 7) }).eq("id", s.id)
      )
    );
    await bumpDataVersion();
    setSaving(false);
    setRefreshSem(r => r + 1);
  }

  const color = TURNO_TABS.find(t=>t.id===tipo)?.color || T.accent;
  const weekdayOnly = tipo !== "N";
  const COL_LABELS = weekdayOnly ? COL_LABELS_5 : COL_LABELS_7;
  const gridCols   = weekdayOnly ? "repeat(5,1fr)" : "repeat(7,1fr)";

  // Dividir en 4 semanas; para tipos sin finde filtrar Sáb/Dom
  const weeks = useMemo(() => {
    const ws = [];
    for (let i = 0; i < 28; i += 7) {
      const week = dates.slice(i, i+7);
      ws.push(weekdayOnly ? week.filter(d => !isWeekend(d)) : week);
    }
    return ws;
  }, [dates, weekdayOnly]);

  // Número máx de becados en cualquier celda (para altura uniforme)
  // Lo calculamos por semana para que cada semana sea independiente
  function maxForWeek(week) {
    return Math.max(1, ...week.map(date => (turnos[date]||[]).length));
  }

  const isPink = T.accent === "#E8186A";

  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      {/* Header */}
      <div style={{padding:"calc(var(--sat) + 14px) 12px 0",position:"sticky",top:0,
        background:T.bg,zIndex:10,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <button className="press" onClick={onBack}
            style={{width:30,height:30,borderRadius:8,border:`1px solid ${T.border}`,
              background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase"}}>{tipo==="S"?"Editor de seminarios":"Editor de turnos"}</div>
            <div style={{fontSize:12,fontWeight:600,color:T.sub,textTransform:"capitalize"}}>
              {periodLabel(dates)}
            </div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
            {historial.length > 0 && (
              <button className="press" onClick={handleUndo} disabled={saving}
                style={{display:"flex",alignItems:"center",gap:4,height:28,padding:"0 10px",
                  borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,
                  fontSize:13,fontWeight:600,color:saving?T.muted:T.text,cursor:saving?"not-allowed":"pointer"}}>
                ↩ <span style={{fontSize:12,color:T.muted}}>({historial.length})</span>
              </button>
            )}
            {saving && <div style={{fontSize:12,color:T.muted}}>Guardando…</div>}
          </div>
        </div>

        {/* Tipo tabs */}
        <div style={{display:"flex",gap:5,marginBottom:10,background:T.surface2,borderRadius:10,padding:3}}>
          {visibleTabs.map(tab => (
            <button key={tab.id} className="press" onClick={() => { setTipo(tab.id); setHistorial([]); }}
              style={{flex:1,height:28,borderRadius:8,border:"none",
                background: tipo===tab.id ? tab.color : "transparent",
                fontSize:13,fontWeight:tipo===tab.id?700:500,
                color: tipo===tab.id?"#fff":T.muted,transition:"all 0.15s"}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Nav período */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <button className="press" onClick={()=>{ setHistorial([]); setMonday(d=>offsetDate(d,-28)); }}
            style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.border}`,
              background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,color:T.sub,flexShrink:0}}>‹</button>
          {getMondayOfWeek(today) !== monday && (
            <button className="press" onClick={()=>setMonday(getMondayOfWeek(today))}
              style={{height:28,padding:"0 10px",borderRadius:7,border:`1px solid ${color}60`,
                background:`${color}14`,fontSize:12,fontWeight:700,color,flexShrink:0}}>
              HOY
            </button>
          )}
          <div style={{flex:1}}/>
          <button className="press" onClick={()=>{ setHistorial([]); setMonday(d=>offsetDate(d,28)); }}
            style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.border}`,
              background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,color:T.sub,flexShrink:0}}>›</button>
        </div>

        {/* Leyenda AM/PM para Poli */}
        {tipo === "P" && (
          <div style={{display:"flex",gap:10,marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:"#0EA5E9"}}/>
              <span style={{fontSize:12,color:T.muted}}>AM</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:"#06B6D4"}}/>
              <span style={{fontSize:12,color:T.muted}}>PM</span>
            </div>
          </div>
        )}

        {/* Cabecera días */}
        <div style={{display:"grid",gridTemplateColumns:gridCols,gap:1,marginBottom:2}}>
          {COL_LABELS.map((label,i) => (
            <div key={i} style={{textAlign:"center",fontSize:13,fontWeight:700,
              letterSpacing:"0.04em",padding:"4px 2px",
              color: T.text,
              background: `${color}18`,
              borderRadius:4}}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{padding:"8px 12px 40px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>Cargando…</div>
        ) : tipo === "S" ? (
          // ── Seminarios grid ──
          <>
            {weeks.map((week, wi) => {
              const maxSems = Math.max(1, ...week.map(date => (seminarios[date]||[]).length));
              return (
                <div key={wi} style={{marginBottom:4}}>
                  {/* Fila de números */}
                  <div style={{display:"grid",gridTemplateColumns:gridCols,gap:1,marginBottom:1}}>
                    {week.map(date => {
                      const dayNum = Number(date.split("-")[2]);
                      const weekend = isWeekend(date);
                      const isToday = date === today;
                      return (
                        <div key={date} style={{textAlign:"center",fontSize:13,fontWeight:800,
                          padding:"4px 2px 2px",
                          color:isToday?"#fff":weekend?T.muted:T.text,
                          background:isToday?"#E879F9":weekend?T.surface2:T.surface,
                          borderRadius:"4px 4px 0 0",fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>

                  {/* Filas de seminarios */}
                  {Array.from({length: maxSems}).map((_, rowIdx) => (
                    <div key={rowIdx} style={{display:"grid",gridTemplateColumns:gridCols,gap:1,marginBottom:1}}>
                      {week.map(date => {
                        const sems = seminarios[date] || [];
                        const sem = sems[rowIdx];
                        const tagOpt = TAG_OPTS.find(t => t.id === sem?.tag);
                        return (
                          <div key={date} style={{minHeight:36,background:T.surface,
                            display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {sem && (
                              <button className="press"
                                onClick={() => setSemPicker({date, existing: sem})}
                                style={{width:"100%",height:"100%",minHeight:36,border:"none",
                                  background:"none",padding:"3px 3px",cursor:"pointer",
                                  display:"flex",flexDirection:"column",alignItems:"center",
                                  justifyContent:"center",gap:1}}>
                                <div style={{fontSize:12,fontWeight:700,
                                  color:tagOpt?.color||"#E879F9",lineHeight:1.2,
                                  background:`${tagOpt?.color||"#E879F9"}18`,
                                  borderRadius:3,padding:"1px 4px"}}>
                                  {tagOpt?.label||sem.tag}
                                </div>
                                <div style={{fontSize:12,color:T.sub,lineHeight:1.2,
                                  maxWidth:"100%",overflow:"hidden",
                                  textOverflow:"ellipsis",whiteSpace:"nowrap",
                                  padding:"0 2px"}}>
                                  {sem.presentador}
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Fila de botones + */}
                  <div style={{display:"grid",gridTemplateColumns:gridCols,gap:1,marginBottom:8}}>
                    {week.map(date => {
                      const weekend = isWeekend(date);
                      return (
                        <div key={date} style={{background:weekend?T.surface2:T.surface,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          padding:"3px 0",borderRadius:"0 0 4px 4px"}}>
                          {!weekend && (
                            <button className="press"
                              onClick={() => setSemPicker({date, existing:null})}
                              style={{width:18,height:18,borderRadius:99,
                                border:"1.5px dashed #E879F980",background:"transparent",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontSize:13,color:"#E879F9",cursor:"pointer",lineHeight:1}}>+</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {weeks.map((week, wi) => {
              const maxRows = maxForWeek(week);
              return (
                <div key={wi} style={{marginBottom:4}}>
                  {/* Fila de números de día */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:1}}>
                    {week.map(date => {
                      const dayNum = Number(date.split("-")[2]);
                      const weekend = isWeekend(date);
                      const isToday = date === today;
                      return (
                        <div key={date} style={{
                          textAlign:"center",
                          fontSize:13,fontWeight:800,
                          padding:"4px 2px 2px",
                          color: isToday ? "#fff" : weekend ? T.muted : T.text,
                          background: isToday ? color : weekend ? T.surface2 : T.surface,
                          borderRadius:"4px 4px 0 0",
                          fontFamily:"'Bricolage Grotesque',sans-serif",
                        }}>
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>

                  {/* Filas de becados */}
                  {Array.from({length: maxRows}).map((_, rowIdx) => (
                    <div key={rowIdx} style={{display:"grid",gridTemplateColumns:gridCols,gap:1,marginBottom:1}}>
                      {week.map(date => {
                        const weekend = isWeekend(date);
                        const asignados = yaAsignados(date);
                        const entry = asignados[rowIdx]; // { nombre, tipo }
                        const nombre = entry?.nombre;
                        const entryTipo = entry?.tipo;
                        const nAyer = nocheAyer(date);
                        const conflicto = nombre && (tipo==="P"||tipo==="D") && nAyer.includes(nombre);
                        // Poli AM (#0EA5E9 más claro) vs Poli PM (#06B6D4 normal)
                        const isAM = tipo==="P" && entryTipo==="p";
                        const entryColor = conflicto ? "#EF4444" : isAM ? "#0EA5E9" : color;
                        const entryBg   = conflicto ? "#EF444428" : isAM ? "#0EA5E915" : nombre ? `${color}15` : T.surface;

                        return (
                          <div key={date} style={{
                            minHeight:26,
                            background: weekend && !nombre ? T.surface2 : entryBg,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            position:"relative",
                          }}>
                            {nombre ? (
                              <button className="press" onClick={() => handleRemove(date, nombre, entryTipo)}
                                style={{
                                  width:"100%",height:"100%",border:"none",background:"none",
                                  padding:"2px 3px",cursor:"pointer",
                                  fontSize:12,fontWeight:600,textAlign:"center",
                                  color: entryColor,
                                  lineHeight:1.2,
                                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                                  display:"block",
                                }}>
                                {conflicto && "⚠ "}{nombre}
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Fila de botones + */}
                  <div style={{display:"grid",gridTemplateColumns:gridCols,gap:1,marginBottom:8}}>
                    {week.map(date => {
                      const weekend = isWeekend(date);
                      const elegibles = elegiblesParaDia(date, tipo).filter(n=>!nombresAsignados(date).includes(n));
                      const disabled = elegibles.length === 0 || (weekend && tipo!=="N" && tipo!=="A");
                      return (
                        <div key={date} style={{
                          background: weekend ? T.surface2 : T.surface,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          padding:"3px 0",borderRadius:"0 0 4px 4px",
                        }}>
                          {!disabled && (
                            <button className="press" onClick={() => setPicker({date})}
                              style={{
                                width:18,height:18,borderRadius:99,
                                border:`1.5px dashed ${color}80`,background:"transparent",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontSize:13,color,cursor:"pointer",lineHeight:1,
                              }}>+</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <Contadores turnos={turnos} dates={dates} tipo={tipo} T={T}/>
          </>
        )}
      </div>

      {semPicker && (
        <SeminarioPicker
          existing={semPicker.existing}
          onSave={vals => handleSaveSem(semPicker.date, vals, semPicker.existing?.id)}
          onDelete={id => handleDeleteSem(id, semPicker.date)}
          onAplazar={() => handleAplazarSem(semPicker.date)}
          onClose={() => setSemPicker(null)}
          T={T}
        />
      )}
      {picker && (
        <BecadoPicker
          elegibles={elegiblesParaDia(picker.date, tipo).filter(n=>!nombresAsignados(picker.date).includes(n))}
          nocheAyer={nocheAyer(picker.date)}
          turnoType={tipo}
          onSelect={(n,t)=>handleAdd(picker.date,n,t)}
          onClose={()=>setPicker(null)}
          T={T}
        />
      )}
    </div>
  );
}
