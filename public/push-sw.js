/* Handler de Web Push. Workbox lo carga con importScripts dentro del service
   worker generado, así que corre aunque la app esté cerrada. */

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = {}; }

  const titulo = d.titulo || "MimApp";
  const opciones = {
    body: d.body || "",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    tag: d.tag || "mimapp",
    renotify: !!d.tag,
    // El llamado de Pabellón K tiene que interrumpir; los recordatorios no.
    requireInteraction: d.tipo === "pabellonK",
    vibrate: d.tipo === "pabellonK" ? [80, 50, 80, 50, 200] : [60],
    data: { url: d.url || "/", tipo: d.tipo || "" },
  };
  // Botones de respuesta. Android los muestra; iPhone parece ignorarlos, que es
  // justo lo que la notificación de prueba sirve para comprobar.
  if (Array.isArray(d.actions) && d.actions.length) opciones.actions = d.actions;

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const accion = event.action || "";
  const base = event.notification.data?.url || "/";

  event.waitUntil((async () => {
    // Si vino de un botón, se confirma con otra notificación: así queda claro
    // que la acción llegó al service worker, sin depender de que la app abra.
    if (accion) {
      const comoLlego = accion === "voy" ? "✅ Voy" : accion === "no" ? "❌ No voy" : accion;
      await self.registration.showNotification("Botón recibido", {
        body: `Apretaste "${comoLlego}" — los botones SÍ funcionan en este teléfono.`,
        icon: "/pwa-192.png",
        badge: "/pwa-192.png",
        tag: "prueba-respuesta",
      });
    }

    const destino = accion ? `${base}?accion=${encodeURIComponent(accion)}` : base;

    // Si la app ya está abierta se enfoca esa ventana en vez de abrir otra.
    const abiertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of abiertas) {
      if ("focus" in c) {
        c.postMessage({ tipo: "notificacion", accion });
        await c.focus();
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(destino);
  })());
});
