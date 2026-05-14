/**
 * Capa de datos Supabase — reemplaza las rutas de code.gs
 * Misma firma de respuesta que el GAS para compatibilidad con el frontend.
 */
import { supabase } from "./supabase.js";

// ── bumpDataVersion ───────────────────────────────────────────────────────────
// Llamar después de cualquier escritura (editar turno, rotación, etc.)
// para que todos los clientes limpien su caché la próxima vez que abran la app.
export async function bumpDataVersion() {
  await supabase
    .from("config")
    .upsert({ key: "data_version", value: String(Date.now()) }, { onConflict: "key" });
}

const SEMINARIO_DIA = {
  2: "Seminario Hombro",   // Martes
  3: "Seminario Rodilla",  // Miércoles
  4: "Seminario Mano",     // Jueves
};

function weekdayEs(date) {
  return ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"][date.getDay()];
}

// ── getBecados ────────────────────────────────────────────────────────────────
export async function getBecados() {
  const { data, error } = await supabase
    .from("becados")
    .select("nombre")
    .order("id");
  if (error) throw error;
  return { ok: true, becados: data.map(b => b.nombre) };
}

// ── getDaily ──────────────────────────────────────────────────────────────────
export async function getDaily(becado, dateStr) {
  const date    = new Date(dateStr + "T12:00:00");
  const weekday = weekdayEs(date);
  const dow     = date.getDay();

  // Becado id
  const { data: bData, error: bErr } = await supabase
    .from("becados").select("id").eq("nombre", becado).single();
  if (bErr || !bData) return { ok: false, becado, date: dateStr, error: "Becado no encontrado" };
  const becadoId = bData.id;

  // Rotación del día (buscar rango que contenga la fecha)
  const { data: rData } = await supabase
    .from("rotaciones")
    .select("codigo")
    .eq("becado_id", becadoId)
    .lte("fecha_inicio", dateStr)
    .gte("fecha_fin", dateStr)
    .single();
  const rotationCode = rData?.codigo || "";

  // Turnos del día
  const { data: tData } = await supabase
    .from("turnos")
    .select("tipo")
    .eq("becado_id", becadoId)
    .eq("fecha", dateStr);
  const tipos = (tData || []).map(t => t.tipo);
  const turno = {
    diaCode:   tipos.find(t => t === "D" || t === "P" || t === "p") || null,
    nocheCode: tipos.find(t => t === "N") || null,
    artroCode: tipos.find(t => t === "A") || null,
  };

  // Seminario
  let seminario = null;
  const semTag = SEMINARIO_DIA[dow];
  if (semTag && rotationCode) {
    const { data: sData } = await supabase
      .from("seminarios")
      .select("titulo, tag, hora, presentador_id, becados(nombre)")
      .eq("fecha", dateStr)
      .eq("tag", semTag)
      .single();
    if (sData) {
      seminario = {
        presenter: sData.becados?.nombre || "",
        title: sData.titulo,
        tag: sData.tag,
        time: sData.hora,
      };
    }
  }

  // Horario del día (items de actividad)
  let items = [];
  if (rotationCode && !["V","I","A","rx","F","T","CPQ"].includes(rotationCode)) {
    const { data: hData } = await supabase
      .from("horario_items")
      .select("hora, actividad")
      .eq("rotacion_codigo", rotationCode)
      .eq("dia_semana", weekday)
      .order("hora");
    items = (hData || []).map(h => ({ time: h.hora, activity: h.actividad }));
  }

  const ROTATION_NAMES = {
    H:"Hombro", M:"Mano", CyP:"Cadera", R:"Rodilla",
    TyP:"Tobillo y Pie", Col:"Columna", I:"Infantil",
    A:"Anestesia", rx:"Radiología", F:"Fisiatría",
    V:"Vacaciones", T:"Tumores", CPQ:"Cirugía Plástica",
  };

  return {
    ok: true, becado, date: dateStr, weekday,
    rotationCode,
    rotationName: ROTATION_NAMES[rotationCode] || rotationCode,
    items, turno, seminario,
  };
}

// ── getWeek ───────────────────────────────────────────────────────────────────
export async function getWeek(becado, startDateStr) {
  const [y, m, d] = startDateStr.split("-").map(Number);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt  = new Date(y, m - 1, d + i);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    days.push(await getDaily(becado, iso));
  }
  return { ok: true, becado, start: startDateStr, days };
}

