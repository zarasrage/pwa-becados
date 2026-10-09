import { useEffect, useState } from "react";
import { pabellonKActivo } from "../../utils/notifPrefs.js";

// Acceso a Pabellón K en el header del becado. Solo aparece en los dispositivos
// que lo activaron en Configuraciones → Notificaciones.
export function PabellonKBtn({ onClick }) {
  const [activo, setActivo] = useState(pabellonKActivo);

  // El switch de configuración avisa por este evento para no tener que recargar.
  useEffect(() => {
    const onPrefs = () => setActivo(pabellonKActivo());
    window.addEventListener("notifprefs", onPrefs);
    return () => window.removeEventListener("notifprefs", onPrefs);
  }, []);

  if (!activo) return null;

  return (
    // A propósito no es una píldora como el chip de rotación: es un disco
    // sólido, para que no se confundan de un vistazo.
    <button className="press" onClick={onClick} aria-label="Llamar a Pabellón K"
      style={{
        flexShrink:0,marginTop:1,
        width:32,height:32,borderRadius:"50%",
        display:"flex",alignItems:"center",justifyContent:"center",
        background:"linear-gradient(160deg,#FF3B3B 0%,#C81E1E 100%)",
        border:"none",boxShadow:"0 2px 8px rgba(200,30,30,0.45)",
        cursor:"pointer",fontFamily:"'Bricolage Grotesque',sans-serif",
        fontSize:16,fontWeight:800,color:"#fff",lineHeight:1,
      }}>
      K
    </button>
  );
}
