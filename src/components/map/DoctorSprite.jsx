import { useEffect, useState } from "react";
import { getRecoloredFrames } from "./recolorSprites.js";

// Devuelve los 4 data URLs recoloreados para una combo piel/pelo,
// o null mientras carga / cuando se usan los PNGs originales.
function useRecoloredFrames(skin, hair) {
  const [frames, setFrames] = useState(null);
  useEffect(() => {
    let alive = true;
    setFrames(null);
    getRecoloredFrames(skin, hair)
      .then((urls) => { if (alive) setFrames(urls); })
      .catch(() => { if (alive) setFrames(null); });
    return () => { alive = false; };
  }, [skin, hair]);
  return frames;
}

export function DoctorSprite({ av, spot, isSel, sz, i, onSelect, selected, look }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const speed = 200 + (i % 4) * 50; // vary speed per doctor
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), speed);
    return () => clearInterval(interval);
  }, [i]);

  const recolored = useRecoloredFrames(look?.skin, look?.hair);
  const src = recolored?.[frame] || `/sprites/doctor/frame_00${frame}.png`;

  return (
    <div className="press"
      onClick={() => onSelect(isSel ? null : av)}
      style={{
        position:"absolute",
        left:`${spot.x}%`, top:`${spot.y}%`,
        transform:"translate(-50%,-100%)",
        transition:"all 0.15s",
        zIndex: isSel ? 100 : Math.round(spot.y),
      }}>
      <img src={src} alt={av.name}
        width={sz} height={sz}
        style={{
          imageRendering:"pixelated", display:"block",
          filter: isSel ? `drop-shadow(0 0 4px ${av.color}) brightness(1.1)` : "none",
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
