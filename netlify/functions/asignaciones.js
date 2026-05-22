import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { cirugia_id, fecha, asistentes } = body;
  if (!cirugia_id || !fecha) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Faltan cirugia_id o fecha" }) };

  // Borrar siempre primero
  const { error: delErr } = await supabase
    .from("asignaciones")
    .delete()
    .eq("cirugia_id", cirugia_id);

  if (delErr) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: delErr.message }) };

  // Si hay asistentes, insertar
  if (Array.isArray(asistentes) && asistentes.length > 0) {
    const { error: insErr } = await supabase
      .from("asignaciones")
      .insert({ cirugia_id, fecha, asistente: JSON.stringify(asistentes) });

    if (insErr) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: insErr.message }) };
  }

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
};
