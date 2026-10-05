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
    <button className="press" onClick={onClick} aria-label="Llamar a Pabellón K"
      style={{
        flexShrink:0,marginTop:2,
        display:"flex",alignItems:"center",gap:6,
        background:"#EF444418",border:"1px solid #EF444455",
        borderRadius:99,padding:"5px 11px",cursor:"pointer",
        fontFamily:"'Inter',sans-serif",
      }}>
      <span style={{width:7,height:7,borderRadius:"50%",background:"#EF4444",boxShadow:"0 0 6px #EF4444"}}/>
      <span style={{fontSize:13,fontWeight:700,color:"#EF4444"}}>K</span>
    </button>
  );
}
