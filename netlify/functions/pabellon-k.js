import { configurado, getConfigJSON, setConfigJSON, getSubs, enviar } from "./_push.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};
const json = (statusCode, body) => ({ statusCode, headers: CORS, body: JSON.stringify(body) });

// Dispara el llamado de Pabellón K. El candado de "una vez al día para todos"
// se aplica acá y no en el cliente, para que no dependa de quién escriba
// primero desde su teléfono.
export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!configurado()) return json(503, { error: "push-no-configurado" });

  let body;
  try { body = JSON.parse(event.body); }
  catch { return json(400, { error: "Invalid JSON" }); }

  const becado = String(body.becado || "").trim();
  const hoy = String(body.hoy || "").trim();
  if (!becado || !/^\d{4}-\d{2}-\d{2}$/.test(hoy)) return json(400, { error: "faltan datos" });

  const previo = await getConfigJSON("pabellon_k", null);
  if (previo?.fecha === hoy) return json(200, { ok: false, reg: previo });

  const reg = { fecha: hoy, por: becado, ts: new Date().toISOString() };
  if (!await setConfigJSON("pabellon_k", reg)) return json(500, { error: "no se pudo guardar" });

  // Solo a quienes lo tengan activado, y no al que lo apretó.
  const destinatarios = (await getSubs())
    .filter(s => s.pabellonK && s.becado !== becado);

  const r = await enviar(destinatarios, {
    tipo: "pabellonK",
    titulo: "🔴 PABELLÓN K",
    body: `${becado} está llamando a Pabellón K.`,
    tag: `pabellonk-${hoy}`,
  });

  return json(200, { ok: true, reg, ...r });
};
