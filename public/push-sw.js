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
    data: { url: d.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = event.notification.data?.url || "/";

  // Si la app ya está abierta se enfoca esa ventana en vez de abrir otra.
  event.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of abiertas) {
      if ("focus" in c) { await c.focus(); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(destino);
  })());
});
