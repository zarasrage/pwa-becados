import { guardarPushSub, borrarPushSub } from "../lib/supabaseApi.js";

// Clave pública VAPID. Es pública a propósito: identifica al servidor que puede
// mandar notificaciones. La privada vive solo en las variables de entorno de
// Netlify.
export const VAPID_PUBLIC_KEY =
  "BEGlR4ARhdQ_C3yEnDBwrR-KlogKl7J7ZSq4R0yq2j17O6Wg3YqmGH4yGEkDwLbcy054rrhQtJRX_JwPYJteAx0";

function urlBase64ToUint8Array(base64) {
  const padded = (base64 + "=".repeat((4 - base64.length % 4) % 4))
    .replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function pushSoportado() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && typeof Notification !== "undefined";
}

// En iPhone el push solo existe si la app está instalada en la pantalla de
// inicio; desde Safari la API ni siquiera aparece.
export function esIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
export function instaladaEnInicio() {
  return window.matchMedia?.("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

// Suscribe este dispositivo y deja la suscripción guardada junto con las
// preferencias, que es lo que el servidor consulta para decidir a quién avisar.
export async function registrarPush(becado, prefs) {
  if (!pushSoportado()) return { ok: false, motivo: "no-soportado" };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } catch {
      return { ok: false, motivo: "rechazado" };
    }
  }

  const json = sub.toJSON();
  const ok = await guardarPushSub({
    endpoint: json.endpoint,
    keys: json.keys,
    becado,
    tipos: prefs.tipos,
    cuando: prefs.cuando,
    pabellonK: prefs.pabellonK,
  });
  return { ok, motivo: ok ? "" : "guardado" };
}

// Se llama al apagar todo: deja de recibir y se saca de la lista del servidor.
export async function desregistrarPush() {
  if (!pushSoportado()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await borrarPushSub(sub.endpoint);
  await sub.unsubscribe().catch(() => {});
}
