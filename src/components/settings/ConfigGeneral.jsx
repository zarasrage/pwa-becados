import { useState } from "react";
import {
  NOTIF_TIPOS, NOTIF_CUANDO,
  getNotifPrefs, setNotifPrefs, pedirPermisoNotificaciones,
} from "../../utils/notifPrefs.js";
import { registrarPush, desregistrarPush, probarPush, pushSoportado, esIOS, instaladaEnInicio } from "../../utils/push.js";

// Cabecera común de las pantallas de configuración.
function Header({ titulo, onBack, T }) {
  return (
    <div style={{padding:"calc(var(--sat) + 14px) 60px 0 16px",display:"flex",alignItems:"center",gap:9,marginBottom:14,position:"relative",zIndex:1}}>
      <button className="press" onClick={onBack} aria-label="Volver"
        style={{width:32,height:32,borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.sub,flexShrink:0}}>‹</button>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase"}}>{titulo}</div>
    </div>
  );
}

function Pantalla({ children, T }) {
  return (
    <div style={{minHeight:"100vh",background:T.bg,maxWidth:480,margin:"0 auto",fontFamily:"'Inter',sans-serif",paddingBottom:50,position:"relative",zIndex:1}}>
      <div style={{position:"fixed",top:-80,left:-60,width:260,height:260,borderRadius:"50%",background:`${T.accent}14`,filter:"blur(60px)",pointerEvents:"none",zIndex:0}}/>
      {children}
    </div>
  );
}

// Interruptor estilo iOS.
function Switch({ on, T }) {
  return (
    <span aria-hidden style={{
      width:46,height:28,borderRadius:99,flexShrink:0,
      background: on ? T.accent : T.border,
      position:"relative",transition:"background 0.18s ease",
    }}>
      <span style={{
        position:"absolute",top:3,left: on ? 21 : 3,
        width:22,height:22,borderRadius:"50%",background:"#fff",
        boxShadow:"0 1px 3px rgba(0,0,0,0.3)",transition:"left 0.18s ease",
      }}/>
    </span>
  );
}

function Fila({ label, desc, punto, right, onClick, T }) {
  return (
    <button className="press" onClick={onClick} role={onClick ? "switch" : undefined}
      style={{
        width:"100%",display:"flex",alignItems:"center",gap:11,
        background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
        padding:"13px 14px",cursor:"pointer",textAlign:"left",fontFamily:"'Inter',sans-serif",
      }}>
      {punto && <span style={{width:9,height:9,borderRadius:"50%",background:punto,flexShrink:0,boxShadow:`0 0 6px ${punto}`}}/>}
      <span style={{flex:1,minWidth:0}}>
        <span style={{display:"block",fontSize:14.5,fontWeight:600,color:T.text}}>{label}</span>
        {desc && <span style={{display:"block",fontSize:11.5,color:T.muted,marginTop:2}}>{desc}</span>}
      </span>
      {right}
    </button>
  );
}

function Seccion({ titulo, nota, T, children }) {
  return (
    <div style={{padding:"0 16px",marginBottom:22,position:"relative",zIndex:1}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:T.muted,marginBottom:9}}>{titulo}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{children}</div>
      {nota && <div style={{fontSize:11.5,color:T.muted,marginTop:9,lineHeight:1.45}}>{nota}</div>}
    </div>
  );
}

