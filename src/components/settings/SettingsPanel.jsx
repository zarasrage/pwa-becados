export function SettingsPanel({ onClose, onPreviewSplash, onSwapTurnos, onShowThemePicker, T }) {
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
        <button className="press" onClick={onShowThemePicker}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
          <span style={{fontSize:15}}>🎨</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Temas</span>
        </button>
      </div>
    </>
  );
}
