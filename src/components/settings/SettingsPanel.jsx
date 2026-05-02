import { useState, useMemo } from "react";

const FOTOS = [
  "/fotos/WhatsApp Image 2026-05-02 at 16.37.38.jpeg",
  "/fotos/WhatsApp Image 2026-05-02 at 16.37.38 (1).jpeg",
  "/fotos/WhatsApp Image 2026-05-02 at 16.37.38 (2).jpeg",
  "/fotos/WhatsApp Image 2026-05-02 at 16.37.38 (3).jpeg",
  "/fotos/WhatsApp Image 2026-05-02 at 16.37.38 (4).jpeg",
  "/fotos/WhatsApp Image 2026-05-02 at 16.37.38 (5).jpeg",
];

export function SettingsPanel({ onClose, onPreviewSplash, onSwapTurnos, onShowThemePicker, T }) {
  const [showSug, setShowSug] = useState(false);
  const [text, setText]       = useState("");
  const [sent, setSent]       = useState(false);
  const [foto, setFoto]       = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.3)"}}/>
      <div style={{
        position:"fixed",top:"calc(var(--sat) + 52px)",right:12,zIndex:100,
        background:T.surface,border:`1px solid ${T.border}`,
        borderRadius:14,padding:"14px 16px",width:200,
        boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
        animation:"slideDown 0.2s ease both",
        fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>
          Apariencia
        </div>
        <button className="press" onClick={onSwapTurnos}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>⇄</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Cambio de turno</span>
        </button>
        <button className="press" onClick={onPreviewSplash}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>🎭</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Ver intro</span>
        </button>
        <button className="press" onClick={onShowThemePicker}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <span style={{fontSize:15}}>🎨</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Temas</span>
        </button>
        <button className="press" onClick={() => { setShowSug(true); setSent(false); setText(""); }}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
          <span style={{fontSize:15}}>📬</span>
          <span style={{fontSize:13,fontWeight:500,color:T.sub}}>Sugerencias</span>
        </button>
      </div>

      {showSug && (
        <>
          <div onClick={() => setShowSug(false)} style={{position:"fixed",inset:0,zIndex:110,background:"rgba(0,0,0,0.4)"}}/>
          <div style={{
            position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            zIndex:120,background:T.surface,border:`1px solid ${T.border}`,
            borderRadius:18,padding:"22px 20px",width:280,
            boxShadow:"0 12px 40px rgba(0,0,0,0.3)",
            fontFamily:"'Inter',sans-serif",
          }}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>📬 Buzón de sugerencias</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Comentarios, sugerencias, reclamos...</div>

            {!sent ? (
              <>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Escribe aquí tu sugerencia..."
                  rows={4}
                  style={{
                    width:"100%",boxSizing:"border-box",resize:"none",
                    background:T.surface2,border:`1px solid ${T.border}`,
                    borderRadius:10,padding:"10px 12px",
                    fontSize:13,color:T.text,fontFamily:"'Inter',sans-serif",
                    outline:"none",marginBottom:12,
                  }}
                />
                <button className="press" onClick={() => { setLoading(true); setTimeout(() => { setFoto(FOTOS[Math.floor(Math.random()*FOTOS.length)]); setSent(true); setLoading(false); }, 1500); }}
                  style={{width:"100%",background:"#6366f1",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",opacity:loading?0.7:1}}>
                  {loading ? "Enviando..." : "Enviar"}
                </button>
              </>
            ) : (
              <div style={{textAlign:"center",padding:"10px 0"}}>
                <img src={foto} alt="" style={{width:"100%",borderRadius:10,marginBottom:10,objectFit:"cover",maxHeight:180}}/>
                <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:6}}>Era broma.</div>
                <div style={{fontSize:12,color:T.muted,lineHeight:1.5}}>No tenemos un buzón de sugerencias disponible.<br/>Solo queda llorar.</div>
                <button className="press" onClick={() => setShowSug(false)}
                  style={{marginTop:16,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 20px",fontSize:12,color:T.sub,cursor:"pointer"}}>
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
