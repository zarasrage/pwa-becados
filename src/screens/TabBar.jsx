const ICONS = {
  // Día — sol (un día concreto)
  horario: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
    </svg>
  ),
  // Semana — filas (lista de días)
  semana: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="4" rx="1"/>
      <rect x="3" y="14" width="18" height="4" rx="1"/>
    </svg>
  ),
  // Mes — calendario en grilla
  mes: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/>
      <path d="M3 9h18M8 2v4M16 2v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/>
    </svg>
  ),
};

export function TabBar({ active, onChange, T }) {
  const isGlass = !!T.glass;
  const tabs = [
    { id:"horario", label:"Día" },
    { id:"semana",  label:"Semana" },
    { id:"mes",     label:"Mes" },
  ];
  return (
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,
      background: isGlass ? "rgba(255,214,234,0.88)" : T.tabBg,
      backdropFilter:"blur(24px)",
      WebkitBackdropFilter:"blur(24px)",
      borderTop: isGlass ? "1px solid #F4A8CE60" : `1px solid ${T.border}`,
      display:"flex",
      paddingBottom:"calc(var(--sab) + 6px)",
      zIndex:50,
      boxShadow: isGlass ? "0 -4px 24px #E8186A18" : "none",
    }}>
      {tabs.map(tab=>{
        const isActive = active===tab.id;
        return (
          <button key={tab.id} className="press"
            style={{flex:1,border:"none",background:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              color: isGlass ? (isActive ? "#E8186A" : "#CF6A9C") : (isActive?T.text:T.muted)
            }}
            onClick={()=>onChange(tab.id)}
          >
            <span style={{
              display:"flex",alignItems:"center",justifyContent:"center",height:22,
              filter: isGlass && isActive ? "drop-shadow(0 0 6px #E8186A80)" : "none",
              transition:"filter 0.2s",
            }}>{ICONS[tab.id](isActive)}</span>
            <span style={{fontSize:12,fontWeight:isActive?700:500,letterSpacing:"0.04em",fontFamily:"'Bricolage Grotesque',sans-serif"}}>{tab.label}</span>
            <span style={{
              width:isActive?22:0,height:isGlass?3:2,borderRadius:99,
              background: isGlass ? "linear-gradient(90deg,#FF4D94,#E8186A)" : (T.accent||"#348FFF"),
              boxShadow: isGlass && isActive ? "0 0 8px #E8186A80" : "none",
              transition:"width 0.22s ease",marginTop:1
            }}/>
          </button>
        );
      })}
    </div>
  );
}
