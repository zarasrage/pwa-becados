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
      display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,padding:"0 16px",marginBottom:14,
    }}>
      {LINKS.map(l => (
        <button key={l.id} className="press" onClick={() => onNav(l.id)}
          style={{
            display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
            background:T.surface,border:`1px solid ${T.border}`,borderRadius:11,
            padding:"9px 6px",fontSize:12.5,fontWeight:600,color:T.sub,
            whiteSpace:"nowrap",cursor:"pointer",minWidth:0,overflow:"hidden",
          }}>
          <span style={{fontSize:14,lineHeight:1,flexShrink:0}}>{l.icon}</span>
          <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis"}}>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
