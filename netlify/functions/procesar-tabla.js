import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SECRET_TOKEN = process.env.TABLA_SECRET_TOKEN;

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
  const s = String(val).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 8);
  // Excel serial time (fraction of day)
  if (!isNaN(val) && Number(val) < 1) {
    const totalSec = Math.round(Number(val) * 86400);
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

function parsearExcel(buffer, filename) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const registros = [];

  for (const sheetName of workbook.SheetNames) {
    const isCancelacion = sheetName.toUpperCase().includes("CANCEL");
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Buscar fila de headers (donde col[0] === 'Hora')
    let headerRow = -1;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0] ?? "").trim().toLowerCase() === "hora") {
        headerRow = i;
        break;
      }
    }
    if (headerRow === -1) continue;

    const fecha = extraerFecha(filename);
    let pabellon = null;

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

      const col = (n) => (row.length > n ? limpiar(row[n]) : null);
      const dur = col(1);

      registros.push({
        fecha,
        pabellon,
        hora,
        hora_fin: row.length > 16 ? parseTime(row[16]) : null,
        dur_plan: dur && /^\d/.test(dur) ? parseInt(dur) : null,
        tipo_paciente: col(2),
        episodio: col(3),
        clase_episodio: col(4),
        destino: col(5),
        rut: col(6),
        paciente: col(7),
        prestacion: col(8),
        equipo: col(9),
        habitacion: col(10),
        alertas: col(11),
        transporte: col(12),
        upq_ficha: col(13),
        upq_instrumental: col(14),
        coordinadora: col(15),
        cancelada: isCancelacion,
      });
    }
  }

  return registros;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Validar token secreto
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

  const { fileContent, filename, subject } = body;

  if (!fileContent || !filename) {
    return { statusCode: 400, body: "fileContent y filename son requeridos" };
  }

  const isReenvio = subject?.toUpperCase().includes("REENV") ?? false;
  const buffer = Buffer.from(fileContent, "base64");
  const fecha = extraerFecha(filename);

  let registros;
  try {
    registros = parsearExcel(buffer, filename);
  } catch (err) {
    return { statusCode: 500, body: `Error parseando Excel: ${err.message}` };
  }

  try {
    if (isReenvio && fecha) {
      await supabase.table("tabla_quirurgica").delete().eq("fecha", fecha);
    }

    if (registros.length > 0) {
      const { error } = await supabase
        .from("tabla_quirurgica")
        .insert(registros);
      if (error) throw error;
    }
  } catch (err) {
    return { statusCode: 500, body: `Error Supabase: ${err.message}` };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      fecha,
      registros: registros.length,
      reenvio: isReenvio,
    }),
  };
};
