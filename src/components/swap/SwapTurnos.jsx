import { useMemo, useState } from "react";
import { API_URL, API_TOKEN } from "../../constants/api.js";
import { todayISO, formatDate } from "../../utils/dates.js";
import { cacheKey, _revalidatedThisSession } from "../../utils/cache.js";
import { safeStorage } from "../../utils/storage.js";
import { TurnoSelector } from "./TurnoSelector.jsx";

export function SwapTurnos({ becados, onClose, T }) {
  const today   = useMemo(() => todayISO(), []);
  const curMonth = today.slice(0, 7);

  const TIPO_OPTS = [
    { id:"P", label:"Poli",  sheet:"Dia",          color:"#06B6D4" },
    { id:"D", label:"Día",   sheet:"Dia",          color:"#F59E0B" },
    { id:"N", label:"Noche", sheet:"Noche",        color:"#4F6EFF" },
    { id:"A", label:"Artro", sheet:"Artroscopia",   color:"#72FF00" },
  ];
  const [tipo,    setTipo]    = useState("P");
  const [selA,    setSelA]    = useState(null);
  const [selB,    setSelB]    = useState(null);
  const [pin,     setPin]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const handleTipo = (id) => { setTipo(id); setSelA(null); setSelB(null); setResult(null); };
  const tipoObj  = TIPO_OPTS.find(t => t.id === tipo);
  const canSubmit = selA && selB && pin.length === 4 && !loading
    && !(selA.becado === selB.becado && selA.date === selB.date)
    && selA.date !== selB.date;

  const handleSwap = async () => {
    if (!canSubmit) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(API_URL, {
        method:"POST",
        headers:{"Content-Type":"text/plain"},
        body: JSON.stringify({
          route:"swap_turno", pin,
          becado1: selA.becado, date1: selA.date,
          becado2: selB.becado, date2: selB.date,
          sheet: tipoObj.sheet, tipoCode: tipo,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Limpiar caché local para las fechas afectadas en ambos becados
        const affectedParams = [
          {route:"daily",becado:selA.becado,date:selA.date,token:API_TOKEN},
          {route:"daily",becado:selA.becado,date:selB.date,token:API_TOKEN},
          {route:"daily",becado:selB.becado,date:selA.date,token:API_TOKEN},
          {route:"daily",becado:selB.becado,date:selB.date,token:API_TOKEN},
        ];
        affectedParams.forEach(p => {
          safeStorage.remove(cacheKey(p));
          _revalidatedThisSession.delete(cacheKey(p));
        });
        // Disparar recarga en TabSemana si está escuchando
        window.dispatchEvent(new CustomEvent("dataVersionChanged"));
        setResult({ ok:true, msg:"✓ Cambio aplicado correctamente" });
        setPin(""); setSelA(null); setSelB(null);
      } else {
        setResult({ ok:false, msg: data.error || "Error al aplicar el cambio" });
      }
    } catch(e) {
      setResult({ ok:false, msg:"Error de conexión" });
    }
    setLoading(false);
  };

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:190,background:"rgba(0,0,0,0.55)"}}/>
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:200,
        background:T.surface, borderRadius:"22px 22px 0 0",
        boxShadow:"0 -12px 48px rgba(0,0,0,0.35)",
        fontFamily:"'Inter',sans-serif",
        maxHeight:"92vh", display:"flex", flexDirection:"column",
      }}>
        <div style={{padding:"12px 20px 16px", flexShrink:0, borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:40,height:4,borderRadius:99,background:T.border,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted,marginBottom:2}}>Administración</div>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:800,color:T.text,lineHeight:1.1}}>Cambio de turno</div>
            </div>
            <button className="press" onClick={onClose}
              style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:T.muted}}>
              ✕
            </button>
          </div>
        </div>

        <div style={{overflowY:"auto",padding:"16px 20px",flex:1,display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Tipo de turno</div>
            <div style={{display:"flex",gap:8}}>
              {TIPO_OPTS.map(o => (
                <button key={o.id} className="press" onClick={() => handleTipo(o.id)}
                  style={{flex:1,height:40,borderRadius:10,border:`1px solid ${tipo===o.id ? o.color+"80" : T.border}`,background:tipo===o.id ? `${o.color}20` : T.surface2,fontSize:13,fontWeight:tipo===o.id?700:500,color:tipo===o.id?o.color:T.sub,transition:"all 0.15s"}}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <TurnoSelector label="Becado A" becados={becados} tipoCode={tipo} selected={selA} onSelect={setSelA} T={T}/>

          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,height:1,background:T.border}}/>
            <div style={{width:32,height:32,borderRadius:8,background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:T.muted}}>⇅</div>
            <div style={{flex:1,height:1,background:T.border}}/>
          </div>

          <TurnoSelector label="Becado B" becados={becados} tipoCode={tipo} selected={selB} onSelect={setSelB} T={T}/>

          {selA && selB && (
            <div style={{background:T.surface2,border:`1px solid ${tipoObj.color}30`,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:11,fontWeight:700,color:tipoObj.color,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Confirmando cambio</div>
              <div style={{fontSize:13,color:T.sub,lineHeight:1.8}}>
                <span style={{color:T.text,fontWeight:600}}>{selA.becado}</span> el {formatDate(selA.date).split(",")[1]?.trim() || selA.date}
                <span style={{color:T.muted}}> ↔ </span>
                <span style={{color:T.text,fontWeight:600}}>{selB.becado}</span> el {formatDate(selB.date).split(",")[1]?.trim() || selB.date}
              </div>
            </div>
          )}

          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>PIN de administrador</div>
            <input
              type="password" inputMode="numeric" maxLength={4} placeholder="_ _ _ _"
              value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g,""))}
              style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,color:T.text,fontSize:24,textAlign:"center",letterSpacing:"0.5em",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
            />
          </div>

          {result && (
            <div style={{padding:"11px 14px",borderRadius:10,background:result.ok?"#13C04518":"#F8717118",border:`1px solid ${result.ok?"#13C04540":"#F8717140"}`,fontSize:13,color:result.ok?"#13C045":"#F87171",lineHeight:1.4}}>
              {result.msg}
            </div>
          )}

          <div style={{height:4}}/>
        </div>

        <div style={{padding:`12px 20px calc(var(--sab) + 16px)`,flexShrink:0,borderTop:`1px solid ${T.border}`}}>
          <button className="press" onClick={handleSwap} disabled={!canSubmit}
            style={{width:"100%",height:50,borderRadius:13,border:"none",background:canSubmit?(T?.accent||"#348FFF"):(T?.accent||"#348FFF")+"38",color:canSubmit?"#fff":"#ffffff80",fontSize:15,fontWeight:700,transition:"all 0.15s",cursor:canSubmit?"pointer":"default"}}>
            {loading ? "Aplicando…" : "Confirmar cambio"}
          </button>
        </div>
      </div>
    </>
  );
}
