// Ejercicios del entrenador de artroscopía. El orden es el orden en que se
// deben hacer. Los bloqueados son de otra rotación y todavía no les tocan.
export const TIPOS = [
  // El orden es el orden en que se deben hacer: de izquierda a derecha.
  { id: "Lineas",    label: "Líneas",    img: "/artro/lineas.webp" },
  { id: "Circulos",  label: "Círculos",  img: "/artro/circulos.webp" },
  { id: "Numeros",   label: "Números",   img: "/artro/numeros.webp" },
  { id: "Laberinto", label: "Laberinto", img: "/artro/laberinto.webp" },
  // Tubos 1 son los cilindros verticales; Tubos 2, los horizontales.
  { id: "Tubos1",    label: "Tubos 1",   img: "/artro/tubos-1.webp" },
  // Bloqueados: todavía no les toca a estos becados.
  { id: "Tubos2",    label: "Tubos 2",   img: "/artro/tubos-2.webp", bloqueado: true },
  { id: "Manguito",  label: "Manguito",  img: "/artro/manguito.webp", bloqueado: true },
  { id: "Meniscos",  label: "Meniscos",  img: "/artro/meniscos.webp", bloqueado: true },
];

export const TIPOS_ACTIVOS = TIPOS.filter(t => !t.bloqueado);
export const LABEL_TIPO = Object.fromEntries(TIPOS.map(t => [t.id, t.label]));
