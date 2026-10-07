// Agrupación de los tiempos de artroscopía en repeticiones y ciclos.
//
//   repetición = una vuelta con la izquierda + una con la derecha (2 registros)
//   ciclo      = 4 repeticiones (8 registros: 4 izq + 4 der)
//
// Los registros no traen número de repetición: se deduce de la secuencia. Cada
// mano lleva su propia fila y se emparejan por posición, así que si alguien
// lleva más de una mano que de la otra, la celda que falta queda vacía.

export const REPS_POR_CICLO = 4;

// Posición de un registro dentro del día. Los importados llevan el correlativo
// de la planilla en el id; los que graba la app traen `ts` (y los más antiguos,
// la hora en el propio id). Los importados van primero porque son históricos.
function seq(r) {
  if (typeof r.ts === "number") return r.ts;
  const imp = /^imp(2?)-(\d+)$/.exec(r.id || "");
  if (imp) return (imp[1] ? 2e6 : 1e6) + Number(imp[2]);
  const n = parseInt(r.id, 10);
  return Number.isFinite(n) ? n : 0;
}

// Del más antiguo al más nuevo.
export function ordenCronologico(regs) {
  return [...regs].sort((a, b) =>
    a.fecha === b.fecha ? seq(a) - seq(b) : (a.fecha < b.fecha ? -1 : 1)
  );
}

// Devuelve [{ n, reps: [{ n, izq, der }] }] con el ciclo 1 primero.
export function agruparEnCiclos(regs) {
  const orden = ordenCronologico(regs);
  const izq = orden.filter(r => r.mano === "izq");
  const der = orden.filter(r => r.mano !== "izq");

  const reps = [];
  for (let i = 0; i < Math.max(izq.length, der.length); i++) {
    // n es el número dentro del ciclo (1..4), como en la tabla de papel.
    reps.push({ n: (i % REPS_POR_CICLO) + 1, izq: izq[i] || null, der: der[i] || null });
  }

  const ciclos = [];
  for (let i = 0; i < reps.length; i += REPS_POR_CICLO) {
    ciclos.push({
      n: Math.floor(i / REPS_POR_CICLO) + 1,
      reps: reps.slice(i, i + REPS_POR_CICLO),
    });
  }
  return ciclos;
}

// Qué toca ahora: la primera celda vacía recorriendo en orden, o la primera de
// una repetición nueva si está todo completo.
export function siguiente(ciclos) {
  for (const c of ciclos) {
    for (const r of c.reps) {
      if (!r.izq) return { ciclo: c.n, rep: r.n, mano: "izq" };
      if (!r.der) return { ciclo: c.n, rep: r.n, mano: "der" };
    }
  }
  const hechas = ciclos.reduce((n, c) => n + c.reps.length, 0);
  return {
    ciclo: Math.floor(hechas / REPS_POR_CICLO) + 1,
    rep: (hechas % REPS_POR_CICLO) + 1,
    mano: "izq",
  };
}

// Cuántos registros tiene un ciclo de los 8 que le caben.
export function llenasDe(ciclo) {
  return ciclo.reps.reduce((n, r) => n + (r.izq ? 1 : 0) + (r.der ? 1 : 0), 0);
}
