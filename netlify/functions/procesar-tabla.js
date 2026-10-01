import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SECRET_TOKEN = process.env.TABLA_SECRET_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function limpiar(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === "nan" || s === "None") return null;
  if ([...s].every((c) => "‏‎ \t".includes(c))) return null;
  return s;
}

function parseTime(val) {
  if (val === null || val === undefined) return null;
  // Date object (SheetJS con cellDates:true)
  if (val instanceof Date) {
    const h = String(val.getUTCHours()).padStart(2, "0");
    const m = String(val.getUTCMinutes()).padStart(2, "0");
    const s = String(val.getUTCSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  const s = String(val).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 8);
  // Fracción decimal de día (0 a 1)
  const n = Number(val);
  if (!isNaN(n) && n >= 0 && n < 1) {
    const totalSec = Math.round(n * 86400);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s2 = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s2}`;
  }
  return null;
}

function esPabellon(row) {
  const first = limpiar(row[0]);
  if (!first) return false;
  if (/^\d{1,2}:\d{2}/.test(first)) return false;
  const nonEmpty = row.filter(
    (v) => v !== null && v !== undefined && limpiar(v) !== null
  ).length;
  return nonEmpty <= 2;
}

function extraerFecha(filename) {
  const match = filename.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m}-${d}`;
  }
  return null;
}

// Las columnas del Excel se mueven cada cierto tiempo (p.ej. en sept/2026
// desapareció "UPQ ficha" y todo lo siguiente corrió un lugar), así que se
// ubican por nombre de encabezado y no por posición.
function mapearColumnas(encabezados) {
  const norm = (s) =>
    String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .trim().toLowerCase().replace(/\s+/g, " ");
  const cols = encabezados.map((h, i) => ({ i, h: norm(h) }));
  const usados = new Set();
  const buscar = (...patrones) => {
    for (const p of patrones) {
      const c = cols.find((c) => !usados.has(c.i) && c.h && c.h.includes(p));
      if (c) { usados.add(c.i); return c.i; }
    }
    return -1;
  };
  // De lo más específico a lo más genérico: si no, "tipo de paciente" o
  // "contacto paciente" se quedarían con la columna de "paciente".
  const m = {};
  m.hora             = buscar("hora");
  m.dur_plan         = buscar("dur");
  m.tipo_paciente    = buscar("tipo de paciente");
  m.clase_episodio   = buscar("clase de episodio");
  m.episodio         = buscar("episodio");
  m.destino          = buscar("destino");
  m.rut              = buscar("rut");
  m.prestacion       = buscar("prestacion");
  m.equipo           = buscar("equipo");
  m.habitacion       = buscar("habitaci");
  m.alertas          = buscar("alerta");
  m.transporte       = buscar("transporte");
  m.upq_instrumental = buscar("upq instrumental", "instrumental");
  m.upq_ficha        = buscar("upq ficha", "ficha");
  m.coordinadora     = buscar("coordinadora", "arsenalera");
  m.paciente         = buscar("paciente");
  m.hora_fin         = buscar("hora");   // la segunda "HORA", si existe
  return m;
}

function parsearExcel(buffer, filename) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const registros = [];

  for (const sheetName of workbook.SheetNames) {
    const isCancelacion = sheetName.toUpperCase().includes("CANCEL");
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    let headerRow = -1;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0] ?? "").trim().toLowerCase() === "hora") {
        headerRow = i;
        break;
      }
    }
    if (headerRow === -1) continue;

    // Log header row so column mapping can be verified in Netlify Function Logs
    console.log(`[excel] sheet="${sheetName}" headerRow=${headerRow} cols:`, rows[headerRow].map((v, i) => `${i}:${v}`).join(" | "));
    const mapa = mapearColumnas(rows[headerRow]);
    console.log(`[excel] mapeo:`, Object.entries(mapa).map(([k, v]) => `${k}=${v}`).join(" | "));
    if (mapa.upq_instrumental === -1) {
      console.error('[excel] no se encontró la columna de instrumental: el detalle quedará vacío');
    }

    const fecha = extraerFecha(filename);
    let pabellon = null;
    let firstDataLogged = false;

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i];
      const first = limpiar(row[0]);
      if (!first) continue;

      if (!isCancelacion && esPabellon(row)) {
        pabellon = first;
        continue;
      }

      const hora = parseTime(row[0]);
      if (!hora && !isCancelacion) continue;

      const col = (n) => (n >= 0 && row.length > n ? limpiar(row[n]) : null);
      const dur = col(mapa.dur_plan);

      if (!firstDataLogged) {
        firstDataLogged = true;
        console.log(`[excel] primera fila datos (cols 11-16):`, [11,12,13,14,15,16].map((n) => `${n}:${JSON.stringify(col(n))}`).join(" | "));
      }

      registros.push({
        fecha,
        pabellon,
        hora,
        hora_fin: mapa.hora_fin >= 0 && row.length > mapa.hora_fin ? parseTime(row[mapa.hora_fin]) : null,
        dur_plan: dur && /^\d/.test(dur) ? parseInt(dur) : null,
        tipo_paciente: col(mapa.tipo_paciente),
        episodio: col(mapa.episodio),
        clase_episodio: col(mapa.clase_episodio),
        destino: col(mapa.destino),
        rut: col(mapa.rut),
        paciente: col(mapa.paciente),
        prestacion: col(mapa.prestacion),
        equipo: col(mapa.equipo),
        habitacion: col(mapa.habitacion),
        alertas: col(mapa.alertas),
        transporte: col(mapa.transporte),
        upq_ficha: col(mapa.upq_ficha),
        upq_instrumental: col(mapa.upq_instrumental),
        coordinadora: col(mapa.coordinadora),
        cancelada: isCancelacion,
        diagnostico: null,
        cirugia: null,
        info_cirugia: null,
      });
    }
  }

  return registros;
}

