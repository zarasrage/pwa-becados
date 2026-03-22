import { useState } from "react";
import { UNIVERSIDADES, UNIV_ORDER } from "../constants/universities.js";
import { DEMO_BECADO } from "../data/demo.js";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";

export function SelectScreen({ becados, onSelect, onShowRotaciones, onShowTurnos, onShowMapa, error, T }) {
  const [univ, setUniv] = useState("UNAB");
  const univCfg  = UNIVERSIDADES[univ];
  const groups   = univCfg.getGroups(becados);

  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:40}}>
      <div style={{position:"fixed",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"#348FFF08",filter:"blur(50px)",pointerEvents:"none",zIndex:0}}/>

      <div style={{padding:"calc(var(--sat) + 56px) 16px 14px",position:"relative",zIndex:1}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",marginBottom:6}}>
          Traumatología · Becados
        </div>
        <p style={{fontSize:14,color:T.sub,lineHeight:1.5,marginBottom:12}}>
          Elige tu nombre para ver tu horario del día.
        </p>

        <div style={{display:"flex",gap:6,marginBottom:14,background:T.surface2,borderRadius:12,padding:4}}>
          {UNIV_ORDER.map(u => (
            <button key={u} className="press" onClick={() => setUniv(u)}
              style={{
                flex:1,height:32,borderRadius:9,border:"none",
                background: univ===u ? T.surface : "transparent",
                boxShadow: univ===u ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                fontSize:12,fontWeight:univ===u?700:500,
                color: univ===u ? T.text : T.muted,
                transition:"all 0.15s",
              }}>
              {u}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="press anim" onClick={onShowRotaciones}
            style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.sub,animationDelay:"80ms"}}>
            <span>⊞</span> Rotaciones de hoy
          </button>
          <button className="press anim" onClick={onShowTurnos}
            style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.sub,animationDelay:"180ms"}}>
            <span>◷</span> Turnos del mes
          </button>
        </div>
      </div>

      {error && <div style={{margin:"0 16px 12px",position:"relative",zIndex:1}}><ErrorBox msg={error} T={T}/></div>}

      <div style={{padding:"0 16px",position:"relative",zIndex:1}}>
        {groups.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:32,marginBottom:10,opacity:0.2}}>👤</div>
            <div style={{fontSize:14,color:T.muted}}>Sin becados registrados</div>
          </div>
        ) : groups.map((group, gi) => {
          const grpCfg = univCfg.groups[gi] || univCfg.groups[0];
          return (
            <div key={gi} className="anim" style={{marginBottom:20,animationDelay:`${gi*70+120}ms`}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:grpCfg.color,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:grpCfg.color}}/>
                {grpCfg.label}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {group.filter(name => name !== DEMO_BECADO).map(name => (
                  <button key={name} className="press"
                    style={{display:"flex",alignItems:"center",gap:11,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 13px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Inter',sans-serif"}}
                    onClick={() => onSelect(name)}
                  >
                    <span style={{width:32,height:32,borderRadius:8,background:`${grpCfg.color}18`,color:grpCfg.color,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span style={{fontSize:14,fontWeight:500,color:T.text,flex:1}}>{name}</span>
                    <span style={{fontSize:15,color:T.muted}}>›</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="anim" style={{marginBottom:20,animationDelay:"320ms"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:T.muted}}/>
            Modo demo
          </div>
          <button className="press"
            style={{display:"flex",alignItems:"center",gap:11,background:T.surface,border:`1px dashed ${T.border}`,borderRadius:12,padding:"10px 13px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Inter',sans-serif"}}
            onClick={() => onSelect(DEMO_BECADO)}
          >
            <span style={{width:32,height:32,borderRadius:8,background:`${T.muted}18`,color:T.muted,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              ✦
            </span>
            <span style={{fontSize:14,fontWeight:500,color:T.sub,flex:1}}>{DEMO_BECADO}</span>
            <span style={{fontSize:15,color:T.muted}}>›</span>
          </button>
          <button className="press"
            style={{display:"flex",alignItems:"center",gap:11,background:T.surface,border:`1px dashed ${T.border}`,borderRadius:12,padding:"10px 13px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'Inter',sans-serif",marginTop:6}}
            onClick={onShowMapa}
          >
            <span style={{width:32,height:32,borderRadius:8,background:`${T.muted}18`,color:T.muted,fontWeight:700,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              🗺
            </span>
            <span style={{fontSize:14,fontWeight:500,color:T.sub,flex:1}}>Mapa en vivo</span>
            <span style={{fontSize:10,color:T.muted,background:T.surface2,borderRadius:99,padding:"2px 7px",border:`1px solid ${T.border}`}}>beta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
