import { configurado, getSubs, enviar } from "./_push.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};
const json = (statusCode, body) => ({ statusCode, headers: CORS, body: JSON.stringify(body) });

// Prueba: manda un push a UN solo dispositivo después de unos segundos, para
// alcanzar a bloquear el teléfono y ver cómo llega de verdad. Incluye botones
// de acción a propósito: es justo lo que queremos comprobar en iPhone.
export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!configurado()) return json(503, { error: "push-no-configurado" });

  let body;
  try { body = JSON.parse(event.body); }
  catch { return json(400, { error: "Invalid JSON" }); }

  const endpoint = String(body.endpoint || "");
  if (!endpoint) return json(400, { error: "falta endpoint" });

  const sub = (await getSubs()).find(s => s.endpoint === endpoint);
  if (!sub) return json(404, { error: "este dispositivo no está suscrito" });

  // Tope por el límite de la función (26 s).
  const espera = Math.min(Math.max(Number(body.segundos) || 5, 0), 15);
  await new Promise(r => setTimeout(r, espera * 1000));

  const r = await enviar([sub], {
    tipo: "prueba",
    titulo: "🧪 Prueba — ¿vas a Pabellón K?",
    body: "Si ves los botones Voy / No voy, funcionan en este teléfono.",
    tag: `prueba-${Date.now()}`,
    actions: [
      { action: "voy", title: "✅ Voy" },
      { action: "no",  title: "❌ No voy" },
    ],
  });

  return json(200, { ok: true, esperó: espera, ...r });
};
