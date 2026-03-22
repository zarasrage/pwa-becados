import { formatDate } from "../../utils/dates.js";

export function DateNav({ date, today, onPrev, onNext, onToday, T }) {
  const isToday = date === today;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <button className="press" onClick={onPrev}
        style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>
        ‹
      </button>
      <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:500,color:T.text,textTransform:"capitalize"}}>
        {formatDate(date)}
      </div>
      <button className="press" onClick={onNext}
        style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>
        ›
      </button>
      {!isToday && (
        <button className="press" onClick={onToday}
          style={{height:32,padding:"0 11px",borderRadius:8,border:`1px solid ${T?.accent||"#348FFF"}60`,background:`${T?.accent||"#348FFF"}14`,fontSize:11,fontWeight:700,color:T?.accent||"#348FFF",letterSpacing:"0.05em",flexShrink:0}}>
          HOY
        </button>
      )}
    </div>
  );
}
