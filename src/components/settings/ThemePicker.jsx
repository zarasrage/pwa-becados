import { useState } from "react";

export const THEME_OPTIONS = [
  { id:"dark",      name:"Void",       desc:"El original",            preview:["#0D1117","#161B22","#348FFF"], emoji:"⬛" },
  { id:"light",     name:"Blanco",     desc:"Claridad total",         preview:["#F4F7FB","#FFFFFF","#348FFF"], emoji:"☀️" },
  { id:"pink",      name:"Sakura",     desc:"Petalos de cerezo",      preview:["#FEE6F2","#FFF0F8","#E8186A"], emoji:"🌸" },
  { id:"ocean",     name:"Abismo",     desc:"Profundidades del mar",  preview:["#04080F","#071424","#00C8FF"], emoji:"🌊" },
  { id:"sunset",    name:"Volcan",     desc:"Calor y brasa",          preview:["#0F0500","#1C0A05","#FF5500"], emoji:"🌋" },
  { id:"forest",    name:"Bosque",     desc:"Luciernagas nocturnas",  preview:["#020A04","#071510","#22D45A"], emoji:"🌿" },
  { id:"aurora",    name:"Aurora",     desc:"Luces del norte",        preview:["#020510","#060B1C","#8A5CF6"], emoji:"🔮" },
  { id:"neon",      name:"Glitch",     desc:"Ciudad cyberpunk",       preview:["#03000A","#080018","#CC00FF"], emoji:"⚡" },
  { id:"synthwave", name:"Synthwave",  desc:"Horizonte retro 80s",    preview:["#0A0015","#130028","#FF006E"], emoji:"🌅" },
  { id:"cryo",      name:"Cryo",       desc:"Cristal glacial",        preview:["#020D1A","#061828","#00CFFF"], emoji:"❄️" },
  { id:"cosmos",    name:"Cosmos",     desc:"Nebulosa y estrellas",   preview:["#020008","#080018","#FF6BF5"], emoji:"🌌" },
  { id:"tormenta", name:"Tormenta",   desc:"Rayos y lluvia eléctrica",preview:["#04060E","#0A1020","#00E5FF"], emoji:"⛈️" },
  { id:"wabi",     name:"Shodo",      desc:"Pincelazos de tinta épicos",  preview:["#F7F2E8","#FDFAF4","#C8A010"], emoji:"🖋️" },
  { id:"amanecer", name:"Prisma",     desc:"Luz blanca fragmentada",      preview:["#FDFCFF","#F8F6FF","#A040FF"], emoji:"💎" },
];

export const ACCENT_MAP = {
  dark:"#348FFF", light:"#348FFF", pink:"#E8186A",
  ocean:"#00C8FF", sunset:"#FF5500", forest:"#22D45A", aurora:"#8A5CF6", neon:"#CC00FF",
  synthwave:"#FF006E", cryo:"#00CFFF", cosmos:"#FF6BF5", tormenta:"#00E5FF",
  wabi:"#C8A010", amanecer:"#A040FF",
};

