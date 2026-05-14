/**
 * Script de migración: Excel → Supabase
 * Ejecutar: node scripts/migrate.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import xlsx from "xlsx";

const SUPABASE_URL = "https://tjngqcymvpcngedbyzvb.supabase.co";
// IMPORTANTE: usar service_role key solo para migración, nunca commitear
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const XLSX_PATH = "C:/Users/agust/Desktop/Calendario.xlsx";

// Universidad y año por índice (según universities.js)
function getUnivAnio(idx) {
  if (idx <= 4)  return { universidad: "UNAB",   anio: 3 };
  if (idx <= 9)  return { universidad: "UNAB",   anio: 2 };
  if (idx <= 14) return { universidad: "UNAB",   anio: 1 };
  if (idx <= 20) return { universidad: "UANDES", anio: 3 };
  if (idx <= 26) return { universidad: "UANDES", anio: 2 };
  if (idx <= 32) return { universidad: "UANDES", anio: 1 };
  return { universidad: "IST", anio: 1 };
}

function excelDateToISO(v) {
  if (!v) return null;
  const d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  // Excel dates llegan como UTC midnight — usar UTC para evitar desfase
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  const wb = xlsx.readFile(XLSX_PATH, { cellDates: true });

  // ── 1. BECADOS ──────────────────────────────────────────────────────────────
  console.log("Migrando becados...");
  const rotSheet = wb.Sheets["Rotaciones"];
  const rotData  = xlsx.utils.sheet_to_json(rotSheet, { header: 1 });
  const names    = rotData.slice(3).map(r => (r[0] || "").toString().trim()).filter(x => x);

  const becadosRows = names.map((nombre, idx) => ({
    nombre,
    ...getUnivAnio(idx),
  }));

  const { error: e1 } = await supabase.from("becados").upsert(becadosRows, { onConflict: "nombre" });
  if (e1) { console.error("Error becados:", e1); return; }
  console.log(`  ✓ ${becadosRows.length} becados`);

  // Obtener IDs
  const { data: becadosList } = await supabase.from("becados").select("id, nombre");
  const idByName = Object.fromEntries(becadosList.map(b => [b.nombre, b.id]));

  // ── 2. ROTACIONES (como rangos) ────────────────────────────────────────────
  console.log("Migrando rotaciones como rangos...");
  const dateRow = rotData[2].slice(1); // fila 3 = fechas
  const rotRows = [];

  for (let ri = 3; ri < rotData.length; ri++) {
    const row    = rotData[ri];
    const nombre = (row[0] || "").toString().trim();
    if (!nombre || !idByName[nombre]) continue;
    const becadoId = idByName[nombre];

    // Detectar rangos continuos del mismo código
    let rangeStart = null;
    let rangeCodigo = null;

    for (let ci = 0; ci <= dateRow.length; ci++) {
      const iso = ci < dateRow.length ? excelDateToISO(dateRow[ci]) : null;
      let codigo = ci < dateRow.length ? (row[ci + 1] || "").toString().trim() : null;
      if (codigo && codigo.toUpperCase() === "RX") codigo = "rx";
      if (!iso) codigo = null;

      if (codigo === rangeCodigo && iso !== null) {
        // Continúa el mismo rango — solo actualizamos el fin implícitamente
        continue;
      }

      // Fin del rango anterior
      if (rangeStart !== null && rangeCodigo) {
        const prevIso = excelDateToISO(dateRow[ci - 1]);
        rotRows.push({
          becado_id:    becadoId,
          fecha_inicio: rangeStart,
          fecha_fin:    prevIso,
          codigo:       rangeCodigo,
        });
      }

      rangeStart  = iso;
      rangeCodigo = codigo;
    }
  }

  for (let i = 0; i < rotRows.length; i += 500) {
    const { error } = await supabase.from("rotaciones").upsert(rotRows.slice(i, i + 500), { onConflict: "becado_id,fecha_inicio,codigo" });
    if (error) console.error("Error rotaciones batch:", error);
  }
  console.log(`  ✓ ${rotRows.length} rangos de rotación`);

  // ── 3. TURNOS ──────────────────────────────────────────────────────────────
  console.log("Migrando turnos...");
  const TURNO_SHEETS = [
    { name: "Dia",         tipos: { P: "P", p: "p", D: "D" } },
    { name: "Noche",       tipos: { N: "N" } },
    { name: "Artroscopia", tipos: { A: "A" } },
  ];

  const turnoRows = [];
  for (const def of TURNO_SHEETS) {
    const ws   = wb.Sheets[def.name];
    if (!ws) continue;
    const data = xlsx.utils.sheet_to_json(ws, { header: 1, cellDates: true });
    const dRow = data[2].slice(1);

    for (let ri = 3; ri < data.length; ri++) {
      const row    = data[ri];
      const nombre = (row[0] || "").toString().trim();
      if (!nombre || !idByName[nombre]) continue;
      const becadoId = idByName[nombre];

      for (let ci = 0; ci < dRow.length; ci++) {
        const iso  = excelDateToISO(dRow[ci]);
        if (!iso) continue;
        const val  = (row[ci + 1] || "").toString().trim();
        const tipo = def.tipos[val];
        if (!tipo) continue;
        turnoRows.push({ becado_id: becadoId, fecha: iso, tipo });
      }
    }
  }

  for (let i = 0; i < turnoRows.length; i += 500) {
    const { error } = await supabase.from("turnos").upsert(turnoRows.slice(i, i + 500), { onConflict: "becado_id,fecha,tipo" });
    if (error) console.error("Error turnos batch:", error);
  }
  console.log(`  ✓ ${turnoRows.length} turnos`);

  // ── 4. SEMINARIOS ──────────────────────────────────────────────────────────
  console.log("Migrando seminarios...");
  const SEMINARIO_DIA = { 2: "Seminario Hombro", 3: "Seminario Rodilla", 4: "Seminario Mano" };
  const semWs   = wb.Sheets["Seminarios"];
  const semData = semWs ? xlsx.utils.sheet_to_json(semWs, { header: 1, cellDates: true }) : [];
  const semRows = [];
  const semDRow = semData[2]?.slice(1) || [];

  for (let ci = 0; ci < semDRow.length; ci++) {
    const iso = excelDateToISO(semDRow[ci]);
    if (!iso) continue;
    const [iy, im, id] = iso.split("-").map(Number);
    const dow = new Date(iy, im - 1, id).getDay();
    const tag = SEMINARIO_DIA[dow];
    if (!tag) continue;
    const col = ci + 1;

    for (let ri = 3; ri < semData.length; ri++) {
      const row = semData[ri];
      const raw = (row[col] || "").toString().trim();
      if (!raw) continue;
      const nombre     = (row[0] || "").toString().trim();
      const is745      = raw.startsWith("7:45");
      const titulo     = is745 ? raw.replace(/^7:45\s*/, "").trim() : raw;
      const hora       = is745 ? "07:45" : "07:30";
      const presId     = idByName[nombre] || null;
      semRows.push({ fecha: iso, presentador_id: presId, titulo, tag, hora });
      break;
    }
  }

  for (let i = 0; i < semRows.length; i += 500) {
    const { error } = await supabase.from("seminarios").upsert(semRows.slice(i, i + 500), { onConflict: "fecha,tag" });
    if (error) console.error("Error seminarios batch:", error);
  }
  console.log(`  ✓ ${semRows.length} seminarios`);

  // ── 5. HORARIO ITEMS ───────────────────────────────────────────────────────
  console.log("Migrando horarios...");
  const HORARIO_SHEETS = [
    { name: "Horario Hombro",  codigo: "H"   },
    { name: "Horario Mano",    codigo: "M"   },
    { name: "Horario Cadera",  codigo: "CyP" },
    { name: "Horario Rodilla", codigo: "R"   },
    { name: "Horario TyP",     codigo: "TyP" },
    { name: "Horario Columna", codigo: "Col" },
  ];
  const horRows = [];

  for (const def of HORARIO_SHEETS) {
    const ws = wb.Sheets[def.name];
    if (!ws) continue;
    // cellDates:true para que las horas lleguen como Date
    const data    = xlsx.utils.sheet_to_json(ws, { header: 1, cellDates: true });
    const header  = data[0]; // fila 1: días de la semana
    const DIAS    = ["Lunes","Martes","Miercoles","Jueves","Viernes"];

    for (let ci = 1; ci < header.length; ci++) {
      const dia = (header[ci] || "").toString().trim();
      if (!DIAS.includes(dia)) continue;

      for (let ri = 1; ri < data.length; ri++) {
        const row = data[ri];
        const raw = row[0];
        if (!raw) continue;
        // Normalizar hora: puede ser Date (Excel) o string "8:00"
        let hora = "";
        if (raw instanceof Date) {
          hora = String(raw.getHours()).padStart(2,"0") + ":" + String(raw.getMinutes()).padStart(2,"0");
        } else {
          const s = raw.toString().trim();
          const m = s.match(/^(\d{1,2}):(\d{2})/);
          hora = m ? String(m[1]).padStart(2,"0") + ":" + m[2] : s;
        }
        if (!hora) continue;
        const act = (row[ci] || "").toString().trim();
        if (!act) continue;
        horRows.push({ rotacion_codigo: def.codigo, dia_semana: dia, hora, actividad: act });
      }
    }
  }

  for (let i = 0; i < horRows.length; i += 500) {
    const { error } = await supabase.from("horario_items").upsert(horRows.slice(i, i + 500), { onConflict: "rotacion_codigo,dia_semana,hora" });
    if (error) console.error("Error horario batch:", error);
  }
  console.log(`  ✓ ${horRows.length} horario items`);

  console.log("\n✅ Migración completa.");
}

main().catch(console.error);
