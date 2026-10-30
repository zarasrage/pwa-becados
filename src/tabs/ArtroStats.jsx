import { useMemo, useState } from "react";
import { TIPOS_ACTIVOS } from "../constants/artro.js";
import { agruparEnCiclos, llenasDe, REPS_POR_CICLO } from "../utils/artroCiclos.js";
import { displayName } from "../utils/displayName.js";

const MS_POR_CICLO = REPS_POR_CICLO * 2;   // 4 repeticiones × 2 manos

// Encabezados cortos: con los nombres completos la tabla no cabe en un
// teléfono y hay que desplazarla para ver el total, que es lo que más importa.
const ABREV = { Lineas: "Lín", Circulos: "Círc", Numeros: "Núm", Laberinto: "Lab", Tubos1: "Tub 1" };

function fmt(ms) {
  if (ms == null) return "—";
  const t = Math.max(0, Math.floor(ms));
  return `${String(Math.floor(t / 60000)).padStart(2, "0")}:${String(Math.floor((t % 60000) / 1000)).padStart(2, "0")}`;
}

// Las cuatro lecturas posibles de la tabla. `calc` recibe los registros de un
// becado en UN ejercicio. `total` combina las celdas de la fila: no se puede
// recalcular sobre todos los registros juntos, porque los ciclos emparejarían
// manos de ejercicios distintos.
const suma = cs => cs.reduce((a, v) => a + (v || 0), 0);
const minimo = cs => {
  const vs = cs.filter(v => v != null);
  return vs.length ? Math.min(...vs) : null;
};

const METRICAS = [
  { id: "ciclos",    label: "Ciclos",    vacio: "0", txt: v => String(v),
    calc: rs => agruparEnCiclos(rs).filter(c => llenasDe(c) === MS_POR_CICLO).length,
    total: suma },
  { id: "registros", label: "Registros", vacio: "0", txt: v => String(v),
    calc: rs => rs.length,
    total: suma },
  { id: "mejor",     label: "Mejor",     vacio: "—", txt: fmt,
    calc: rs => (rs.length ? Math.min(...rs.map(r => r.ms)) : null),
    total: minimo },
  // El promedio del total se saca sobre todos los registros, no promediando
  // promedios, que daría distinto si un ejercicio tiene muchos más que otro.
  { id: "promedio",  label: "Promedio",  vacio: "—", txt: fmt,
    calc: rs => (rs.length ? Math.round(rs.reduce((a, r) => a + r.ms, 0) / rs.length) : null),
    total: (cs, todos) => (todos.length ? Math.round(todos.reduce((a, r) => a + r.ms, 0) / todos.length) : null) },
];

function Tarjeta({ valor, etiqueta, color, T }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "11px 12px",
    }}>
      <div style={{
        fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 21, fontWeight: 800,
        color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums",
      }}>{valor}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: T.muted, textTransform: "uppercase", marginTop: 2 }}>
        {etiqueta}
      </div>
    </div>
  );
}