export function ThemePicker({ current, onSelect, onClose }) {
  const [hovered, setHovered] = useState(null);
  const accent = ACCENT_MAP[current] || "#348FFF";
  const isDark = !["light","pink","wabi","amanecer"].includes(current);

  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed",inset:0,zIndex:290,
        background:"rgba(0,0,0,0.65)",
        backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
        animation:"fadeIn 0.18s ease both",
      }}/>
      <div style={{
        position:"fixed",left:"50%",top:"50%",
        transform:"translate(-50%,-50%)",
        zIndex:300,
        width:"min(94vw, 400px)",
        background: isDark
          ? `linear-gradient(160deg, ${accent}08 0%, #000000F0 40%)`
          : "rgba(255,255,255,0.97)",
        border:`1px solid ${accent}35`,
        borderRadius:28,
        padding:"22px 16px 18px",
        boxShadow:`0 0 80px ${accent}20, 0 0 0 1px ${accent}15, 0 32px 80px rgba(0,0,0,0.6)`,
        animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        fontFamily:"'Inter',sans-serif",
        overflowY:"auto",
        maxHeight:"88vh",
      }}>
        <div style={{
          position:"absolute",top:0,left:"10%",right:"10%",height:1,
          background:`linear-gradient(90deg, transparent, ${accent}80, transparent)`,
          borderRadius:99,
        }}/>
        <div style={{textAlign:"center",marginBottom:20,position:"relative"}}>
          <div style={{
            fontFamily:"'Bricolage Grotesque',sans-serif",
            fontSize:24,fontWeight:800,lineHeight:1.1,
            color: isDark ? "#F0EFFF" : "#0A0A14",
            letterSpacing:"-0.02em",
            marginBottom:4,
          }}>
            Elige tu tema
          </div>
          <div style={{fontSize:11,color: isDark ? "#556080" : "#94A3B8"}}>
            Cada tema transforma la experiencia
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {THEME_OPTIONS.map((opt, i) => {
            const ac      = ACCENT_MAP[opt.id] || "#348FFF";
            const isActive = current === opt.id;
            const isHov    = hovered === opt.id;
            return (
              <button key={opt.id} className="press"
                onPointerEnter={() => setHovered(opt.id)}
                onPointerLeave={() => setHovered(null)}
                onClick={() => { onSelect(opt.id); onClose(); }}
                style={{
                  position:"relative",
                  background: isActive
                    ? `linear-gradient(135deg, ${ac}22 0%, ${ac}0A 100%)`
                    : isHov
                      ? `${opt.preview[0]}EE`
                      : `${opt.preview[0]}CC`,
                  border:`1.5px solid ${isActive ? ac+"70" : isHov ? ac+"40" : ac+"18"}`,
                  borderRadius:18,
                  padding:"13px 11px 11px",
                  cursor:"pointer",
                  textAlign:"left",
                  transition:"all 0.16s ease",
                  overflow:"hidden",
                  boxShadow: isActive
                    ? `0 0 24px ${ac}25, inset 0 0 24px ${ac}08`
                    : isHov
                      ? `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${ac}15`
                      : "none",
                }}>
                {isActive && (
                  <div style={{
                    position:"absolute",top:0,left:"15%",right:"15%",height:2,
                    background:`linear-gradient(90deg, transparent, ${ac}, transparent)`,
                    borderRadius:99,
                  }}/>
                )}
                {isActive && (
                  <div style={{
                    position:"absolute",top:9,left:9,
                    width:7,height:7,borderRadius:"50%",
                    background:ac,boxShadow:`0 0 10px ${ac}, 0 0 4px ${ac}`,
                  }}/>
                )}
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}>
                  <div style={{width:22,height:22,borderRadius:8,background:opt.preview[0],border:`1px solid ${ac}20`,flexShrink:0}}/>
                  <div style={{width:16,height:16,borderRadius:6,background:opt.preview[1],border:`1px solid ${ac}15`,flexShrink:0}}/>
                  <div style={{width:12,height:12,borderRadius:4,background:ac,boxShadow:`0 0 8px ${ac}90`,flexShrink:0}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:18,lineHeight:1,filter: isActive||isHov ? "none" : "saturate(0.7)"}}>{opt.emoji}</span>
                  <span style={{
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                    fontSize:15,fontWeight:800,lineHeight:1,
                    color: isActive ? ac : isHov ? "#E8F0FF" : "#8090B0",
                    transition:"color 0.15s",
                  }}>{opt.name}</span>
                </div>
                <div style={{fontSize:10,lineHeight:1.4,paddingLeft:24,color: isActive ? ac+"99" : "#445060"}}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{marginTop:16,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{height:1,flex:1,background: isDark ? "#ffffff10" : "#00000010"}}/>
          <button className="press" onClick={onClose} style={{
            fontSize:11,fontWeight:600,letterSpacing:"0.05em",
            color: isDark ? "#445060" : "#94A3B8",
            background:"none",border:`1px solid ${isDark?"#ffffff12":"#00000010"}`,
            borderRadius:99,padding:"5px 14px",cursor:"pointer",
          }}>
            cerrar
          </button>
          <div style={{height:1,flex:1,background: isDark ? "#ffffff10" : "#00000010"}}/>
        </div>
      </div>
    </>
  );
}
