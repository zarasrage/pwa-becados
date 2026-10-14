import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onNeedRefresh: () => window.location.reload(),
  // La PWA suele quedar viva en segundo plano (sobre todo en iOS) y solo
  // buscaba versión nueva al abrirse desde cero: revisa también al volver
  // a primer plano, para que un deploy llegue a todos sin cerrar la app.
  onRegisteredSW: (_url, reg) => {
    if (!reg) return;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && navigator.onLine) reg.update().catch(() => {});
    });
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);