// ── Notificaciones ───────────────────────────────────────────────────────────
function Notificaciones({ becado, onBack, T }) {
  const [prefs, setPrefs] = useState(getNotifPrefs);
  const [denegado, setDenegado] = useState(false);
  const [prueba, setPrueba] = useState("");   // "", "contando", "listo" o el motivo del error

  // iPhone solo entrega push si la app está instalada en la pantalla de inicio.
  const faltaInstalar = esIOS() && !instaladaEnInicio();

  // Guarda, y si quedó algo activado suscribe este dispositivo al push
  // (pidiendo permiso la primera vez). Si no queda nada, se da de baja.
  const guardar = async (next, pidePermiso) => {
    setPrefs(next);
    setNotifPrefs(next);

    const algoActivo = next.tipos.length > 0 || next.pabellonK;
    if (!algoActivo) { await desregistrarPush(); setDenegado(false); return; }
    if (!pushSoportado()) return;

    if (pidePermiso && !await pedirPermisoNotificaciones()) { setDenegado(true); return; }
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") return;

    setDenegado(false);
    await registrarPush(becado, next);
  };

  const toggleTipo = (id) => {
    const activo = prefs.tipos.includes(id);
    const tipos = activo ? prefs.tipos.filter(t => t !== id) : [...prefs.tipos, id];
    guardar({ ...prefs, tipos }, !activo);
  };

  return (
    <Pantalla T={T}>
      <Header titulo="Notificaciones" onBack={onBack} T={T}/>

      {faltaInstalar && (
        <div style={{margin:"0 16px 16px",padding:"11px 13px",borderRadius:12,background:"#F59E0B14",border:"1px solid #F59E0B40",fontSize:12,color:T.sub,lineHeight:1.45,position:"relative",zIndex:1}}>
          En iPhone las notificaciones solo llegan si agregas MimApp a la pantalla
          de inicio: toca Compartir y luego "Agregar a inicio", y vuelve a entrar desde ahí.
        </div>
      )}

      <Seccion titulo="Qué quiero que me avisen" T={T}
        nota="Se avisa de tus turnos, y del seminario del día si estás rotando.">
        {NOTIF_TIPOS.map(t => (
          <Fila key={t.id} label={t.label} punto={t.color} T={T}
            onClick={() => toggleTipo(t.id)}
            right={<Switch on={prefs.tipos.includes(t.id)} T={T}/>}/>
        ))}
      </Seccion>

      {denegado && (
        <div style={{margin:"0 16px 22px",padding:"11px 13px",borderRadius:12,background:"#F8717114",border:"1px solid #F8717140",fontSize:12,color:T.sub,lineHeight:1.45,position:"relative",zIndex:1}}>
          Tu teléfono tiene bloqueadas las notificaciones para la app. Actívalas en
          los ajustes del sistema para que esto funcione.
        </div>
      )}

      <Seccion titulo="Cuándo recordar" T={T}>
        {NOTIF_CUANDO.map(c => {
          const sel = prefs.cuando === c.id;
          return (
            <Fila key={c.id} label={c.label} T={T}
              onClick={() => guardar({ ...prefs, cuando: c.id }, false)}
              right={
                <span aria-hidden style={{
                  width:22,height:22,borderRadius:"50%",flexShrink:0,
                  border:`2px solid ${sel ? T.accent : T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {sel && <span style={{width:11,height:11,borderRadius:"50%",background:T.accent}}/>}
                </span>
              }/>
          );
        })}
      </Seccion>

      {/* Prueba: sirve para ver cómo llega de verdad una notificación en este
          teléfono, en particular si muestra los botones de respuesta. */}
      <Seccion titulo="Probar" T={T}
        nota="La notificación llega 5 segundos después, para que alcances a bloquear el teléfono. Trae botones Voy / No voy: si aparecen, este teléfono los soporta.">
        <Fila
          label={prueba === "contando" ? "Llega en 5 segundos…" : "Enviarme una notificación de prueba"}
          desc={prueba && prueba !== "contando" && prueba !== "listo" ? prueba : undefined}
          T={T}
          onClick={async () => {
            if (prueba === "contando") return;
            setPrueba("contando");
            const r = await probarPush(5);
            setPrueba(r.ok ? "listo" : (r.motivo || "no se pudo enviar"));
            setTimeout(() => setPrueba(""), 6000);
          }}
          right={<span style={{fontSize:15,flexShrink:0}}>{prueba === "contando" ? "⏳" : prueba === "listo" ? "✓" : "🧪"}</span>}/>
      </Seccion>

      <Seccion titulo="Pabellón K" T={T}
        nota="Si lo activas, te va a llegar el llamado de Pabellón K y te aparece el botón en tu pantalla, al lado de tu nombre.">
        <Fila label="Llamado de Pabellón K" desc="Solo lo reciben quienes lo tengan activado" T={T}
          onClick={() => guardar({ ...prefs, pabellonK: !prefs.pabellonK }, !prefs.pabellonK)}
          right={<Switch on={prefs.pabellonK} T={T}/>}/>
      </Seccion>
    </Pantalla>
  );
}

// ── Menú general ─────────────────────────────────────────────────────────────
export function ConfigGeneral({ becado, onShowThemePicker, onPreviewSplash, onBack, T }) {
  const [vista, setVista] = useState("menu");

  if (vista === "notificaciones") {
    return <Notificaciones becado={becado} onBack={() => setVista("menu")} T={T}/>;
  }

  return (
    <Pantalla T={T}>
      <Header titulo="Configuraciones" onBack={onBack} T={T}/>
      <Seccion titulo="General" T={T}>
        <Fila label="Notificaciones" desc="Turnos, recordatorios y Pabellón K" T={T}
          onClick={() => setVista("notificaciones")}
          right={<span style={{fontSize:15,color:T.muted,flexShrink:0}}>›</span>}/>
        <Fila label="Temas" desc="Apariencia de la app" T={T}
          onClick={onShowThemePicker}
          right={<span style={{fontSize:15,color:T.muted,flexShrink:0}}>›</span>}/>
        <Fila label="Ver intro" desc="Vuelve a mostrar la animación de inicio" T={T}
          onClick={onPreviewSplash}
          right={<span style={{fontSize:15,color:T.muted,flexShrink:0}}>›</span>}/>
      </Seccion>
    </Pantalla>
  );
}
