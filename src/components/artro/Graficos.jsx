import { useMemo } from "react";
import { TIPOS_ACTIVOS } from "../../constants/artro.js";
import { curvaAprendizaje, porMano, resumen, mejoraPorBecado } from "../../utils/artroStats.js";
import { displayName } from "../../utils/displayName.js";

// Paleta de datos. Dos pasos de los mismos dos tonos: uno para fondos claros y
// otro para oscuros. Validada para daltonismo en ambos modos; no se cambia sin
// volver a validarla.
const PAL = {
  claro:  { s1: "#2a78d6", s2: "#eb6834", bien: "#2a78d6", mal: "#d03b3b", grilla: "#00000014" },
  oscuro: { s1: "#3987e5", s2: "#d95926", bien: "#3987e5", mal: "#e66767", grilla: "#ffffff1f" },
};

// El tema lo elige el usuario entre casi veinte, así que el modo se deduce del
// brillo del fondo en vez de mantener una lista.
function paleta(bg) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(bg || "").trim());
  if (!m) return PAL.claro;
  const v = parseInt(m[1], 16);
  const lum = (0.2126 * (v >> 16 & 255) + 0.7152 * (v >> 8 & 255) + 0.0722 * (v & 255)) / 255;
  return lum < 0.5 ? PAL.oscuro : PAL.claro;
}

const seg = ms => Math.round(ms / 1000);
const mmss = ms => {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

function Titulo({ children, nota, T }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 15, fontWeight: 800, color: T.text }}>
        {children}
      </div>
      {nota && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, lineHeight: 1.45 }}>{nota}</div>}
    </div>
  );
}

function Caja({ children, T }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: "13px 14px", marginBottom: 12,
    }}>{children}</div>
  );
}

// ── 1. Curva de aprendizaje ──────────────────────────────────────────────────
// Un panel chico por ejercicio: comparar cinco líneas sobre un mismo eje sería
// ilegible en un teléfono, y además cada ejercicio tiene su propia escala.
function PanelCurva({ tipo, puntos, P, T }) {
  const W = 168, H = 62, ml = 4, mr = 4, mt = 6, mb = 2;
  if (puntos.length < 2) {
    return (
      <div style={{ width: W, opacity: 0.5 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginBottom: 2 }}>{tipo.label}</div>
        <div style={{ fontSize: 10.5, color: T.muted, height: H, display: "flex", alignItems: "center" }}>
          sin datos suficientes
        </div>
      </div>
    );
  }
  const ys = puntos.map(p => p.mediana);
  const yMax = Math.max(...ys), yMin = Math.min(...ys);
  const span = yMax - yMin || 1;
  const x = i => ml + (i / (puntos.length - 1)) * (W - ml - mr);
  const y = v => mt + (1 - (v - yMin) / span) * (H - mt - mb);
  const d = puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.mediana).toFixed(1)}`).join(" ");
  const area = `${d} L${x(puntos.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const ini = puntos[0], fin = puntos[puntos.length - 1];
  const cambio = (fin.mediana - ini.mediana) / ini.mediana;

  return (
    <div style={{ width: W }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 2 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text }}>{tipo.label}</span>
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          color: cambio < 0 ? P.bien : T.muted,
        }}>{cambio < 0 ? "↓" : "↑"}{Math.abs(Math.round(cambio * 100))}%</span>
      </div>
      <svg width={W} height={H} role="img"
        aria-label={`${tipo.label}: la mediana va de ${seg(ini.mediana)} a ${seg(fin.mediana)} segundos entre el intento 1 y el ${fin.intento}`}>
        <path d={area} fill={P.s1} opacity="0.10"/>
        <path d={d} fill="none" stroke={P.s1} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <circle cx={x(puntos.length - 1)} cy={y(fin.mediana)} r="4" fill={P.s1} stroke={T.surface} strokeWidth="2"/>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginTop: 1 }}>
        <span>{mmss(ini.mediana)}</span>
        <span>{mmss(fin.mediana)}</span>
      </div>
    </div>
  );
}

