export const CURSO_CPQ = [
  {
    fecha: "2026-07-07",
    hora: "17:30",
    numero: 1,
    titulo: "Fisiopatología de la Cicatrización, Manejo de Heridas y Terapia de Presión Negativa",
    doctor: "Dr. Diego Valenzuela",
    sala: "Sala 2 Jofré",
  },
  {
    fecha: "2026-07-09",
    hora: "17:00",
    numero: 2,
    titulo: "Técnicas y Materiales de Sutura",
    doctor: "Dra. Leider Aguirre / Dr. Matías Nova",
    sala: "Sala 1 Jofré",
  },
  {
    fecha: "2026-07-10",
    hora: null,
    numero: 3,
    titulo: "Fundamentos de la Escalera Reconstructiva",
    doctor: "Dr. Nicolás Pereira",
    sala: null,
  },
  {
    fecha: "2026-07-15",
    hora: "07:30",
    numero: 4,
    titulo: "Colgajos Cutáneos Locales y Regionales para Extremidades Inferiores",
    doctor: "Dra. Vanessa Oñate",
    sala: null,
  },
  {
    fecha: "2026-07-21",
    hora: "17:30",
    numero: 5,
    titulo: "Salvamento de Extremidades: El Binomio Ortoplástico en Trauma",
    doctor: "Dr. Juan Pablo Camacho",
    sala: "Sala 1 Jofré",
  },
  {
    fecha: "2026-07-24",
    hora: "07:30",
    numero: 6,
    titulo: "Microcirugía para la Reconstrucción de Extremidades Inferiores",
    doctor: "Dr. Leonardo Parada",
    sala: "Sala 2 Jofré",
  },
];

export const CURSO_CPQ_BY_DATE = Object.fromEntries(CURSO_CPQ.map(c => [c.fecha, c]));

export const UNAB_BECADOS = new Set([
  "Gonzalez","Beulieau","Valencia","Albert","Miño","Diaz",
  "Uribe","Teuber","Rojas","Miranda","Chahin","Navia","Carcamo","Alvarez","Marre",
]);
