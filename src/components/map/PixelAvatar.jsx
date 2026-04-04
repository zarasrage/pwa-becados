export function PixelAvatar({ color, initial, size = 28, selected, onClick, name }) {
  const skin = "#FFD5B0";
  const hair = "#3D2B1F";
  const coat = "#FFFFFF";
  const accent = color;
  return (
    <div className="press" onClick={onClick} style={{
      display:"inline-flex",flexDirection:"column",alignItems:"center",gap:2,
      width: size + 12,
      transition:"transform 0.15s",
      transform: selected ? "scale(1.18)" : "none",
    }}>
      <svg viewBox="0 0 12 18" width={size} height={size*1.5} style={{imageRendering:"pixelated",display:"block"}}>
        {/* Hair */}
        <rect x="3" y="0" width="6" height="2" fill={hair}/>
        <rect x="2" y="1" width="8" height="1" fill={hair}/>
        {/* Head */}
        <rect x="3" y="2" width="6" height="5" fill={skin}/>
        <rect x="2" y="3" width="1" height="3" fill={skin}/>
        <rect x="9" y="3" width="1" height="3" fill={skin}/>
        {/* Eyes */}
        <rect x="4" y="3" width="1" height="2" fill="#2D1B0E"/>
        <rect x="7" y="3" width="1" height="2" fill="#2D1B0E"/>
        {/* Mouth */}
        <rect x="5" y="6" width="2" height="1" fill="#C4956A"/>
        {/* Lab coat body */}
        <rect x="2" y="7" width="8" height="6" fill={coat}/>
        {/* Colored accent stripe (stethoscope/collar) */}
        <rect x="4" y="7" width="4" height="1" fill={accent}/>
        <rect x="5" y="8" width="2" height="2" fill={accent+"80"}/>
        {/* Arms — coat sleeves */}
        <rect x="0" y="8" width="2" height="4" fill={coat}/>
        <rect x="10" y="8" width="2" height="4" fill={coat}/>
        {/* Hands */}
        <rect x="0" y="12" width="2" height="1" fill={skin}/>
        <rect x="10" y="12" width="2" height="1" fill={skin}/>
        {/* Coat buttons */}
        <rect x="6" y="10" width="1" height="1" fill={accent+"60"}/>
        <rect x="6" y="12" width="1" height="1" fill={accent+"60"}/>
        {/* Pants */}
        <rect x="3" y="13" width="3" height="3" fill={accent+"CC"}/>
        <rect x="7" y="13" width="3" height="3" fill={accent+"CC"}/>
        {/* Shoes */}
        <rect x="2" y="16" width="3" height="2" fill="#1A1A1A"/>
        <rect x="7" y="16" width="3" height="2" fill="#1A1A1A"/>
      </svg>
      {/* Name label */}
      <div style={{
        fontSize: selected ? 8 : 7,
        fontWeight: selected ? 800 : 600,
        color: selected ? accent : color+"BB",
        fontFamily:"'JetBrains Mono',monospace",
        lineHeight:1,
        whiteSpace:"nowrap",
        maxWidth: size + 12,
        overflow:"hidden",
        textOverflow:"ellipsis",
        textAlign:"center",
        transition:"all 0.12s",
      }}>
        {name || initial}
      </div>
    </div>
  );
}
