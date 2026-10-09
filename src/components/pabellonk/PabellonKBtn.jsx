import { useCallback, useEffect, useState } from "react";
import { pabellonKActivo } from "../../utils/notifPrefs.js";
import { todayISO } from "../../utils/dates.js";
import { getPabellonK } from "../../lib/supabaseApi.js";

// Acceso a Pabellón K en el header del becado. Solo aparece en los dispositivos
// que lo activaron en Configuraciones → Notificaciones.
export function PabellonKBtn({ becado, onClick }) {
  const [activo, setActivo] = useState(pabellonKActivo);
  const [pendiente, setPendiente] = useState(false);

  // El switch de configuración avisa por este evento para no tener que recargar.
  useEffect(() => {
    const onPrefs = () => setActivo(pabellonKActivo());
    window.addEventListener("notifprefs", onPrefs);
    return () => window.removeEventListener("notifprefs", onPrefs);
  }, []);

  // ¿Hay un llamado de hoy que este becado todavía no contesta? Como iPhone no
  // muestra botones en la notificación, el aviso tiene que verse en la app.
  const revisar = useCallback(async () => {
    const reg = (activo && becado) ? await getPabellonK() : null;
    setPendiente(
      !!reg && reg.fecha === todayISO() && reg.por !== becado && !reg.respuestas?.[becado]
    );
  }, [activo, becado]);

  useEffect(() => {
    revisar();
    // Al volver a la app desde la notificación hay que mirar de nuevo.
    const onVisible = () => { if (!document.hidden) revisar(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", revisar);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", revisar);
    };
  }, [revisar]);

  if (!activo) return null;

  return (
    // A propósito no es una píldora como el chip de rotación: es un disco
    // sólido, para que no se confundan de un vistazo.
    <button className="press" onClick={onClick}
      aria-label={pendiente ? "Responder al llamado de Pabellón K" : "Llamar a Pabellón K"}
      style={{
        position:"relative",flexShrink:0,marginTop:1,
        width:32,height:32,borderRadius:"50%",
        display:"flex",alignItems:"center",justifyContent:"center",
        background:"linear-gradient(160deg,#FF3B3B 0%,#C81E1E 100%)",
        border:"none",boxShadow:"0 2px 8px rgba(200,30,30,0.45)",
        cursor:"pointer",fontFamily:"'Bricolage Grotesque',sans-serif",
        fontSize:16,fontWeight:800,color:"#fff",lineHeight:1,
        animation: pendiente ? "pulseK 1.4s ease-in-out infinite" : "none",
      }}>
      K
      {pendiente && (
        <span style={{
          position:"absolute",top:-2,right:-2,width:11,height:11,borderRadius:"50%",
          background:"#FACC15",border:"2px solid #fff",
        }}/>
      )}
      <style>{`@keyframes pulseK{0%,100%{box-shadow:0 2px 8px rgba(200,30,30,0.45)}50%{box-shadow:0 2px 16px rgba(239,68,68,0.9)}}`}</style>
    </button>
  );
}
