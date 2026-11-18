// Grilla del 62° Congreso SCHOT — Hospital del Trabajador, Viña del Mar.
// Extraída del PDF oficial: 82 presentaciones. Las filas son bloques de 15
// minutos, como en el PDF; `hora` es el inicio exacto de cada charla.

// Colores de especialidad, medidos de la leyenda del propio PDF.
export const SCHOT_ESP = {
  "Rodilla": "#2f6fde",
  "Mano": "#d6407f",
  "Pie y tobillo": "#1f9d55",
  "Columna": "#7b4fd6",
  "Cadera y pelvis": "#e07a1f",
  "Hombro y codo": "#c9a100",
  "Reconstrucción": "#0f8c8c"
};

export const SCHOT_HOTEL = { Sheraton: "Av. Marina 15", Enjoy: "Av. San Martín 199" };

export const SCHOT_DIAS = [
  {
    "fecha": "2026-11-18",
    "label": "Miércoles 18",
    "columnas": [
      {
        "sala": "Bombal AB",
        "hotel": "Sheraton"
      }
    ],
    "filas": [
      "08:30",
      "11:30",
      "11:45",
      "16:45"
    ],
    "charlas": [
      {
        "id": "1118-0840-BombalAB",
        "hora": "08:40",
        "slot": "08:30",
        "sala": "Bombal AB",
        "hotel": "Sheraton",
        "presentador": "C. Córdova",
        "titulo": "Fx expuesta en urgencia",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1118-1135-BombalAB",
        "hora": "11:35",
        "slot": "11:30",
        "sala": "Bombal AB",
        "hotel": "Sheraton",
        "presentador": "A. Pérez",
        "titulo": "Pérdida de sustancia EESS",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1118-1145-BombalAB",
        "hora": "11:45",
        "slot": "11:45",
        "sala": "Bombal AB",
        "hotel": "Sheraton",
        "presentador": "T. Basauri",
        "titulo": "Mano gravemente lesionada",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1118-1655-BombalAB",
        "hora": "16:55",
        "slot": "16:45",
        "sala": "Bombal AB",
        "hotel": "Sheraton",
        "presentador": "P. Vergara",
        "titulo": "Inyección a alta presión",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      }
    ]
  },
  {
    "fecha": "2026-11-19",
    "label": "Jueves 19",
    "columnas": [
      {
        "sala": "Bombal A",
        "hotel": "Sheraton"
      },
      {
        "sala": "Bombal B",
        "hotel": "Sheraton"
      },
      {
        "sala": "Vergara A",
        "hotel": "Sheraton"
      },
      {
        "sala": "Vergara C",
        "hotel": "Sheraton"
      },
      {
        "sala": "Pacífico",
        "hotel": "Sheraton"
      },
      {
        "sala": "Caracola",
        "hotel": "Enjoy"
      },
      {
        "sala": "Esmeralda",
        "hotel": "Enjoy"
      },
      {
        "sala": "Estrella 2",
        "hotel": "Enjoy"
      },
      {
        "sala": "OVO",
        "hotel": "Enjoy"
      }
    ],
    "filas": [
      "08:15",
      "08:30",
      "08:45",
      "09:00",
      "09:15",
      "09:30",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "12:00",
      "12:15",
      "15:00",
      "15:45",
      "17:00",
      "17:15",
      "17:30",
      "17:45",
      "18:00",
      "18:15"
    ],
    "charlas": [
      {
        "id": "1119-0818-Caracola",
        "hora": "08:18",
        "slot": "08:15",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "I. Cirillo",
        "titulo": "Fx facetarias cervicales",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1119-0822-Pacifico",
        "hora": "08:22",
        "slot": "08:15",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "D. Valiente",
        "titulo": "Panel trauma (08:22 y 08:52)",
        "panel": true,
        "becado": false,
        "esp": null
      },
      {
        "id": "1119-0828-BombalA",
        "hora": "08:28",
        "slot": "08:15",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "C. Parada",
        "titulo": "Clavo de fíbula",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-0842-Estrella2",
        "hora": "08:42",
        "slot": "08:30",
        "sala": "Estrella 2",
        "hotel": "Enjoy",
        "presentador": "R. Olivieri",
        "titulo": "Fellowship rodilla",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1119-0852-Caracola",
        "hora": "08:52",
        "slot": "08:45",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "E. Valenzuela",
        "titulo": "Fx B3 columna anquilótica",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1119-0857-Caracola",
        "hora": "08:57",
        "slot": "08:45",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "J.I. Gengler",
        "titulo": "Fx B2: percutánea vs artrodesis",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1119-0901-VergaraA",
        "hora": "09:01",
        "slot": "09:00",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "A. Pérez",
        "titulo": "Re-rupturas flexores",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1119-0902-Caracola",
        "hora": "09:02",
        "slot": "09:00",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "E. Valenzuela",
        "titulo": "Inestabilidad lumbosacra",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1119-0912-Pacifico",
        "hora": "09:12",
        "slot": "09:00",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "N. Franulic",
        "titulo": "Fx fémur distal",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1119-0915-VergaraC",
        "hora": "09:15",
        "slot": "09:15",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "Ó. Escobar",
        "titulo": "OTS tras transporte óseo",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-0917-VergaraA",
        "hora": "09:17",
        "slot": "09:15",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "J.M. Breyer",
        "titulo": "Síndrome de Volkmann",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1119-0917-Pacifico",
        "hora": "09:17",
        "slot": "09:15",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "N. Franulic",
        "titulo": "Lesión arterial platillos",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1119-0934-Caracola",
        "hora": "09:34",
        "slot": "09:30",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "S. Chahin",
        "titulo": "Tethering en escoliosis",
        "panel": false,
        "becado": true,
        "esp": null
      },
      {
        "id": "1119-1030-Esmeralda",
        "hora": "10:30",
        "slot": "10:30",
        "sala": "Esmeralda",
        "hotel": "Enjoy",
        "presentador": "J.M. Rojas",
        "titulo": "Fx acetabulares: imágenes",
        "panel": false,
        "becado": false,
        "esp": "Cadera y pelvis"
      },
      {
        "id": "1119-1030-Estrella2",
        "hora": "10:30",
        "slot": "10:30",
        "sala": "Estrella 2",
        "hotel": "Enjoy",
        "presentador": "A. Pérez",
        "titulo": "Fellowship mano",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1119-1040-Esmeralda",
        "hora": "10:40",
        "slot": "10:30",
        "sala": "Esmeralda",
        "hotel": "Enjoy",
        "presentador": "A. Munjin",
        "titulo": "Fx acetabulares: abordajes",
        "panel": false,
        "becado": false,
        "esp": "Cadera y pelvis"
      },
      {
        "id": "1119-1045-VergaraC",
        "hora": "10:45",
        "slot": "10:45",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "J. Mena",
        "titulo": "Artrodesis TTC aloinjerto",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1050-Esmeralda",
        "hora": "10:50",
        "slot": "10:45",
        "sala": "Esmeralda",
        "hotel": "Enjoy",
        "presentador": "C. Rojas",
        "titulo": "Reducción acetabular",
        "panel": false,
        "becado": false,
        "esp": "Cadera y pelvis"
      },
      {
        "id": "1119-1100-VergaraC",
        "hora": "11:00",
        "slot": "11:00",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "G. Bastías",
        "titulo": "Artrodesis tibiocalcánea",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1102-VergaraA",
        "hora": "11:02",
        "slot": "11:00",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "P. Vergara",
        "titulo": "Colgajo ALT: tips",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1119-1115-VergaraC",
        "hora": "11:15",
        "slot": "11:15",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "L. Pérez",
        "titulo": "Modelos 3D retro/mediopié",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1130-VergaraC",
        "hora": "11:30",
        "slot": "11:30",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "R. Melo",
        "titulo": "OMC calcáneo",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1206-BombalA",
        "hora": "12:06",
        "slot": "12:00",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "Ó. Escobar",
        "titulo": "MIS hallux valgus atletas",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1221-BombalA",
        "hora": "12:21",
        "slot": "12:15",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "Ó. Escobar",
        "titulo": "Artrorrisis subtalar WBCT",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1500-BombalA",
        "hora": "15:00",
        "slot": "15:00",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "G. Bastías",
        "titulo": "Prótesis Zimmer 5 años",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1545-VergaraC",
        "hora": "15:45",
        "slot": "15:45",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "P. Fuentes",
        "titulo": "Complicaciones oncológico",
        "panel": false,
        "becado": false,
        "esp": "Reconstrucción"
      },
      {
        "id": "1119-1700-VergaraC",
        "hora": "17:00",
        "slot": "17:00",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "L.F. Selman",
        "titulo": "IA en deformidades",
        "panel": false,
        "becado": false,
        "esp": "Reconstrucción"
      },
      {
        "id": "1119-1700-Caracola",
        "hora": "17:00",
        "slot": "17:00",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "J.G. Fleiderman",
        "titulo": "Termodiscoplastía",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1119-1714-Estrella2",
        "hora": "17:14",
        "slot": "17:00",
        "sala": "Estrella 2",
        "hotel": "Enjoy",
        "presentador": "N. Cuchacovich",
        "titulo": "Fellowship TyP",
        "panel": false,
        "becado": false,
        "esp": "Reconstrucción"
      },
      {
        "id": "1119-1720-Pacifico",
        "hora": "17:20",
        "slot": "17:15",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "P. Innocenti",
        "titulo": "Panel osteotomías (17:20/17:47)",
        "panel": true,
        "becado": false,
        "esp": null
      },
      {
        "id": "1119-1730-VergaraA",
        "hora": "17:30",
        "slot": "17:30",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "C. Córdova",
        "titulo": "Caso clínico 1",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1119-1735-OVO",
        "hora": "17:35",
        "slot": "17:30",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "J.C. Uribe",
        "titulo": "OCD juvenil rodilla",
        "panel": false,
        "becado": true,
        "esp": null
      },
      {
        "id": "1119-1737-Pacifico",
        "hora": "17:37",
        "slot": "17:30",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "J. Ugarte",
        "titulo": "Kissing lesion: osteotomía",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1119-1742-Estrella2",
        "hora": "17:42",
        "slot": "17:30",
        "sala": "Estrella 2",
        "hotel": "Enjoy",
        "presentador": "R. Melo",
        "titulo": "Fellowship TyP UDP",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1745-VergaraC",
        "hora": "17:45",
        "slot": "17:45",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "F. Bustos",
        "titulo": "Malunión de fémur",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1119-1746-BombalB",
        "hora": "17:46",
        "slot": "17:45",
        "sala": "Bombal B",
        "hotel": "Sheraton",
        "presentador": "D. Valiente",
        "titulo": "ARTRO IA",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1119-1756-BombalB",
        "hora": "17:56",
        "slot": "17:45",
        "sala": "Bombal B",
        "hotel": "Sheraton",
        "presentador": "J.M. Breyer",
        "titulo": "Mesa redonda IA",
        "panel": true,
        "becado": false,
        "esp": null
      },
      {
        "id": "1119-1800-VergaraC",
        "hora": "18:00",
        "slot": "18:00",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "C. Parada",
        "titulo": "Malunión de tibia",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1119-1817-BombalA",
        "hora": "18:17",
        "slot": "18:15",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "B. Miranda",
        "titulo": "Platillo tibial zona dadora",
        "panel": false,
        "becado": true,
        "esp": null
      }
    ]
  },
  {
    "fecha": "2026-11-20",
    "label": "Viernes 20",
    "columnas": [
      {
        "sala": "Bombal A",
        "hotel": "Sheraton"
      },
      {
        "sala": "Vergara A",
        "hotel": "Sheraton"
      },
      {
        "sala": "Vergara C",
        "hotel": "Sheraton"
      },
      {
        "sala": "Pacífico",
        "hotel": "Sheraton"
      },
      {
        "sala": "Sausalito",
        "hotel": "Sheraton"
      },
      {
        "sala": "Caracola",
        "hotel": "Enjoy"
      },
      {
        "sala": "Esmeralda",
        "hotel": "Enjoy"
      },
      {
        "sala": "OVO",
        "hotel": "Enjoy"
      }
    ],
    "filas": [
      "08:00",
      "08:15",
      "08:30",
      "08:45",
      "09:00",
      "09:15",
      "09:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "14:45",
      "15:00",
      "15:15",
      "15:30",
      "15:45",
      "16:15",
      "17:00",
      "17:30"
    ],
    "charlas": [
      {
        "id": "1120-0810-Caracola",
        "hora": "08:10",
        "slot": "08:00",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "M. Gimbernat",
        "titulo": "Coccigodinia",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-0817-BombalA",
        "hora": "08:17",
        "slot": "08:15",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "T. Pineda",
        "titulo": "Video: LCA recto anterior",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1120-0830-Sausalito",
        "hora": "08:30",
        "slot": "08:30",
        "sala": "Sausalito",
        "hotel": "Sheraton",
        "presentador": "L.F. Selman",
        "titulo": "Alargamiento sobre clavo",
        "panel": false,
        "becado": false,
        "esp": "Reconstrucción"
      },
      {
        "id": "1120-0835-OVO",
        "hora": "08:35",
        "slot": "08:30",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "V. Herrera",
        "titulo": "Tutor externo transitorio",
        "panel": false,
        "becado": false,
        "esp": "Hombro y codo"
      },
      {
        "id": "1120-0843-Esmeralda",
        "hora": "08:43",
        "slot": "08:30",
        "sala": "Esmeralda",
        "hotel": "Enjoy",
        "presentador": "S. Sulzer",
        "titulo": "Casos inestabilidad hombro",
        "panel": false,
        "becado": false,
        "esp": "Hombro y codo"
      },
      {
        "id": "1120-0852-BombalA",
        "hora": "08:52",
        "slot": "08:45",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "T. Pineda",
        "titulo": "Pendiente tibial y LCA",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1120-0855-Pacifico",
        "hora": "08:55",
        "slot": "08:45",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "N. Cuchacovich",
        "titulo": "Fijación externa pie cavo",
        "panel": false,
        "becado": false,
        "esp": "Reconstrucción"
      },
      {
        "id": "1120-0902-BombalA",
        "hora": "09:02",
        "slot": "09:00",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "T. Pineda",
        "titulo": "Fuerza cuádriceps post LCA",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1120-0907-BombalA",
        "hora": "09:07",
        "slot": "09:00",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "R. Rojas",
        "titulo": "Fallo LCA: HTH vs STG",
        "panel": false,
        "becado": true,
        "esp": null
      },
      {
        "id": "1120-0915-OVO",
        "hora": "09:15",
        "slot": "09:15",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "P. Vergara",
        "titulo": "Caso: fx expuesta húmero",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1120-0925-Pacifico",
        "hora": "09:25",
        "slot": "09:15",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "Ó. Escobar",
        "titulo": "Botón-tape Lisfranc",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-0930-OVO",
        "hora": "09:30",
        "slot": "09:30",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "C. Córdova",
        "titulo": "No unión fx expuesta",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1120-0935-Pacifico",
        "hora": "09:35",
        "slot": "09:30",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "J. Mena",
        "titulo": "Lisfranc tardío vs agudo",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-1045-Sausalito",
        "hora": "10:45",
        "slot": "10:45",
        "sala": "Sausalito",
        "hotel": "Sheraton",
        "presentador": "J.P. Bergeret",
        "titulo": "Transporte fallido: amputar?",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-1107-Pacifico",
        "hora": "11:07",
        "slot": "11:00",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "R. Melo",
        "titulo": "Alargamiento columna lateral",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-1115-Sausalito",
        "hora": "11:15",
        "slot": "11:15",
        "sala": "Sausalito",
        "hotel": "Sheraton",
        "presentador": "P. Fuentes",
        "titulo": "Osteointegración Chile",
        "panel": false,
        "becado": false,
        "esp": "Reconstrucción"
      },
      {
        "id": "1120-1115-Caracola",
        "hora": "11:15",
        "slot": "11:15",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "I. Cirillo",
        "titulo": "Crossfire: ACDF",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-1127-VergaraA",
        "hora": "11:27",
        "slot": "11:15",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "A. Telias",
        "titulo": "Luxación traumática cadera",
        "panel": false,
        "becado": false,
        "esp": "Cadera y pelvis"
      },
      {
        "id": "1120-1135-OVO",
        "hora": "11:35",
        "slot": "11:30",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "C. Rojas",
        "titulo": "Caso: fx de pelvis",
        "panel": false,
        "becado": false,
        "esp": "Cadera y pelvis"
      },
      {
        "id": "1120-1137-VergaraA",
        "hora": "11:37",
        "slot": "11:30",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "J. Rojas",
        "titulo": "Fijación lumbopélvica",
        "panel": false,
        "becado": false,
        "esp": "Cadera y pelvis"
      },
      {
        "id": "1120-1445-OVO",
        "hora": "14:45",
        "slot": "14:45",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "J.J. Zamorano",
        "titulo": "Caso: fx osteoporótica",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-1450-OVO",
        "hora": "14:50",
        "slot": "14:45",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "I. Farías",
        "titulo": "Fx vertebral osteoporótica",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-1505-BombalA",
        "hora": "15:05",
        "slot": "15:00",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "T. Guarda",
        "titulo": "Aloinjerto LCA multiligam.",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1120-1525-VergaraC",
        "hora": "15:25",
        "slot": "15:15",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "L. Vergara",
        "titulo": "Validación 6- Item CTS",
        "panel": false,
        "becado": false,
        "esp": "Mano"
      },
      {
        "id": "1120-1530-Sausalito",
        "hora": "15:30",
        "slot": "15:30",
        "sala": "Sausalito",
        "hotel": "Sheraton",
        "presentador": "M. Rivera",
        "titulo": "Artrodesis de rodilla",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-1530-OVO",
        "hora": "15:30",
        "slot": "15:30",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "I. Cirillo",
        "titulo": "Caso: fx cervical F3",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-1535-OVO",
        "hora": "15:35",
        "slot": "15:30",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "J.J. Zamorano",
        "titulo": "Caso: fx cervical C",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-1540-OVO",
        "hora": "15:40",
        "slot": "15:30",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "I. Cirillo",
        "titulo": "Fx facetarias cervicales",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-1552-VergaraC",
        "hora": "15:52",
        "slot": "15:45",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "C. Parada",
        "titulo": "Hexápodo dos niveles",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-1620-Caracola",
        "hora": "16:20",
        "slot": "16:15",
        "sala": "Caracola",
        "hotel": "Enjoy",
        "presentador": "J.I. Gengler",
        "titulo": "Bloqueo ganglio impar",
        "panel": false,
        "becado": false,
        "esp": "Columna"
      },
      {
        "id": "1120-1700-VergaraC",
        "hora": "17:00",
        "slot": "17:00",
        "sala": "Vergara C",
        "hotel": "Sheraton",
        "presentador": "R. Rojas",
        "titulo": "Infección endoprótesis ped.",
        "panel": false,
        "becado": true,
        "esp": null
      },
      {
        "id": "1120-1700-Esmeralda",
        "hora": "17:00",
        "slot": "17:00",
        "sala": "Esmeralda",
        "hotel": "Enjoy",
        "presentador": "R. Sanhueza",
        "titulo": "Fx diáfisis humeral",
        "panel": false,
        "becado": false,
        "esp": "Hombro y codo"
      },
      {
        "id": "1120-1705-OVO",
        "hora": "17:05",
        "slot": "17:00",
        "sala": "OVO",
        "hotel": "Enjoy",
        "presentador": "Ó. Escobar",
        "titulo": "Estabilización TTC",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-1710-Pacifico",
        "hora": "17:10",
        "slot": "17:00",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "L. Pérez",
        "titulo": "Impresión 3D y PSI",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      },
      {
        "id": "1120-1730-BombalA",
        "hora": "17:30",
        "slot": "17:30",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "R. Olivieri",
        "titulo": "Luxación recidivante patela",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1120-1735-BombalA",
        "hora": "17:35",
        "slot": "17:30",
        "sala": "Bombal A",
        "hotel": "Sheraton",
        "presentador": "T. Pineda",
        "titulo": "Panel patelofemoral",
        "panel": true,
        "becado": false,
        "esp": null
      },
      {
        "id": "1120-1735-Pacifico",
        "hora": "17:35",
        "slot": "17:30",
        "sala": "Pacífico",
        "hotel": "Sheraton",
        "presentador": "L. Pérez",
        "titulo": "Fíbula endomedular en pilón",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      }
    ]
  },
  {
    "fecha": "2026-11-21",
    "label": "Sábado 21",
    "columnas": [
      {
        "sala": "Vergara A",
        "hotel": "Sheraton"
      }
    ],
    "filas": [
      "09:00",
      "09:30"
    ],
    "charlas": [
      {
        "id": "1121-0900-VergaraA",
        "hora": "09:00",
        "slot": "09:00",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "T. Pineda",
        "titulo": "Premio: pendiente tibial LCA",
        "panel": false,
        "becado": false,
        "esp": "Rodilla"
      },
      {
        "id": "1121-0940-VergaraA",
        "hora": "09:40",
        "slot": "09:30",
        "sala": "Vergara A",
        "hotel": "Sheraton",
        "presentador": "G. Bastías",
        "titulo": "Premio: MTF1 nanoscopio",
        "panel": false,
        "becado": false,
        "esp": "Pie y tobillo"
      }
    ]
  }
];

// El congreso va del 18 al 21. El interruptor se habilita un día antes para
// poder dejarlo listo la noche previa, y se apaga solo el domingo 22.
export const SCHOT_DESDE = "2026-11-18";
export const SCHOT_HASTA = "2026-11-21";
const SCHOT_VISIBLE_DESDE = "2026-11-17";

export function enFechasSchot(iso) {
  return iso >= SCHOT_VISIBLE_DESDE && iso <= SCHOT_HASTA;
}
