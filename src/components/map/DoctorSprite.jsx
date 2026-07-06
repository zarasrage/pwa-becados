import { useEffect, useState } from "react";
import { getRecoloredFrames, baseSrc, accSrc, SEXO_DEFAULT } from "./recolorSprites.js";

// Devuelve los 4 data URLs recoloreados para un `look` (colores por parte),
// o null mientras carga / cuando se usa el base sin cambios.
function useRecoloredFrames(look) {
  const [frames, setFrames] = useState(null);
  const key = look ? JSON.stringify(look) : "";
  useEffect(() => {
    let alive = true;
    setFrames(null);
    getRecoloredFrames(look)
      .then((urls) => { if (alive) setFrames(urls); })
      .catch(() => { if (alive) setFrames(null); });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return frames;
}

// Avatar "de piso" — inline, para la fila de "Fuera del hospital".
export function FloorAvatar({ av, isSel, sz, i, onSelect, look }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const speed = 200 + (i % 4) * 50;
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), speed);
    return () => clearInterval(interval);
  }, [i]);
  const recolored = useRecoloredFrames(look);
  const sexo = look?.sexo || SEXO_DEFAULT;
  const src = recolored?.[frame] || baseSrc(sexo, frame);
  return (
    <div style={{ position:"relative", width:sz, height:sz, flexShrink:0 }}>
      <img src={src} alt={av.name} width={sz} height={sz}
        style={{ imageRendering:"pixelated", display:"block", pointerEvents:"none",
          filter: isSel ? `drop-shadow(0 0 4px ${av.color}) brightness(1.1)` : "none" }}/>
      {look?.acc && (
        <img src={accSrc(look.acc, frame)} alt="" width={sz} height={sz}
          style={{ position:"absolute", top:0, left:0, imageRendering:"pixelated", pointerEvents:"none" }}/>
      )}
      <div className="press" onClick={() => onSelect(isSel ? null : av)}
        style={{ position:"absolute", top:0, bottom:0, left:"50%", transform:"translateX(-50%)",
          width:sz*0.5, cursor:"pointer" }}/>
      {isSel && (
        <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)",
          background:av.color, color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px",
          borderRadius:4, whiteSpace:"nowrap", fontFamily:"'JetBrains Mono',monospace",
          boxShadow:`0 2px 6px ${av.color}80` }}>
          {av.name.split(" ").slice(-1)[0]}
        </div>
      )}
    </div>
  );
}

export function DoctorSprite({ av, spot, isSel, sz, i, onSelect, selected, look }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const speed = 200 + (i % 4) * 50; // vary speed per doctor
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), speed);
    return () => clearInterval(interval);
  }, [i]);

  const recolored = useRecoloredFrames(look);
  const sexo = look?.sexo || SEXO_DEFAULT;
  const src = recolored?.[frame] || baseSrc(sexo, frame);

  return (
    <div
      style={{
        position:"absolute",
        left:`${spot.x}%`, top:`${spot.y}%`,
        transform:"translate(-50%,-100%)",
        transition:"all 0.15s",
        width:sz, height:sz,
        pointerEvents:"none", // el contenedor deja pasar los clicks; solo la franja captura
        zIndex: isSel ? 100 : Math.round(spot.y),
      }}>
      <img src={src} alt={av.name}
        width={sz} height={sz}
        style={{
          imageRendering:"pixelated", display:"block", pointerEvents:"none",
          filter: isSel ? `drop-shadow(0 0 4px ${av.color}) brightness(1.1)` : "none",
        }}/>
      {look?.acc && (
        <img src={accSrc(look.acc, frame)} alt="" width={sz} height={sz}
          style={{ position:"absolute", top:0, left:0, imageRendering:"pixelated", pointerEvents:"none",
            filter: isSel ? "brightness(1.1)" : "none" }}/>
      )}
      {/* Área clickeable angosta, solo sobre el cuerpo (evita robar clicks al de atrás) */}
      <div className="press"
        onClick={() => onSelect(isSel ? null : av)}
        style={{
          position:"absolute", top:0, bottom:0, left:"50%",
          transform:"translateX(-50%)",
          width:sz*0.5, cursor:"pointer", pointerEvents:"auto",
        }}/>
      {isSel && (
        <div style={{
          position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",
          background:av.color,color:"#fff",fontSize:10,fontWeight:800,
          padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap",
          fontFamily:"'JetBrains Mono',monospace",
          boxShadow:`0 2px 6px ${av.color}80`,
        }}>
          {av.name.split(" ").slice(-1)[0]}
        </div>
      )}
    </div>
  );
}
