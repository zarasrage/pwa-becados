import { DoctorSprite } from "./DoctorSprite.jsx";

export function BuildingCard({ building, avatars, selected, onSelect, T }) {
  const { id, label, accent, desc, sprite, floorSpots } = building;
  const count = avatars.length;

  // ── Sprite-based scene ──
  if (sprite && floorSpots) {
    return (
      <div className="anim" style={{position:"relative"}}>
        {/* Name — simple text */}
        <div style={{fontSize:11,fontWeight:700,color:T.text,fontFamily:"'Bricolage Grotesque',sans-serif",marginBottom:4,textAlign:"center"}}>
          {label}
        </div>

        {/* Scene: building + avatars, transparent bg */}
        <div style={{position:"relative"}}>
          <img src={sprite} alt={label} style={{
            width:"100%",height:"auto",display:"block",
            imageRendering:"pixelated",
          }}/>
          {avatars.slice(0, floorSpots.length).map((av, i) => {
            const spot = floorSpots[i];
            const isSel = selected?.name === av.name;
            const sz = isSel ? 72 : 60;
            // Cycle through 4 frames with different speed per doctor
            const frameIdx = Math.floor(Date.now() / (180 + i * 30)) % 4;
            return (
              <DoctorSprite key={av.name} av={av} spot={spot} isSel={isSel} sz={sz} i={i}
                onSelect={onSelect} selected={selected}/>
            );
          })}
          {avatars.length > floorSpots.length && (
            <div style={{
              position:"absolute",bottom:4,right:4,
              background:"#00000088",color:"#fff",fontSize:8,fontWeight:700,
              padding:"2px 5px",borderRadius:4,
              fontFamily:"'JetBrains Mono',monospace",
            }}>
              +{avatars.length - floorSpots.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Fallback: no sprite yet ──
  return (
    <div className="anim" style={{position:"relative"}}>
      <div style={{fontSize:11,fontWeight:700,color:T.text,fontFamily:"'Bricolage Grotesque',sans-serif",marginBottom:4,textAlign:"center"}}>
        {label}
      </div>
      <div style={{
        aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",
        borderRadius:10,border:`1px dashed ${T.border}`,background:T.surface+"40",
      }}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:T.muted}}>{count > 0 ? count+" becado"+(count!==1?"s":"") : "Vacío"}</div>
        </div>
      </div>
    </div>
  );
}
