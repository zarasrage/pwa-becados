export function SectionDivider({ label, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0 4px"}}>
      <div style={{height:1,flex:1,background:T.border}}/>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted}}>{label}</span>
      <div style={{height:1,flex:1,background:T.border}}/>
    </div>
  );
}
