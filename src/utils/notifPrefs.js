import { safeStorage } from "./storage.js";

// Preferencias de notificaciones. Son por dispositivo (cada becado puede tener
// la app en varios teléfonos y querer avisos distintos en cada uno), así que
// viven en localStorage y no en Supabase.

export const NOTIF_TIPOS = [
  { id: "D",  label: "Turno día",   color: "#F59E0B" },
  { id: "N",  label: "Turno noche", color: "#4F6EFF" },
  { id: "P",  label: "Poli",        color: "#06B6D4" },
  { id: "A",  label: "Artroscopía", color: "#72FF00" },
  { id: "PS", label: "Poli staff",  color: "#E879F9" },
];

export const NOTIF_CUANDO = [
  { id: "15m",     label: "15 min antes" },
  { id: "30m",     label: "30 min antes" },
  { id: "1h",      label: "1 hora antes" },
  { id: "manana",  label: "El mismo día en la mañana" },
  { id: "vispera", label: "El día anterior a las 22:00" },
];

const KEY = "notifPrefs";
const DEFAULT = { tipos: [], cuando: "1h", pabellonK: false };

export function getNotifPrefs() {
  try {
    const raw = safeStorage.get(KEY);
    if (!raw) return { ...DEFAULT };
    const p = JSON.parse(raw);
    return {
      tipos: Array.isArray(p.tipos) ? p.tipos : [],
      cuando: NOTIF_CUANDO.some(c => c.id === p.cuando) ? p.cuando : DEFAULT.cuando,
      pabellonK: !!p.pabellonK,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function setNotifPrefs(prefs) {
  safeStorage.set(KEY, JSON.stringify(prefs));
  // Para que el header pueda mostrar/ocultar el acceso a Pabellón K al toque
  window.dispatchEvent(new CustomEvent("notifprefs"));
}

// ¿Este dispositivo tiene activado el llamado de Pabellón K?
export function pabellonKActivo() {
  return getNotifPrefs().pabellonK;
}

// Pide permiso de notificaciones del navegador. Devuelve true si quedó concedido.
export async function pedirPermisoNotificaciones() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}
