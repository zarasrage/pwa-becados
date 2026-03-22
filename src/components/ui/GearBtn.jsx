export function GearBtn({ onClick, T }) {
  return (
    <button className="press" onClick={onClick}
      style={{position:"fixed",top:"calc(var(--sat) + 8px)",right:12,zIndex:80,width:36,height:36,borderRadius:10,background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
      ⚙️
    </button>
  );
}
