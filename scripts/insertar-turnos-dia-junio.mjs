/**
 * Script: insertar-turnos-dia-junio.mjs
 * Verifica e inserta los Turnos Día (tipo "D") de Jun-Jul 2026
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_KEY=eyJ... \
 *   node scripts/insertar-turnos-dia-junio.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Datos del calendario — [ fecha, apellido1, apellido2 ]
const TURNOS_DIA = [
  ["2026-06-01", "Thomas",    "Teuber"],
  ["2026-06-02", "Albert",    "Chahin"],
  ["2026-06-03", "Marré",     "Molina"],
  ["2026-06-04", "Miño",      "Navia"],
  ["2026-06-05", "Molina",    "Álvarez"],
  ["2026-06-08", "Thomas",    "González"],
  ["2026-06-09", "Miño",      "Albert"],
  ["2026-06-10", "Valencia",  "Teuber"],
  ["2026-06-11", "Álvarez",   "Beaulieu"],
  ["2026-06-12", "Navia",     "Molina"],
  ["2026-06-15", "Navia",     "Marré"],
  ["2026-06-16", "Albert",    "González"],
  ["2026-06-17", "Chahin",    "Miño"],
  ["2026-06-18", "Cárcamo",   "Valencia"],
  ["2026-06-19", "Fuentes",   "Thomas"],
  ["2026-06-22", "Álvarez",   "Molina"],
  ["2026-06-23", "Beaulieu",  "Chahin"],
  ["2026-06-24", "Marré",     "Fuentes"],
  ["2026-06-25", "González",  "Navia"],
  ["2026-06-26", "Cárcamo",   "Díaz"],
  // 29 Jun feriado — sin turno
  ["2026-06-30", "Beaulieu",  "Fuentes"],
  ["2026-07-01", "Chahin",    "Díaz"],
  ["2026-07-02", "Cárcamo",   "Valencia"],
  ["2026-07-03", "Marré",     "Teuber"],
];

const FECHAS = TURNOS_DIA.map(t => t[0]);
const APELLIDOS = [...new Set(TURNOS_DIA.flatMap(t => [t[1], t[2]]))];

async function main() {
  // 1. Cargar becados y buscar por apellido
  console.log("Cargando becados...");
  const { data: becados, error: bErr } = await supabase
    .from("becados").select("id, nombre");
  if (bErr) { console.error("Error cargando becados:", bErr.message); process.exit(1); }

  // Mapa apellido → { id, nombre } (busca el apellido en el nombre completo)
  const apellidoMap = {};
  for (const ap of APELLIDOS) {
    // Normaliza para comparar sin tildes
    const apNorm = ap.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const match = becados.find(b => {
      const bNorm = b.nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      return bNorm.split(" ").some(part => part === apNorm);
    });
    if (match) {
      apellidoMap[ap] = match;
    } else {
      console.warn(`⚠️  No se encontró becado para apellido: "${ap}"`);
    }
  }

  console.log("\nMapa de apellidos resueltos:");
  for (const [ap, b] of Object.entries(apellidoMap)) {
    console.log(`  ${ap} → ${b.nombre} (id: ${b.id})`);
  }

  const noResueltos = APELLIDOS.filter(ap => !apellidoMap[ap]);
  if (noResueltos.length > 0) {
    console.error(`\n❌ No se pudo resolver: ${noResueltos.join(", ")}`);
    console.error("Corrígelos en el script antes de continuar.");
    process.exit(1);
  }

  // 2. Verificar turnos D existentes en el rango
  console.log("\nVerificando turnos D existentes en el rango...");
  const { data: existentes, error: tErr } = await supabase
    .from("turnos")
    .select("fecha, becado_id, tipo, becados(nombre)")
    .eq("tipo", "D")
    .gte("fecha", FECHAS[0])
    .lte("fecha", FECHAS[FECHAS.length - 1]);
  if (tErr) { console.error("Error consultando turnos:", tErr.message); process.exit(1); }

  if (existentes.length > 0) {
    console.log(`\nTurnos D ya existentes (${existentes.length}):`);
    for (const t of existentes) {
      console.log(`  ${t.fecha} — ${t.becados?.nombre}`);
    }
  } else {
    console.log("  (ninguno)");
  }

  // Set de claves existentes para deduplicar
  const existSet = new Set(existentes.map(t => `${t.fecha}__${t.becado_id}`));

  // 3. Construir registros a insertar
  const aInsertar = [];
  for (const [fecha, ap1, ap2] of TURNOS_DIA) {
    for (const ap of [ap1, ap2]) {
      const b = apellidoMap[ap];
      const key = `${fecha}__${b.id}`;
      if (existSet.has(key)) {
        console.log(`  ↩ Saltando (ya existe): ${fecha} — ${b.nombre}`);
      } else {
        aInsertar.push({ becado_id: b.id, fecha, tipo: "D" });
      }
    }
  }

  if (aInsertar.length === 0) {
    console.log("\n✅ Todos los turnos ya estaban cargados. Nada que insertar.");
    return;
  }

  console.log(`\nInsertando ${aInsertar.length} turnos nuevos...`);
  const { error: iErr } = await supabase.from("turnos").insert(aInsertar);
  if (iErr) {
    console.error("Error insertando:", iErr.message);
    process.exit(1);
  }

  console.log(`✅ ${aInsertar.length} turnos D insertados correctamente.`);
  console.log("\nInvalidando caché de la app...");

  // 4. Bump data version para que los clientes recarguen
  const { error: vErr } = await supabase
    .from("config")
    .update({ value: String(Date.now()) })
    .eq("key", "data_version");
  if (vErr) console.warn("No se pudo invalidar caché:", vErr.message);
  else console.log("✅ Caché invalidado.");
}

main();