// ── 2. Mano dominante vs no dominante ────────────────────────────────────────
function Manos({ datos, P, T }) {
  const max = Math.max(...datos.map(d => Math.max(d.der?.mediana || 0, d.izq?.mediana || 0)), 1);
  const W = 196;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {datos.map(d => (
        <div key={d.label}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text, flex: 1 }}>{d.label}</span>
            {d.brecha != null && (
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: d.brecha >= 0.10 ? P.s2 : T.muted,
              }}>
                {d.brecha > 0 ? "+" : ""}{Math.round(d.brecha * 100)}%
              </span>
            )}
          </div>
          {["der", "izq"].map((m, i) => {
            const r = d[m];
            if (!r) return null;
            const w = (r.mediana / max) * W;
            return (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: i ? 0 : 2 }}>
                <span style={{ fontSize: 10, color: T.muted, width: 22, flexShrink: 0 }}>{m}</span>
                <svg width={W} height="12" style={{ flexShrink: 0 }} role="img"
                  aria-label={`${d.label} mano ${m}: mediana ${mmss(r.mediana)}`}>
                  <rect x="0" y="1" width={Math.max(w, 2)} height="10" rx="4"
                    fill={m === "der" ? P.s1 : P.s2}/>
                </svg>
                <span style={{ fontSize: 10.5, color: T.sub, fontVariantNumeric: "tabular-nums" }}>{mmss(r.mediana)}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── 3. Distribución de tiempos ───────────────────────────────────────────────
// Caja p25–p75 con la mediana y bigotes p10–p90: muestra de una vez cuánto
// tarda el ejercicio y cuánto varía entre intentos.
function Cajas({ datos, P, T }) {
  const max = Math.max(...datos.map(d => d.r?.p90 || 0), 1);
  const W = 180;
  const px = v => (v / max) * W;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {datos.filter(d => d.r).map(d => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, color: T.sub, width: 52, flexShrink: 0 }}>{d.label}</span>
          <svg width={W} height="16" style={{ flexShrink: 0 }} role="img"
            aria-label={`${d.label}: mediana ${mmss(d.r.mediana)}, mitad central entre ${mmss(d.r.q1)} y ${mmss(d.r.q3)}`}>
            <line x1={px(d.r.p10)} x2={px(d.r.p90)} y1="8" y2="8" stroke={P.s1} strokeWidth="1.5" opacity="0.45"/>
            <rect x={px(d.r.q1)} y="2" width={Math.max(px(d.r.q3) - px(d.r.q1), 3)} height="12" rx="3"
              fill={P.s1} opacity="0.22"/>
            <line x1={px(d.r.mediana)} x2={px(d.r.mediana)} y1="1" y2="15" stroke={P.s1} strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 10.5, color: T.sub, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {mmss(d.r.mediana)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 4. Cambio por becado ─────────────────────────────────────────────────────
function Mejoras({ datos, P, T }) {
  const con = datos.filter(d => d.cambio != null).sort((a, b) => a.cambio - b.cambio);
  if (!con.length) return <div style={{ fontSize: 12, color: T.muted }}>Nadie tiene suficientes intentos todavía.</div>;
  const max = Math.max(...con.map(d => Math.abs(d.cambio)), 0.1);
  const W = 150, centro = W / 2;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {con.map(d => {
        const w = (Math.abs(d.cambio) / max) * (W / 2);
        const mejoro = d.cambio < 0;
        return (
          <div key={d.becado} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              fontSize: 11, color: T.sub, width: 62, flexShrink: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{displayName(d.becado)}</span>
            <svg width={W} height="13" style={{ flexShrink: 0 }} role="img"
              aria-label={`${displayName(d.becado)}: ${mejoro ? "bajó" : "subió"} ${Math.abs(Math.round(d.cambio * 100))} por ciento`}>
              <line x1={centro} x2={centro} y1="0" y2="13" stroke={P.grilla} strokeWidth="1"/>
              <rect x={mejoro ? centro - w : centro} y="2" width={Math.max(w, 2)} height="9" rx="3"
                fill={mejoro ? P.bien : P.mal}/>
            </svg>
            <span style={{
              fontSize: 10.5, fontWeight: 700, width: 40, flexShrink: 0,
              color: mejoro ? P.bien : P.mal, fontVariantNumeric: "tabular-nums",
            }}>
              {d.cambio > 0 ? "+" : ""}{Math.round(d.cambio * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ArtroGraficos({ becados, registros, T }) {
  const P = paleta(T.bg);

  const curvas = useMemo(() => TIPOS_ACTIVOS.map(t => ({
    tipo: t, puntos: curvaAprendizaje(registros.filter(r => r.tipo === t.id)),
  })), [registros]);

  const manos = useMemo(() => TIPOS_ACTIVOS.map(t => ({
    label: t.label, ...porMano(registros.filter(r => r.tipo === t.id)),
  })), [registros]);

  const cajas = useMemo(() => TIPOS_ACTIVOS.map(t => ({
    label: t.label, r: resumen(registros.filter(r => r.tipo === t.id).map(r => r.ms)),
  })), [registros]);

  const mejoras = useMemo(
    () => mejoraPorBecado(registros, becados, TIPOS_ACTIVOS.map(t => t.id)),
    [registros, becados]);

  if (!registros.length) {
    return <div style={{ padding: "40px 16px", textAlign: "center", color: T.muted, fontSize: 13 }}>
      Todavía no hay tiempos registrados.
    </div>;
  }

  return (
    <div style={{ padding: "0 16px", position: "relative", zIndex: 1 }}>
      <Caja T={T}>
        <Titulo T={T} nota="Mediana de todos los becados en cada intento. El % compara el primer intento con el último que tiene datos suficientes.">
          Curva de aprendizaje
        </Titulo>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 16px" }}>
          {curvas.map(c => <PanelCurva key={c.tipo.id} tipo={c.tipo} puntos={c.puntos} P={P} T={T}/>)}
        </div>
      </Caja>

      <Caja T={T}>
        <Titulo T={T} nota="Mediana por mano. El % es cuánto más lenta va la izquierda.">
          Derecha vs izquierda
        </Titulo>
        <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11, color: T.sub }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: P.s1 }}/>derecha
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: P.s2 }}/>izquierda
          </span>
        </div>
        <Manos datos={manos} P={P} T={T}/>
      </Caja>

      <Caja T={T}>
        <Titulo T={T} nota="La barra es la mitad central de los intentos (p25 a p75); la línea, la mediana; los extremos, p10 y p90.">
          Distribución de tiempos
        </Titulo>
        <Cajas datos={cajas} P={P} T={T}/>
      </Caja>

      <Caja T={T}>
        <Titulo T={T} nota="Dentro de cada ejercicio, compara la mediana del primer tercio de sus intentos con la del último, y toma la mediana de esos cambios. Azul a la izquierda = mejoró.">
          Cambio por becado
        </Titulo>
        <Mejoras datos={mejoras} P={P} T={T}/>
      </Caja>

      <Caja T={T}>
        <Titulo T={T}>Tabla de referencia</Titulo>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif", tableLayout: "fixed" }}>
          <thead>
            <tr>
              {["Ejercicio", "n", "Mediana", "p25–p75", "CV"].map((h, i) => (
                <th key={h} style={{
                  textAlign: i ? "center" : "left", padding: "5px 2px", fontSize: 10,
                  fontWeight: 700, color: T.muted, textTransform: "uppercase",
                  borderBottom: `1px solid ${T.border}`,
                  width: i === 0 ? "26%" : i === 3 ? "26%" : "16%",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cajas.filter(d => d.r).map(d => (
              <tr key={d.label}>
                <td style={{ padding: "6px 2px", fontSize: 11.5, color: T.text, borderTop: `1px solid ${T.border}` }}>{d.label}</td>
                <td style={{ padding: "6px 2px", fontSize: 11.5, color: T.sub, textAlign: "center", borderTop: `1px solid ${T.border}`, fontVariantNumeric: "tabular-nums" }}>{d.r.n}</td>
                <td style={{ padding: "6px 2px", fontSize: 11.5, color: T.sub, textAlign: "center", borderTop: `1px solid ${T.border}`, fontVariantNumeric: "tabular-nums" }}>{mmss(d.r.mediana)}</td>
                <td style={{ padding: "6px 2px", fontSize: 11, color: T.muted, textAlign: "center", borderTop: `1px solid ${T.border}`, fontVariantNumeric: "tabular-nums" }}>{mmss(d.r.q1)}–{mmss(d.r.q3)}</td>
                <td style={{ padding: "6px 2px", fontSize: 11.5, color: T.sub, textAlign: "center", borderTop: `1px solid ${T.border}`, fontVariantNumeric: "tabular-nums" }}>{Math.round(d.r.cv * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 10.5, color: T.muted, marginTop: 9, lineHeight: 1.5 }}>
          Se usa mediana y rango intercuartil porque los tiempos están sesgados: un
          intento que salió mal pesa mucho más en el promedio. CV es la dispersión
          relativa — mientras más bajo, más parejo. Son datos descriptivos, no
          pruebas estadísticas.
        </div>
      </Caja>
    </div>
  );
}
