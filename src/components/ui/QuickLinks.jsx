const LINKS = [
  { id:"rotaciones",   icon:"⊞",  label:"Rotaciones"  },
  { id:"turnos",       icon:"◷",  label:"Mensual"     },
  { id:"equipos",      icon:"⬡",  label:"Por Equipo"  },
  { id:"pabellones",   icon:"🔪", label:"Pabellones"  },
  { id:"fellows",      icon:"⭐", label:"Fellows"     },
  { id:"estadisticas", icon:"📊", label:"Stats"       },
];

export function QuickLinks({ onNav, T }) {
  return (
    <div style={{
      display:"flex",gap:7,overflowX:"auto",padding:"0 16px 2px",marginBottom:14,
      WebkitOverflowScrolling:"touch",scrollbarWidth:"none",
    }}>
      {LINKS.map(l => (
        <button key={l.id} className="press" onClick={() => onNav(l.id)}
          style={{
            display:"inline-flex",alignItems:"center",gap:6,flexShrink:0,
            background:T.surface,border:`1px solid ${T.border}`,borderRadius:99,
            padding:"7px 13px",fontSize:13,fontWeight:600,color:T.sub,
            whiteSpace:"nowrap",cursor:"pointer",
          }}>
          <span style={{fontSize:14,lineHeight:1}}>{l.icon}</span>{l.label}
        </button>
      ))}
    </div>
  );
}
