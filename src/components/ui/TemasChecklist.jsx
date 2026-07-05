import { useEffect, useState } from "react";
import { getTemasCatalogo, saveTemasCatalogo } from "../../lib/supabaseApi.js";
import { SEM_AREAS_ALL, TEMAS_SEED } from "../../constants/temasSeminarios.js";

const SEM_COLOR = "#E879F9";

// Checklist editable de temas por especialidad. Marcado manual (hecho/no hecho),
// y edición de la lista (agregar / renombrar / borrar). Persistido en Supabase.
export function TemasChecklist({ initialArea = "Hombro", editable = false, T }) {
  const [catalogo, setCatalogo] = useState(null);
  const [area, setArea] = useState(initialArea);
  const [editRaw, setEdit] = useState(false);
  const edit = editable && editRaw;
  const [nuevo, setNuevo] = useState("");

  // Sincroniza con el tipo de seminario seleccionado afuera
  useEffect(() => { if (initialArea) setArea(initialArea); }, [initialArea]);

  useEffect(() => {
    let alive = true;
    getTemasCatalogo()
      .then(c => { if (alive) setCatalogo(c || TEMAS_SEED); })
      .catch(() => { if (alive) setCatalogo(TEMAS_SEED); });
    return () => { alive = false; };
  }, []);

  if (!catalogo) return null;
  const lista = catalogo[area] || [];
  const hechos = lista.filter(x => x.h).length;

  const persist = (next) => { setCatalogo(next); saveTemasCatalogo(next); };
  const patchArea = (fn) => persist({ ...catalogo, [area]: fn([...(catalogo[area]||[])]) });

  // Solo el Editor (editable) escribe en Supabase; la vista mensual es de solo lectura
  const toggle = (i) => { if (!editable) return; patchArea(l => { l[i] = { ...l[i], h: !l[i].h }; return l; }); };
  const rename = (i, t) => patchArea(l => { l[i] = { ...l[i], t }; return l; });
  const remove = (i) => patchArea(l => { l.splice(i, 1); return l; });
  const add = () => { const t = nuevo.trim(); if (!t) return; setNuevo(""); patchArea(l => [...l, { t, h:false }]); };

  return (
    <div style={{marginTop:14,background:T.surface,border:`1px solid ${SEM_COLOR}30`,borderRadius:12,padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:SEM_COLOR}}>
          Catálogo de temas <span style={{color:T.muted,fontWeight:600}}>· {hechos}/{lista.length}</span>
        </div>
        {editable && (
          <button className="press" onClick={()=>setEdit(e=>!e)}
            style={{fontSize:11,fontWeight:700,color:edit?"#fff":SEM_COLOR,background:edit?SEM_COLOR:`${SEM_COLOR}18`,
              border:`1px solid ${SEM_COLOR}50`,borderRadius:8,padding:"5px 12px"}}>
            {edit ? "✓ Listo" : "Editar"}
          </button>
        )}
      </div>

      {/* Selector de especialidad */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {SEM_AREAS_ALL.map(a => {
          const on = a === area;
          return (
            <button key={a} className="press" onClick={()=>setArea(a)}
              style={{padding:"4px 9px",borderRadius:99,border:`1px solid ${on?SEM_COLOR:T.border}`,
                background:on?`${SEM_COLOR}20`:T.surface2,fontSize:12,fontWeight:on?700:500,
                color:on?SEM_COLOR:T.muted,cursor:"pointer"}}>{a}</button>
          );
        })}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {lista.map((x,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            <div className={editable?"press":""} onClick={()=>toggle(i)}
              style={{width:22,height:22,flexShrink:0,borderRadius:6,cursor:editable?"pointer":"default",
                border:`1.5px solid ${x.h?SEM_COLOR:T.border}`,background:x.h?SEM_COLOR:"transparent",
                color:"#fff",fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {x.h ? "✓" : ""}
            </div>
            {edit ? (
              <>
                <input value={x.t} onChange={e=>rename(i,e.target.value)}
                  style={{flex:1,minWidth:0,padding:"4px 8px",borderRadius:7,border:`1px solid ${T.border}`,
                    background:T.surface2,color:T.text,fontSize:13,outline:"none"}}/>
                <button className="press" onClick={()=>remove(i)}
                  style={{flexShrink:0,width:26,height:26,borderRadius:7,border:`1px solid #EF444440`,
                    background:"#EF444418",color:"#EF4444",fontSize:14,cursor:"pointer"}}>×</button>
              </>
            ) : (
              <span onClick={()=>toggle(i)} style={{flex:1,fontSize:13,lineHeight:1.35,cursor:editable?"pointer":"default",
                color: x.h ? T.muted : T.text, textDecoration: x.h ? "line-through" : "none"}}>{x.t}</span>
            )}
          </div>
        ))}
      </div>

      {edit && (
        <div style={{display:"flex",gap:6,marginTop:10}}>
          <input value={nuevo} onChange={e=>setNuevo(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") add(); }}
            placeholder="Nuevo tema…"
            style={{flex:1,minWidth:0,padding:"8px 10px",borderRadius:8,border:`1px solid ${T.border}`,
              background:T.surface2,color:T.text,fontSize:13,outline:"none"}}/>
          <button className="press" onClick={add}
            style={{flexShrink:0,padding:"0 14px",borderRadius:8,border:"none",background:SEM_COLOR,
              color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Agregar</button>
        </div>
      )}
    </div>
  );
}
