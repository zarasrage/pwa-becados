export function SectionDivider({ label, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 6px"}}>
      <div style={{height:1,flex:1,background:T.border,opacity:0.6}}/>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.sub,padding:"2px 8px",background:T.surface2,borderRadius:99,border:`1px solid ${T.border}`}}>{label}</span>
      <div style={{height:1,flex:1,background:T.border,opacity:0.6}}/>
    </div>
  );
}
