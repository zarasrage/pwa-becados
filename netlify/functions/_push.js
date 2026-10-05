// Utilidades compartidas por las funciones que mandan notificaciones.
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

// Se crea a demanda: si faltan las variables de entorno queremos responder
// 503 y no reventar al cargar el módulo.
let _sb = null;
function sb() {
  if (!_sb) _sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  return _sb;
}

export { sb };

export function configurado() {
  return !!(SUPABASE_URL && SUPABASE_KEY && VAPID_PUBLIC && VAPID_PRIVATE);
}

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails("mailto:mimapp@hospital.cl", VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function getConfigJSON(key, fallback) {
  const { data } = await sb().from("config").select("value").eq("key", key).maybeSingle();
  if (!data?.value) return fallback;
  try { return JSON.parse(data.value); } catch { return fallback; }
}

export async function setConfigJSON(key, obj) {
  const { error } = await sb()
    .from("config").upsert({ key, value: JSON.stringify(obj) }, { onConflict: "key" });
  return !error;
}

export async function getSubs() {
  const lista = await getConfigJSON("push_subs", []);
  return Array.isArray(lista) ? lista : [];
}

// Manda el payload a cada suscripción y limpia las que el servicio de push ya
// no reconoce (teléfono borrado, app desinstalada, permiso revocado).
export async function enviar(subs, payload) {
  const cuerpo = JSON.stringify(payload);
  const muertas = [];
  let enviadas = 0;

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, cuerpo);
      enviadas++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) muertas.push(s.endpoint);
    }
  }));

  if (muertas.length) {
    const lista = await getSubs();
    await setConfigJSON("push_subs", lista.filter(s => !muertas.includes(s.endpoint)));
  }
  return { enviadas, limpiadas: muertas.length };
}