const CHUNK_SIZE = 15;
const CLAUDE_TIMEOUT_MS = 22000;

async function llamarClaude(textos) {
  const items = textos.map((t, i) => `[${i}] ${t}`).join("\n\n");
  const prompt = `Eres un asistente médico. Analiza cada texto quirúrgico y extrae en JSON los campos: diagnostico, cirugia, info_cirugia.

Reglas:
- "diagnostico": el diagnóstico del paciente (ej: "Fractura cadera izquierda")
- "cirugia": el nombre del procedimiento quirúrgico (ej: "PTC Cadera", "Osteosíntesis radio")
- "info_cirugia": el material, implantes e instrumentos quirúrgicos (lo que viene después de // o los materiales listados)
- Si no puedes identificar un campo, usa null
- Responde SOLO con un array JSON válido, un objeto por cada texto, en el mismo orden

Textos:
${items}

Responde SOLO con el array JSON:`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);
  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API ${response.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`Claude no devolvió JSON array. Respuesta: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

async function extraerConClaude(registros) {
  const conTexto = registros.filter((r) => r.upq_instrumental);
  if (conTexto.length === 0) return registros;

  console.log(`[claude] ${conTexto.length} filas con upq_instrumental de ${registros.length} totales`);

  if (!ANTHROPIC_KEY) {
    console.error("[claude] ANTHROPIC_API_KEY no está configurada");
    return registros;
  }

  // Dividir en chunks para que cada llamada sea rápida (~3-5s por chunk de 15)
  const resultados = new Array(conTexto.length).fill(null);
  for (let i = 0; i < conTexto.length; i += CHUNK_SIZE) {
    const chunk = conTexto.slice(i, i + CHUNK_SIZE);
    const textos = chunk.map((r) => r.upq_instrumental);
    try {
      const extraidos = await llamarClaude(textos);
      chunk.forEach((_, j) => {
        const e = extraidos[j] ?? {};
        resultados[i + j] = {
          diagnostico: e.diagnostico ?? null,
          cirugia: e.cirugia ?? null,
          info_cirugia: e.info_cirugia ?? null,
        };
      });
      console.log(`[claude] chunk ${i}-${i + chunk.length - 1} OK`);
    } catch (err) {
      console.error(`[claude] chunk ${i}-${i + chunk.length - 1} falló:`, err.message);
      // chunk queda con nulls — no rompe el resto
    }
  }

  // Mapear de vuelta a registros originales
  let idx = 0;
  return registros.map((r) => {
    if (!r.upq_instrumental) return r;
    const extraido = resultados[idx++] ?? {};
    return { ...r, ...extraido };
  });
}

async function subirASupabase(registros, fecha) {
  // Siempre reemplazar: borra registros existentes para esa fecha e inserta los nuevos
  if (fecha) {
    await supabase.from("tabla_quirurgica").delete().eq("fecha", fecha);
  }

  if (registros.length > 0) {
    const { error } = await supabase.from("tabla_quirurgica").insert(registros);
    if (error) throw error;
  }

  return { inserted: registros.length };
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const token = event.headers["x-secret-token"];
  if (SECRET_TOKEN && token !== SECRET_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { fileContent, filename } = body;
  if (!fileContent || !filename) {
    return { statusCode: 400, body: "fileContent y filename son requeridos" };
  }

  const buffer = Buffer.from(fileContent, "base64");
  const fecha = extraerFecha(filename);

  let registros;
  try {
    registros = parsearExcel(buffer, filename);
  } catch (err) {
    return { statusCode: 500, body: `Error parseando Excel: ${err.message}` };
  }

  try {
    registros = await extraerConClaude(registros);
  } catch (err) {
    console.error("Error Claude:", err.message);
    // Continuar sin extracción si Claude falla
  }

  try {
    await subirASupabase(registros, fecha);
  } catch (err) {
    return { statusCode: 500, body: `Error Supabase: ${err.message}` };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      fecha,
      registros: registros.length,
      con_upq: registros.filter((r) => r.upq_instrumental).length,
      con_diagnostico: registros.filter((r) => r.diagnostico).length,
    }),
  };
};
