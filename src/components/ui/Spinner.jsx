export function Spinner({ color = "#348FFF" }) {
  return (
    <div style={{display:"flex",justifyContent:"center",padding:"52px 0"}}>
      <div style={{width:22,height:22,border:`2.5px solid #2D374860`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.65s linear infinite"}}/>
    </div>
  );
}