// Estadísticas de artroscopía: resumen, tabla de todos los becados y exportación.
export function ArtroStats({ becados, registros, T }) {
  const [metrica, setMetrica] = useState("ciclos");
  const [exportando, setExportando] = useState(false);
  const M = METRICAS.find(m => m.id === metrica);

  // becado → ejercicio → registros
  const porBecado = useMemo(() => {
    const m = {};
    for (const n of becados) {
      m[n] = {};
      for (const t of TIPOS_ACTIVOS) m[n][t.id] = [];
    }
    for (const r of registros) {
      if (m[r.becado]?.[r.tipo]) m[r.becado][r.tipo].push(r);
    }
    return m;
  }, [becados, registros]);

  const resumen = useMemo(() => {
    const conRegistros = becados.filter(n => registros.some(r => r.becado === n)).length;
    const totalMs = registros.reduce((a, r) => a + r.ms, 0);
    const ciclos = becados.reduce((a, n) =>
      a + TIPOS_ACTIVOS.reduce((b, t) =>
        b + agruparEnCiclos(porBecado[n][t.id]).filter(c => llenasDe(c) === MS_POR_CICLO).length, 0), 0);
    return {
      registros: registros.length,
      personas: conRegistros,
      horas: (totalMs / 3600000).toFixed(1),
      ciclos,
    };
  }, [becados, registros, porBecado]);

  // Ordenado por el valor de la métrica, de mayor a menor; los tiempos al revés
  // (menos es mejor) y los que no tienen nada, al final.
  const filas = useMemo(() => {
    const esTiempo = metrica === "mejor" || metrica === "promedio";
    return becados.map(n => {
      const celdas = TIPOS_ACTIVOS.map(t => M.calc(porBecado[n][t.id]));
      const todos = registros.filter(r => r.becado === n);
      return { nombre: n, celdas, total: M.total(celdas, todos), n: todos.length };
    }).sort((a, b) => {
      if (!a.n !== !b.n) return a.n ? -1 : 1;
      if (a.total === b.total) return a.nombre.localeCompare(b.nombre);
      return esTiempo ? a.total - b.total : b.total - a.total;
    });
  }, [becados, registros, porBecado, metrica, M]);

  async function exportar() {
    if (exportando) return;
    setExportando(true);
    try {
      const XLSX = (await import("xlsx-js-style")).default;
      const GRIS = "BFBFBF", NARANJO = "F4B183", AZUL = "8EA9DB", BLANCO = "FFFFFF";
      const borde = { style: "thin", color: { rgb: "7F7F7F" } };
      const bordes = { top: borde, bottom: borde, left: borde, right: borde };
      const celda = (v, fondo, opts = {}) => ({
        v: v === undefined || v === null ? "" : v,
        t: typeof v === "number" ? "n" : "s",
        s: {
          fill: { patternType: "solid", fgColor: { rgb: fondo } },
          font: { name: "Calibri", sz: 11, bold: !!opts.bold },
          alignment: { horizontal: opts.izq ? "left" : "center", vertical: "center" },
          border: bordes,
        },
      });

      const wb = XLSX.utils.book_new();

      // Hoja 1: una tabla por métrica, una debajo de la otra.
      const filas1 = [];
      const ancho = TIPOS_ACTIVOS.length + 2;
      for (const m of METRICAS) {
        filas1.push([celda(m.label.toUpperCase(), GRIS, { bold: true }), ...Array(ancho - 1).fill(celda("", GRIS))]);
        filas1.push([
          celda("Becado", NARANJO, { bold: true, izq: true }),
          ...TIPOS_ACTIVOS.map(t => celda(t.label, NARANJO, { bold: true })),
          celda("Total", NARANJO, { bold: true }),
        ]);
        const esTiempo = m.id === "mejor" || m.id === "promedio";
        for (const n of becados) {
          const vals = TIPOS_ACTIVOS.map(t => m.calc(porBecado[n][t.id]));
          const tot = m.total(vals, registros.filter(r => r.becado === n));
          // Los tiempos van en segundos para poder analizarlos en la planilla.
          const num = v => (v == null ? "" : esTiempo ? Math.round(v / 1000) : v);
          filas1.push([
            celda(displayName(n), BLANCO, { izq: true }),
            ...vals.map(v => celda(num(v), BLANCO)),
            celda(num(tot), AZUL, { bold: true }),
          ]);
        }
        filas1.push(Array(ancho).fill(celda("", BLANCO)));
      }
      const ws1 = XLSX.utils.aoa_to_sheet(filas1);
      ws1["!cols"] = [{ wch: 16 }, ...TIPOS_ACTIVOS.map(() => ({ wch: 11 })), { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Resumen");

      // Hoja 2: todos los registros, para analizarlos aparte.
      const filas2 = [[
        celda("Becado", NARANJO, { bold: true, izq: true }),
        ...["Ejercicio", "Mano", "Fecha", "Tiempo (s)", "Tiempo"].map(h => celda(h, NARANJO, { bold: true })),
      ]];
      const orden = [...registros].sort((a, b) =>
        a.becado === b.becado ? String(a.fecha).localeCompare(String(b.fecha)) : a.becado.localeCompare(b.becado));
      for (const r of orden) {
        filas2.push([
          celda(displayName(r.becado), BLANCO, { izq: true }),
          celda(TIPOS_ACTIVOS.find(t => t.id === r.tipo)?.label || r.tipo, BLANCO),
          celda(r.mano === "izq" ? "Izquierda" : "Derecha", BLANCO),
          celda(r.fecha, BLANCO),
          celda(Math.round(r.ms / 1000), BLANCO),
          celda(fmt(r.ms), BLANCO),
        ]);
      }
      const ws2 = XLSX.utils.aoa_to_sheet(filas2);
      ws2["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 11 }, { wch: 12 }, { wch: 11 }, { wch: 9 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Registros");

      XLSX.writeFile(wb, `Artroscopia-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div style={{ padding: "0 16px", position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Tarjeta valor={resumen.ciclos}    etiqueta="ciclos completos" color={T.accent} T={T}/>
        <Tarjeta valor={resumen.registros} etiqueta="registros"        color={T.text}   T={T}/>
        <Tarjeta valor={resumen.horas}     etiqueta="horas"            color={T.text}   T={T}/>
        <Tarjeta valor={resumen.personas}  etiqueta="con tiempos"      color={T.text}   T={T}/>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 10, background: T.surface2, borderRadius: 10, padding: 3 }}>
        {METRICAS.map(m => (
          <button key={m.id} className="press" onClick={() => setMetrica(m.id)}
            style={{
              flex: 1, height: 30, borderRadius: 8, border: "none",
              background: metrica === m.id ? T.accent : "transparent",
              fontSize: 12.5, fontWeight: metrica === m.id ? 700 : 500,
              color: metrica === m.id ? "#fff" : T.muted, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", transition: "background 0.15s",
            }}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, overflow: "hidden" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", fontFamily: "'Inter',sans-serif" }}>
          <thead>
            <tr>
              <th style={{
                background: T.surface2, width: "22%",
                textAlign: "left", padding: "8px 8px", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.04em", color: T.muted, textTransform: "uppercase",
                borderBottom: `1px solid ${T.border}`,
              }}>Becado</th>
              {TIPOS_ACTIVOS.map(t => (
                <th key={t.id} title={t.label} style={{
                  padding: "8px 2px", fontSize: 10, fontWeight: 700, color: T.muted,
                  textTransform: "uppercase", letterSpacing: "0.02em",
                  borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
                }}>{ABREV[t.id] || t.label}</th>
              ))}
              <th style={{
                padding: "8px 4px", fontSize: 10, fontWeight: 700, color: T.accent,
                textTransform: "uppercase", borderBottom: `1px solid ${T.border}`,
              }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={f.nombre}>
                <td style={{
                  padding: "7px 8px", fontSize: 12, fontWeight: 600, color: f.n ? T.text : T.muted,
                  borderTop: `1px solid ${T.border}`,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{displayName(f.nombre)}</td>
                {f.celdas.map((v, i) => (
                  <td key={i} style={{
                    padding: "7px 2px", textAlign: "center", fontSize: 11.5,
                    fontVariantNumeric: "tabular-nums",
                    color: v ? T.sub : T.muted, opacity: v ? 1 : 0.45,
                    borderTop: `1px solid ${T.border}`,
                  }}>{v ? M.txt(v) : M.vacio}</td>
                ))}
                <td style={{
                  padding: "7px 4px", textAlign: "center", fontSize: 11.5, fontWeight: 700,
                  fontVariantNumeric: "tabular-nums", color: f.n ? T.accent : T.muted,
                  borderTop: `1px solid ${T.border}`,
                }}>{f.n ? M.txt(f.total) : M.vacio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="press" onClick={exportar} disabled={exportando}
        style={{
          width: "100%", marginTop: 12, height: 42, borderRadius: 12,
          border: `1px solid ${T.border}`, background: T.surface2,
          fontSize: 13.5, fontWeight: 700, color: T.sub,
          cursor: exportando ? "wait" : "pointer", opacity: exportando ? 0.6 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "'Inter',sans-serif",
        }}>
        <span style={{ fontSize: 15 }}>⬇</span>
        {exportando ? "Generando…" : "Exportar Excel"}
      </button>
      <div style={{ fontSize: 11, color: T.muted, textAlign: "center", marginTop: 6, lineHeight: 1.45 }}>
        Dos hojas: el resumen con las cuatro métricas y todos los registros uno por uno.
      </div>
    </div>
  );
}