// ── getSummary ────────────────────────────────────────────────────────────────
export async function getSummary(dateStr) {
  const { data, error } = await supabase
    .from("rotaciones")
    .select("codigo, becados(nombre)")
    .lte("fecha_inicio", dateStr)
    .gte("fecha_fin", dateStr);
  if (error) throw error;

  const groups = {};
  for (const row of data) {
    const code   = row.codigo || "";
    const nombre = row.becados?.nombre;
    if (!nombre) continue;
    if (!groups[code]) groups[code] = [];
    groups[code].push(nombre);
  }
  return { ok: true, date: dateStr, groups };
}

// ── getPersonalMonth ──────────────────────────────────────────────────────────
export async function getPersonalMonth(becado, monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const start  = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end    = `${monthStr}-${String(lastDay).padStart(2,"0")}`;

  const { data: bData, error: bErr } = await supabase
    .from("becados").select("id").eq("nombre", becado).single();
  if (bErr || !bData) return { ok: false, error: "Becado no encontrado" };
  const becadoId = bData.id;

  // Rotaciones del mes (rangos que se solapan con el mes)
  const { data: rData } = await supabase
    .from("rotaciones")
    .select("fecha_inicio, fecha_fin, codigo")
    .eq("becado_id", becadoId)
    .lte("fecha_inicio", end)
    .gte("fecha_fin", start);

  // Turnos del mes
  const { data: tData } = await supabase
    .from("turnos")
    .select("fecha, tipo")
    .eq("becado_id", becadoId)
    .gte("fecha", start)
    .lte("fecha", end);

  // Seminarios del mes
  const { data: sData } = await supabase
    .from("seminarios")
    .select("fecha, titulo, tag, hora, becados(nombre)")
    .gte("fecha", start)
    .lte("fecha", end);

  // Construir lookup por día
  const turnosByDay   = {};
  const semByDay      = {};

  for (const t of tData || []) {
    if (!turnosByDay[t.fecha]) turnosByDay[t.fecha] = [];
    turnosByDay[t.fecha].push(t.tipo);
  }
  for (const s of sData || []) {
    semByDay[s.fecha] = {
      presenter: s.becados?.nombre || "",
      title: s.titulo,
      tag: s.tag,
      time: s.hora,
    };
  }

  // Función para obtener rotación de un día dado los rangos
  function getRotForDate(iso) {
    const found = (rData || []).find(r => r.fecha_inicio <= iso && r.fecha_fin >= iso);
    return found?.codigo || "";
  }

  const daysInMonth = new Date(y, m, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso  = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const tipos = turnosByDay[iso] || [];
    const sem   = semByDay[iso] || null;
    days.push({
      date:         iso,
      rotationCode: getRotForDate(iso),
      diaCode:      tipos.find(t => t === "D" || t === "P" || t === "p") || null,
      nocheCode:    tipos.find(t => t === "N") || null,
      artroCode:    tipos.find(t => t === "A") || null,
      hasSeminar:   !!sem,
      seminario:    sem,
    });
  }

  return { ok: true, becado, month: monthStr, days };
}

// ── getMonthly ────────────────────────────────────────────────────────────────
export async function getMonthly(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const start  = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end    = `${monthStr}-${String(lastDay).padStart(2,"0")}`; // último día del mes

  // Turnos del mes
  const { data: tData, error: tErr } = await supabase
    .from("turnos")
    .select("fecha, tipo, becados(nombre)")
    .gte("fecha", start)
    .lte("fecha", end);
  if (tErr) throw tErr;

  const entries = (tData || []).map(t => ({
    date: t.fecha,
    name: t.becados?.nombre || "",
    type: t.tipo,
  }));

  // Seminarios del mes
  const { data: sData } = await supabase
    .from("seminarios")
    .select("fecha, titulo, tag, hora, becados(nombre)")
    .gte("fecha", start)
    .lte("fecha", end);

  for (const s of sData || []) {
    entries.push({
      date: s.fecha,
      name: s.becados?.nombre || "",
      type: "S",
      title: s.titulo,
      tag: s.tag,
      time: s.hora,
    });
  }

  return { ok: true, month: monthStr, entries };
}
