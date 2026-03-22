// ── Sakura petals SVG ────────────────────────────────────────────────────────
// ✦ OPTIMIZADO: drop-shadow removido del SVG, glow via box-shadow en padre
function PetalSVG({ size, color, opacity }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:"block"}}>
      <path d="M12 2 C14 5, 19 6, 20 10 C21 14, 18 19, 12 22 C6 19, 3 14, 4 10 C5 6, 10 5, 12 2Z"
        fill={color} opacity={opacity}/>
      <path d="M12 2 C12 8, 14 14, 12 22" stroke="white" strokeWidth="0.4" opacity="0.35" fill="none"/>
    </svg>
  );
}

export const PETAL_COLORS = [
  "#FF4D94","#FF69B4","#FF1A75","#FF85B8","#E8186A",
  "#FF3380","#FFB3D1","#F50057","#FF6BA8","#FF0066",
];

export const PETALS_CONFIG = Array.from({length: 18}, (_, i) => ({
  id: i,
  left:     (i * 5.8 + Math.sin(i * 2.3) * 8),
  size:     14 + (i % 5) * 5,
  duration: 5 + (i % 6) * 1.8,
  swayDur:  2 + (i % 5) * 0.9,
  delay:    -(i * 0.75 + (i % 4) * 1.1),
  color:    PETAL_COLORS[i % PETAL_COLORS.length],
  opacity:  0.55 + (i % 4) * 0.12,
  rotate:   i * 37,
}));

// ✦ OPTIMIZADO: blur→gradiente más ancho, glow via box-shadow en petal div
export function SakuraPetals() {
  return (
    <>
      <div style={{position:"fixed",top:-120,left:-120,width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle, #FF4D9440 0%, transparent 50%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:-100,right:-100,width:340,height:340,borderRadius:"50%",background:"radial-gradient(circle, #E8186A30 0%, transparent 50%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:40,right:-80,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle, #FF69B428 0%, transparent 50%)",pointerEvents:"none",zIndex:0}}/>
      {PETALS_CONFIG.map(p => (
        <div key={p.id} className="petal" style={{
          left: `${p.left}%`,
          top: 0,
          width: p.size,
          height: p.size,
          animationDuration: `${p.duration}s, ${p.swayDur}s`,
          animationDelay: `${p.delay}s, ${p.delay * 0.6}s`,
          transform: `rotate(${p.rotate}deg)`,
          boxShadow: `0 0 ${p.size*0.5}px ${p.color}70`,
        }}>
          <PetalSVG size={p.size} color={p.color} opacity={p.opacity}/>
        </div>
      ))}
    </>
  );
}
