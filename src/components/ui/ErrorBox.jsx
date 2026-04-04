export function ErrorBox({ msg, T }) {
  if (!msg) return null;
  return <div style={{background:"#2D1515",border:"1px solid #F8717140",borderRadius:10,padding:"10px 13px",fontSize:13,color:"#F87171",marginBottom:12}}>{msg}</div>;
}
