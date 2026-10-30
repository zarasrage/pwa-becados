// Estadística descriptiva de los tiempos de artroscopía.
//
// Se usa mediana y rango intercuartil en vez de media y desviación porque los
// tiempos están sesgados a la derecha: un intento que salió mal pesa mucho más
// en la media que en la mediana. Nada de esto es una prueba de hipótesis.

import { ordenCronologico } from "./artroCiclos.js";

export const percentil = (orden, p) => {
  if (!orden.length) return null;
  const i = (orden.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? orden[lo] : orden[lo] + (orden[hi] - orden[lo]) * (i - lo);
};

export function resumen(valores) {
  const v = [...valores].sort((a, b) => a - b);
  if (!v.length) return null;
  const media = v.reduce((a, x) => a + x, 0) / v.length;
  const varianza = v.reduce((a, x) => a + (x - media) ** 2, 0) / v.length;
  return {
    n: v.length,
    min: v[0],
    max: v[v.length - 1],
    q1: percentil(v, 0.25),
    mediana: percentil(v, 0.5),
    q3: percentil(v, 0.75),
    p10: percentil(v, 0.10),
    p90: percentil(v, 0.90),
    media,
    // Coeficiente de variación: dispersión relativa, comparable entre
    // ejercicios que tienen duraciones muy distintas.
    cv: media ? Math.sqrt(varianza) / media : null,
  };
}

// Número de intento de cada registro dentro de su (becado, ejercicio, mano).
// Es el eje de la curva de aprendizaje: 1 = primera vez que lo hizo.
export function numeroDeIntento(registros) {
  const porCelda = {};
  for (const r of registros) {
    (porCelda[`${r.becado}|${r.tipo}|${r.mano}`] ||= []).push(r);
  }
  const idx = new Map();
  for (const lista of Object.values(porCelda)) {
    ordenCronologico(lista).forEach((r, i) => idx.set(r.id, i + 1));
  }
  return idx;
}

// Mediana del tiempo en cada número de intento, juntando a todos los becados.
// Se corta donde queden pocos datos: con 3 o 4 observaciones la mediana salta
// y el gráfico sugiere subidas y bajadas que no existen.
export function curvaAprendizaje(registros, { minN = 8, maxIntentos = 12 } = {}) {
  const idx = numeroDeIntento(registros);
  const puntos = [];
  for (let k = 1; k <= maxIntentos; k++) {
    const v = registros.filter(r => idx.get(r.id) === k).map(r => r.ms);
    if (v.length < minN) break;
    puntos.push({ intento: k, mediana: percentil([...v].sort((a, b) => a - b), 0.5), n: v.length });
  }
  return puntos;
}

// Mediana por mano y cuánto más lenta es la izquierda, en porcentaje.
export function porMano(registros) {
  const der = registros.filter(r => r.mano !== "izq").map(r => r.ms);
  const izq = registros.filter(r => r.mano === "izq").map(r => r.ms);
  const rd = resumen(der), ri = resumen(izq);
  return {
    der: rd, izq: ri,
    brecha: rd && ri && rd.mediana ? (ri.mediana - rd.mediana) / rd.mediana : null,
  };
}

// Cambio del primer al último tercio de los intentos, calculado DENTRO de cada
// ejercicio y recién después combinado.
//
// Hacerlo sobre todos los registros juntos da resultados al revés: quien
// empezó por Círculos (medio minuto) y terminó haciendo Tubos 1 (dos minutos y
// medio) aparece "empeorando" un 256% cuando en realidad mejoró en los dos.
// Lo que cambió fue el ejercicio, no la persona.
//
// Se usan tercios y no el primer y último registro porque un solo tiempo es
// demasiado ruidoso; negativo = mejoró.
export function mejoraPorBecado(registros, becados, tipos, { minN = 6 } = {}) {
  const ids = tipos?.length ? tipos : [...new Set(registros.map(r => r.tipo))];
  return becados.map(becado => {
    const suyos = registros.filter(r => r.becado === becado);
    const cambios = [];
    for (const t of ids) {
      const e = ordenCronologico(suyos.filter(r => r.tipo === t));
      if (e.length < minN) continue;
      const corte = Math.floor(e.length / 3);
      const ini = percentil(e.slice(0, corte).map(r => r.ms).sort((a, b) => a - b), 0.5);
      const fin = percentil(e.slice(-corte).map(r => r.ms).sort((a, b) => a - b), 0.5);
      if (ini) cambios.push((fin - ini) / ini);
    }
    return {
      becado,
      n: suyos.length,
      ejercicios: cambios.length,
      // La mediana de los cambios por ejercicio: un ejercicio con muchos más
      // intentos no debería arrastrar el resultado de los demás.
      cambio: cambios.length ? percentil([...cambios].sort((a, b) => a - b), 0.5) : null,
    };
  });
}
