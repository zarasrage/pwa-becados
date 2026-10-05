import { sb, configurado, getConfigJSON, setConfigJSON, getSubs, enviar } from "./_push.js";

// Corre cada 15 minutos (ver netlify.toml) y manda los recordatorios de turno
// a quien los tenga activados.

const TZ = "America/Santiago";

// Hora de inicio de cada turno (misma tabla que src/constants/turnos.js).
const INICIO = { P: "14:00", p: "08:00", D: "14:00", N: "20:00", A: "13:00" };
const NOMBRE = { P: "Poli", p: "Poli mañana", D: "turno de día", N: "turno de noche", A: "Artroscopía" };

// Lo que el usuario marca en la app → tipos de la tabla turnos.
const TIPOS_DE_PREF = { D: ["D"], N: ["N"], P: ["P", "p"], A: ["A"] };

const ANTES_MIN = { "15m": 15, "30m": 30, "1h": 60 };
const VENTANA = 15;            // la función corre cada 15 min
const HORA_MANANA = 7 * 60;    // "el mismo día en la mañana"
const HORA_VISPERA = 22 * 60;  // "el día anterior a las 22:00"

const m2 = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

// Fecha y minutos del día en hora de Chile, sin importar dónde corra la función.
export function ahoraEnChile() {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const g = (t) => f.find(p => p.type === t).value;
  return { fecha: `${g("year")}-${g("month")}-${g("day")}`, minutos: Number(g("hour")) * 60 + Number(g("minute")) };
}

export function sumarDias(fecha, n) {
  const d = new Date(fecha + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ¿Cae `objetivo` dentro de la ventana de esta corrida?
export const enVentana = (objetivo, ahora) => objetivo > ahora - VENTANA && objetivo <= ahora;

export const handler = async () => {
  if (!configurado()) return { statusCode: 503, body: "push-no-configurado" };

  const subs = (await getSubs()).filter(s => s.tipos?.length);
  if (!subs.length) return { statusCode: 200, body: "sin suscriptores" };

  const { fecha, minutos } = ahoraEnChile();
  const manana = sumarDias(fecha, 1);

  // Turnos de hoy y mañana de todos los becados con notificaciones activas
  const nombres = [...new Set(subs.map(s => s.becado))];
  const { data: becados } = await sb().from("becados").select("id,nombre").in("nombre", nombres);
  const idDe = Object.fromEntries((becados || []).map(b => [b.nombre, b.id]));

  const { data: turnos } = await sb()
    .from("turnos").select("becado_id,fecha,tipo")
    .in("fecha", [fecha, manana])
    .in("becado_id", Object.values(idDe));

  // becado_id|fecha → [tipos]
  const porDia = {};
  for (const t of (turnos || [])) (porDia[`${t.becado_id}|${t.fecha}`] ||= []).push(t.tipo);

  // No repetir un aviso ya mandado (la ventana puede solaparse entre corridas).
  const yaEnviados = await getConfigJSON("push_enviados", {});
  const nuevos = {};

  for (const s of subs) {
    const id = idDe[s.becado];
    if (!id) continue;

    // Según "cuándo recordar", qué día miramos y en qué minuto avisamos.
    const casos = [];
    if (ANTES_MIN[s.cuando] != null) {
      for (const tipo of (porDia[`${id}|${fecha}`] || [])) {
        casos.push({ dia: fecha, tipo, minuto: m2(INICIO[tipo] || "08:00") - ANTES_MIN[s.cuando] });
      }
    } else if (s.cuando === "manana") {
      for (const tipo of (porDia[`${id}|${fecha}`] || [])) {
        casos.push({ dia: fecha, tipo, minuto: HORA_MANANA });
      }
    } else if (s.cuando === "vispera") {
      for (const tipo of (porDia[`${id}|${manana}`] || [])) {
        casos.push({ dia: manana, tipo, minuto: HORA_VISPERA });
      }
    }

    for (const c of casos) {
      const quiere = (s.tipos || []).some(p => (TIPOS_DE_PREF[p] || []).includes(c.tipo));
      if (!quiere || !enVentana(c.minuto, minutos)) continue;

      const clave = `${s.endpoint.slice(-24)}|${c.dia}|${c.tipo}|${s.cuando}`;
      if (yaEnviados[clave]) continue;

      const cuando = c.dia === fecha
        ? `hoy a las ${INICIO[c.tipo]}`
        : `mañana a las ${INICIO[c.tipo]}`;
      await enviar([s], {
        tipo: "recordatorio",
        titulo: `Tienes ${NOMBRE[c.tipo] || c.tipo}`,
        body: `Empieza ${cuando}.`,
        tag: clave,
      });
      nuevos[clave] = Date.now();
    }
  }

  if (Object.keys(nuevos).length) {
    // Se podan las claves viejas para que el JSON no crezca sin control.
    const limite = Date.now() - 7 * 24 * 3600 * 1000;
    const vigentes = Object.fromEntries(
      Object.entries({ ...yaEnviados, ...nuevos }).filter(([, ts]) => ts > limite)
    );
    await setConfigJSON("push_enviados", vigentes);
  }

  return { statusCode: 200, body: `avisos: ${Object.keys(nuevos).length}` };
};
