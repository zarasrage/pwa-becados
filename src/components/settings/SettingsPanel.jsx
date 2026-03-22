export function SettingsPanel({ theme, onToggle, onClose, onPreviewSplash, onSwapTurnos, T }) {
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.3)"}}/>
      <div style={{
        position:"fixed",top:"calc(var(--sat) + 52px)",right:12,zIndex:100,
        background:T.surface,border:`1px solid ${T.border}`,
        borderRadius:14,padding:"14px 16px",width:200,
        boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
        animation:"slideDown 0.2s ease both",
        fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>
          Apariencia
        </div>
        <button className="press" onClick={onSwapTurnos}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>⇄</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Cambio de turno</span>
        </button>
        <button className="press" onClick={onPreviewSplash}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>🎭</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Ver intro</span>
        </button>
        <button className="press"
          onClick={onToggle}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:16}}>{theme==="dark"||theme==="pink" ? "🌙" : "☀️"}</span>
            <span style={{fontSize:13,fontWeight:500,color:T.text}}>{theme==="dark"||theme==="pink" ? "Dark" : "Light"}</span>
          </div>
          <div style={{width:36,height:20,borderRadius:99,background:theme==="light"?T.border:(T.accent||"#348FFF"),position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:theme==="light"?2:18,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </button>
      </div>
    </>
  );
}
