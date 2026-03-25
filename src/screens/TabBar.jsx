export function TabBar({ active, onChange, T }) {
  const isPink = T.accent === "#E8186A";
  const tabs = [
    { id:"horario",    icon:"◑", label:"Mi Horario" },
    { id:"semana",     icon:"▦", label:"Semana" },
    { id:"mes",        icon:"▦□", label:"Mes" },
  ];
  const bg = isPink ? "rgba(255,214,234,0.92)" : T.tabBg;
  const border = isPink ? "1px solid #F4A8CE60" : `1px solid ${T.border}`;
  return (
    <>
    {/* extiende el fondo del tabbar hasta el borde físico de la pantalla */}
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,
      height:"max(env(safe-area-inset-bottom, 0px), 34px)",
      background: isPink ? "rgba(255,214,234,0.96)" : T.tabBg.replace(/,\s*[\d.]+\)$/, ",1)"),
      zIndex:49,
    }}/>
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,
      background: bg,
      backdropFilter:"blur(24px)",
      WebkitBackdropFilter:"blur(24px)",
      borderTop: border,
      display:"flex",
      paddingBottom:"max(env(safe-area-inset-bottom, 0px), 34px)",
      zIndex:50,
      boxShadow: isPink ? "0 -4px 24px #E8186A18" : "none",
    }}>
      {tabs.map(tab=>{
        const isActive = active===tab.id;
        return (
          <button key={tab.id} className="press"
            style={{flex:1,border:"none",background:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              color: isPink ? (isActive ? "#E8186A" : "#CF6A9C") : (isActive?T.text:T.muted)
            }}
            onClick={()=>onChange(tab.id)}
          >
            <span style={{
              fontSize:18, lineHeight:1,
              filter: isPink && isActive ? "drop-shadow(0 0 6px #E8186A80)" : "none",
              transition:"filter 0.2s",
            }}>{tab.icon}</span>
            <span style={{fontSize:10,fontWeight:isActive?700:400,letterSpacing:"0.04em",fontFamily:"'Bricolage Grotesque',sans-serif"}}>{tab.label}</span>
            <span style={{
              width:isActive?22:0,height:isPink?3:2,borderRadius:99,
              background: isPink ? "linear-gradient(90deg,#FF4D94,#E8186A)" : (T.accent||"#348FFF"),
              boxShadow: isPink && isActive ? "0 0 8px #E8186A80" : "none",
              transition:"width 0.22s ease",marginTop:1
            }}/>
          </button>
        );
      })}
    </div>
    </>
  );
}
