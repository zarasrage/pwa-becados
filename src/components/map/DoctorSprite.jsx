import { useEffect, useState } from "react";

export function DoctorSprite({ av, spot, isSel, sz, i, onSelect, selected }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const speed = 200 + (i % 4) * 50; // vary speed per doctor
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), speed);
    return () => clearInterval(interval);
  }, [i]);

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
      <img src={`/sprites/doctor/frame_00${frame}.png`} alt={av.name}
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
