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

// ── Catálogo de temas de seminarios (config.temas_catalogo, JSON) ───────────────
export async function getTemasCatalogo() {
  const { data } = await supabase
    .from("config").select("value").eq("key", "temas_catalogo").single();
  if (!data?.value) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

export async function saveTemasCatalogo(catalogo) {
  const { error } = await supabase
    .from("config")
    .upsert({ key: "temas_catalogo", value: JSON.stringify(catalogo) }, { onConflict: "key" });
  return !error;
}

// ── Avatares: partes personalizables compartidas (config.avatares, JSON) ────────
// Estructura: { becado: { ropa, zapatos, aros, sombrero, mascara } }
export async function getAvatares() {
  const { data } = await supabase
    .from("config").select("value").eq("key", "avatares").single();
  if (!data?.value) return {};
  try { return JSON.parse(data.value); } catch { return {}; }
}

export async function saveAvatares(avatares) {
  const { error } = await supabase
    .from("config")
    .upsert({ key: "avatares", value: JSON.stringify(avatares) }, { onConflict: "key" });
  return !error;
}

const SEMINARIO_DIA = {
  2: "Seminario Hombro",   // Martes
  3: "Seminario Rodilla",  // Miércoles
  4: "Seminario Mano",     // Jueves
};

function weekdayEs(date) {
  return ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"][date.getDay()];
}

// Catálogo de horario (config.horario_catalogo, JSON) — cacheado en memoria por sesión.
// Estructura: { rotCode: { "1".."7": [{ i:"08:00", f:"18:00", act:"...", lugar:"pabellones"|null }] } }
let _horarioCatalogo = null;
async function loadHorarioCatalogo() {
  if (_horarioCatalogo) return _horarioCatalogo;
  const { data } = await supabase.from("config").select("value").eq("key", "horario_catalogo").single();
  try { _horarioCatalogo = data?.value ? JSON.parse(data.value) : {}; } catch { _horarioCatalogo = {}; }
  return _horarioCatalogo;
}
// Expande bloques por rango a ítems por hora — mismo formato de antes {time, activity} (+ lugar)
function expandHorario(blocks) {
  const out = [];
  for (const b of blocks || []) {
    const hi = parseInt(String(b.i).slice(0, 2), 10);
    const hf = parseInt(String(b.f).slice(0, 2), 10);
    for (let h = hi; h <= hf; h++) {
      out.push({ time: `${String(h).padStart(2, "0")}:00`, activity: b.act, lugar: b.lugar ?? null });
    }
  }
  return out;
}

// ── getActividadesDia ────────────────────────────────────────────────────────
// Actividades especiales (agregadas en el editor, tipo "curso CPQ" genérico),
// visibles solo para el público (lista de nombres) elegido al crearlas.
export async function getActividadesDia(becado, dateStr) {
  const { data, error } = await supabase
    .from("actividades")
    .select("id, hora, titulo, color")
    .eq("fecha", dateStr)
    .contains("becados", [becado])
    .order("hora", { ascending: true, nullsFirst: false });
  if (error) return [];
  return data || [];
}

// Igual que getActividadesDia pero para un rango de fechas (semana/mes) — devuelve
// { fecha: [{id,hora,titulo,color}, ...] }
export async function getActividadesRango(becado, startDate, endDate) {
  const { data, error } = await supabase
    .from("actividades")
    .select("id, fecha, hora, titulo, color")
    .gte("fecha", startDate).lte("fecha", endDate)
    .contains("becados", [becado])
    .order("hora", { ascending: true, nullsFirst: false });
  if (error) return {};
  const map = {};
  for (const a of data || []) {
    if (!map[a.fecha]) map[a.fecha] = [];
    map[a.fecha].push(a);
  }
  return map;
}

// ── Juego de seminarios (números al azar + puntaje en vivo) ────────────────────
// Solo los 15 becados de UNAB participan; "Gonzalez" es el moderador (no compite).
// Se guarda todo en config (mismo mecanismo que temas_catalogo/avatares) para no
// necesitar tablas nuevas ni permisos de administración sobre la base.
export const SEMINARIO_MODERADOR = "Gonzalez";

async function getConfigJSON(key, fallback) {
  const { data } = await supabase.from("config").select("value").eq("key", key).single();
  if (!data?.value) return fallback;
  try { return JSON.parse(data.value); } catch { return fallback; }
}
async function setConfigJSON(key, obj) {
  const { error } = await supabase
    .from("config").upsert({ key, value: JSON.stringify(obj) }, { onConflict: "key" });
  return !error;
}

export async function getSeminarioBecadosUNAB() {
  const { data, error } = await supabase
    .from("becados").select("id,nombre").order("id").limit(15);
  if (error) return [];
  return data || [];
}

// Devuelve el número (1-14) asignado a un becado. Si todavía no se ha repartido
// ningún número, reparte un número al azar (sin repetir) a todos los
// participantes (los 15 de UNAB menos el moderador) de una sola vez.
export async function getOrAssignSeminarioNumero(becadoId) {
  const numeros = await getConfigJSON("seminario_numeros", {});
  if (numeros[becadoId] != null) return numeros[becadoId];

  const becados = await getSeminarioBecadosUNAB();
  const participantes = becados.filter(b => b.nombre !== SEMINARIO_MODERADOR);
  const usados = new Set(Object.values(numeros));
  const faltantes = participantes.filter(p => numeros[p.id] == null);

  if (faltantes.length > 0) {
    const disponibles = Array.from({ length: 14 }, (_, i) => i + 1).filter(n => !usados.has(n));
    for (let i = disponibles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
    }
    faltantes.forEach((p, idx) => { numeros[p.id] = disponibles[idx]; });
    await setConfigJSON("seminario_numeros", numeros);
  }

  return numeros[becadoId] ?? null;
}

export async function getSeminarioPuntosPorBecado() {
  return await getConfigJSON("seminario_puntos", {});
}

// Ranking de puntaje, de mayor a menor — se lee directo de Supabase (no manipulable
// desde el cliente salvo por addSeminarioPuntos, que usa el mismo mecanismo).
export async function getSeminarioRanking() {
  const [puntos, becados] = await Promise.all([
    getConfigJSON("seminario_puntos", {}),
    getSeminarioBecadosUNAB(),
  ]);
  const nombrePorId = Object.fromEntries(becados.map(b => [b.id, b.nombre]));
  return Object.entries(puntos)
    .map(([id, p]) => ({ nombre: nombrePorId[id] || "?", puntos: p }))
    .sort((a, b) => b.puntos - a.puntos);
}

export async function addSeminarioPuntos(becadoId, delta) {
  const puntos = await getConfigJSON("seminario_puntos", {});
  puntos[becadoId] = (puntos[becadoId] || 0) + delta;
  return await setConfigJSON("seminario_puntos", puntos);
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
      .select("titulo, tag, hora, presentador_nombre, presentador_id, becados(nombre)")
      .eq("fecha", dateStr)
      .eq("tag", semTag)
      .single();
    if (sData) {
      seminario = {
        presenter: sData.presentador_nombre || sData.becados?.nombre || "",
        title: sData.titulo,
        tag: sData.tag,
        time: sData.hora,
      };
    }
  }

  // Horario del día (items de actividad) — desde el catálogo (rangos → bloques horarios)
  let items = [];
  if (rotationCode && !["V","I","A","rx","F","T","CPQ","TMT"].includes(rotationCode)) {
    const dia = dow === 0 ? 7 : dow; // getDay: 0=Dom..6=Sáb → 1=Lun..7=Dom
    const cat = await loadHorarioCatalogo();
    const blocks = cat?.[rotationCode]?.[String(dia)];
    if (blocks) {
      items = expandHorario(blocks);
    } else {
      // Fallback defensivo a la tabla vieja (por si el catálogo no está)
      const { data: hData } = await supabase
        .from("horario_items")
        .select("hora, actividad")
        .eq("rotacion_codigo", rotationCode)
        .eq("dia_semana", weekday)
        .order("hora");
      items = (hData || []).map(h => ({ time: h.hora, activity: h.actividad }));
    }
  }

  const ROTATION_NAMES = {
    H:"Hombro", M:"Mano", CyP:"Cadera", R:"Rodilla",
    TyP:"Tobillo y Pie", Col:"Columna", I:"Infantil",
    A:"Anestesia", rx:"Radiología", F:"Fisiatría",
    V:"Vacaciones", T:"Tumores", CPQ:"Cirugía Plástica",
    TMT:"TMT General",
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
    try {
      days.push(await getDaily(becado, iso));
    } catch {
      days.push({ ok: false, becado, date: iso, error: "Error al cargar día" });
    }
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
    .select("fecha, titulo, tag, hora, presentador_nombre, becados(nombre)")
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
      presenter: s.presentador_nombre || s.becados?.nombre || "",
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
    .select("fecha, titulo, tag, hora, presentador_nombre, becados(nombre)")
    .gte("fecha", start)
    .lte("fecha", end);

  for (const s of sData || []) {
    entries.push({
      date: s.fecha,
      name: s.presentador_nombre || s.becados?.nombre || "",
      type: "S",
      title: s.titulo,
      tag: s.tag,
      time: s.hora,
    });
  }

  return { ok: true, month: monthStr, entries };
}
