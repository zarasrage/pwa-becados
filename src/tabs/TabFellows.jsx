import { FELLOWS, ESPECIALIDADES_FELLOWS } from "../data/fellows.js";

export function TabFellows({ onBack, T }) {
  return (
    <div style={{ minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40 }}>

      {/* Header */}
      <div style={{ position:"sticky",top:0,zIndex:10,background:T.bg,paddingTop:"calc(var(--sat) + 12px)",paddingBottom:10,borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"0 16px" }}>
          <button onClick={onBack} className="press"
            style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",fontSize:13,color:T.sub,fontWeight:500 }}>
            ‹ Volver
          </button>
          <div>
            <div style={{ fontSize:15,fontWeight:700,color:T.text }}>Fellows</div>
            <div style={{ fontSize:11,color:T.muted }}>Subespecialidad · {FELLOWS.length} fellows</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 16px" }}>
        {ESPECIALIDADES_FELLOWS.map(({ nombre: esp, color }) => {
          const fellows = FELLOWS.filter(f => f.especialidad === esp);
          if (fellows.length === 0) return null;
          return (
            <div key={esp} style={{ marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0 }}/>
                <div style={{ fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color }}>{esp}</div>
                <div style={{ fontSize:10,color:T.muted,background:T.surface2,borderRadius:99,padding:"1px 7px",border:`1px solid ${T.border}` }}>
                  {fellows.length} {fellows.length === 1 ? "fellow" : "fellows"}
                </div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {fellows.map(f => (
                  <div key={f.nombre} style={{ display:"flex",alignItems:"center",gap:11,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 13px" }}>
                    <span style={{ width:32,height:32,borderRadius:8,background:`${color}18`,color,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Bricolage Grotesque',sans-serif" }}>
                      {f.nombre.charAt(0).toUpperCase()}
                    </span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,fontWeight:500,color:T.text }}>{f.nombre}</div>
                      <div style={{ fontSize:11,color:T.muted,marginTop:1 }}>Fellow · {esp}</div>
                    </div>
                    <div style={{ fontSize:10,color,background:`${color}15`,borderRadius:99,padding:"2px 9px",fontWeight:600,border:`1px solid ${color}33` }}>
                      {esp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
