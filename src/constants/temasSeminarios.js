// Catálogo de temas de seminarios (semilla). La versión viva/editable se
// guarda en Supabase config.temas_catalogo (JSON). Este archivo es el fallback
// y define el orden/áreas base.

export const SEM_AREAS_ALL = ["Hombro","Rodilla","Mano","Cadera","Tobillo y Pie","Columna"];

export const TAG_TO_AREA = {
  "Seminario Hombro": "Hombro",
  "Seminario Rodilla": "Rodilla",
  "Seminario Mano": "Mano",
  "Seminario Cadera": "Cadera",
  "Seminario Tobillo y Pie": "Tobillo y Pie",
  "Seminario Columna": "Columna",
};

export const TEMAS_SEED = {
  "Hombro": [
    {
      "t": "Anatomía y Generalidades, Examen fisico, Biomecánica de hombro",
      "h": false
    },
    {
      "t": "Fractura clavicula tercio medio",
      "h": true
    },
    {
      "t": "Fractura clavicula lateral y medial",
      "h": true
    },
    {
      "t": "Luxacion acromioclavicular",
      "h": true
    },
    {
      "t": "Luxacion esternoclavicuar",
      "h": true
    },
    {
      "t": "Luxacion glenohumeral anterior y posterior (dx y manejo inicial)",
      "h": true
    },
    {
      "t": "Inestabilidad glenohumeral recurrente: Manejo",
      "h": true
    },
    {
      "t": "Fractura humero proximal",
      "h": true
    },
    {
      "t": "Fractura escapular",
      "h": true
    },
    {
      "t": "Artroscopia basica de hombro",
      "h": false
    },
    {
      "t": "Manguito rotador: Historia y examen fisico",
      "h": true
    },
    {
      "t": "Manguito rotador: Diagnostico imagenologico - clasificacion",
      "h": true
    },
    {
      "t": "Manguito rotador: tratamiento",
      "h": true
    },
    {
      "t": "Patologia bicipital",
      "h": false
    },
    {
      "t": "Labrum",
      "h": false
    },
    {
      "t": "Artrosis glenohumeral",
      "h": false
    },
    {
      "t": "Artrosis acromioclavicular",
      "h": false
    },
    {
      "t": "Protesis de hombro: Hemiartroplastia - Total Anatomica",
      "h": false
    },
    {
      "t": "Protesis de hombro: Reversa",
      "h": false
    },
    {
      "t": "Capsulitis adhesiva",
      "h": false
    },
    {
      "t": "Tendinitis calcica",
      "h": false
    },
    {
      "t": "Disquinesia escapular",
      "h": false
    },
    {
      "t": "Hombro del Lanzador",
      "h": true
    },
    {
      "t": "Isquemia y NAV cabeza humeral",
      "h": false
    },
    {
      "t": "Abordajes",
      "h": false
    }
  ],
  "Rodilla": [
    {
      "t": "Fractura femur diafisiario",
      "h": false
    },
    {
      "t": "Fractura femur distal",
      "h": true
    },
    {
      "t": "Fractura patela",
      "h": true
    },
    {
      "t": "Fractura platillos tibiales",
      "h": true
    },
    {
      "t": "Fractura tibia diafisiaria",
      "h": true
    },
    {
      "t": "Inestabilidad patelofemoral",
      "h": true
    },
    {
      "t": "Rotura cuatricipital",
      "h": true
    },
    {
      "t": "Rotura patelar",
      "h": false
    },
    {
      "t": "Ligamento cruzado anterior",
      "h": true
    },
    {
      "t": "Ligamento cruzado posterior",
      "h": true
    },
    {
      "t": "Ligamentos colaterales",
      "h": false
    },
    {
      "t": "Luxación de rodilla",
      "h": false
    },
    {
      "t": "Esquinas",
      "h": false
    },
    {
      "t": "Meniscos",
      "h": false
    },
    {
      "t": "Artroscopia y Lesiones osteocondrales",
      "h": false
    },
    {
      "t": "Artritis septica y derrame",
      "h": true
    },
    {
      "t": "Infección en relacion a fractura",
      "h": false
    },
    {
      "t": "Artrosis",
      "h": false
    },
    {
      "t": "Alineacion y osteotomias",
      "h": false
    },
    {
      "t": "Defecto oseo critico y no union",
      "h": false
    },
    {
      "t": "Amputaciones",
      "h": false
    },
    {
      "t": "Tendinopatias",
      "h": false
    }
  ],
  "Mano": [
    {
      "t": "Fractura EDR",
      "h": false
    },
    {
      "t": "Punta de dedo",
      "h": false
    },
    {
      "t": "Reimplantes",
      "h": false
    },
    {
      "t": "Cobertura",
      "h": false
    },
    {
      "t": "Cupula radial",
      "h": true
    },
    {
      "t": "Luxacion codo",
      "h": false
    },
    {
      "t": "Escafoides y fracturas carpo",
      "h": true
    },
    {
      "t": "Metacarpianos",
      "h": true
    },
    {
      "t": "Falanges (esguinces, lux y fx)",
      "h": false
    },
    {
      "t": "Humero diafisiario",
      "h": true
    },
    {
      "t": "Humero distal",
      "h": true
    },
    {
      "t": "Fractura de antebrazo",
      "h": false
    },
    {
      "t": "Luxofractura de Galeazzi",
      "h": true
    },
    {
      "t": "Luxofractura de Monteggia",
      "h": false
    },
    {
      "t": "Luxofracturas codo",
      "h": false
    },
    {
      "t": "Inyeccion alta presion",
      "h": false
    },
    {
      "t": "Articulacion radioulnar distal",
      "h": false
    },
    {
      "t": "Inestabilidad carpo",
      "h": false
    },
    {
      "t": "Mano gravemente lesionada",
      "h": false
    },
    {
      "t": "Sindrome compartimental",
      "h": false
    },
    {
      "t": "Tendones flexores",
      "h": true
    },
    {
      "t": "Tendones extensores",
      "h": true
    },
    {
      "t": "Carpal Boss",
      "h": false
    },
    {
      "t": "Tendinopatias (de quervain y entrecruzamiento)",
      "h": false
    },
    {
      "t": "Nervio periferico",
      "h": false
    },
    {
      "t": "Plexo braquial",
      "h": false
    },
    {
      "t": "Artrosis, Slac",
      "h": false
    },
    {
      "t": "Dupuytren",
      "h": false
    },
    {
      "t": "Kienbock",
      "h": true
    },
    {
      "t": "Tumores",
      "h": false
    },
    {
      "t": "Infecciones",
      "h": false
    },
    {
      "t": "Dedo en Gatillo",
      "h": false
    },
    {
      "t": "Transferencia tendina",
      "h": false
    }
  ],
  "Cadera": [
    {
      "t": "Fractura cadera cuello femoral",
      "h": false
    },
    {
      "t": "Fractura cadera pertrocanterica",
      "h": false
    },
    {
      "t": "Fractura subtrocanterica",
      "h": false
    },
    {
      "t": "Fractura cabeza femoral",
      "h": false
    },
    {
      "t": "Luxación cadera",
      "h": false
    },
    {
      "t": "Fractura pelvis",
      "h": false
    },
    {
      "t": "Fractura acetabulo",
      "h": true
    },
    {
      "t": "Protesis de cadera",
      "h": false
    },
    {
      "t": "Infeccion periprotesica",
      "h": false
    },
    {
      "t": "Fractura periprotesica",
      "h": false
    },
    {
      "t": "Pinzamiento de cadera",
      "h": false
    },
    {
      "t": "Necrosis avascular",
      "h": false
    },
    {
      "t": "Displasia cadera",
      "h": false
    },
    {
      "t": "Abordajes??",
      "h": false
    },
    {
      "t": "Fracturas atipicas de femur",
      "h": false
    }
  ],
  "Tobillo y Pie": [
    {
      "t": "Fractura tibia distal",
      "h": false
    },
    {
      "t": "Esguince tobillo",
      "h": false
    },
    {
      "t": "Fractura tobillo",
      "h": false
    },
    {
      "t": "Pilon tibial",
      "h": false
    },
    {
      "t": "Fractura talo",
      "h": false
    },
    {
      "t": "Fractura calcaneo",
      "h": false
    },
    {
      "t": "Fractura tarso",
      "h": false
    },
    {
      "t": "Luxofractura chopart",
      "h": false
    },
    {
      "t": "Luxofractura lisfranc",
      "h": false
    },
    {
      "t": "Fractura metatarsianos",
      "h": false
    },
    {
      "t": "Luxacion peritalar",
      "h": false
    },
    {
      "t": "Fijadores circulares",
      "h": false
    },
    {
      "t": "Sindrome compartimental",
      "h": false
    },
    {
      "t": "Artrosis",
      "h": false
    },
    {
      "t": "Artroscopia y Lesiones osteocondrales",
      "h": false
    },
    {
      "t": "Hallux valgus",
      "h": false
    },
    {
      "t": "Pie plano",
      "h": false
    },
    {
      "t": "Pie cavo",
      "h": false
    },
    {
      "t": "Charcot",
      "h": false
    },
    {
      "t": "Rotura aquiles",
      "h": false
    },
    {
      "t": "Tendinopatias",
      "h": false
    },
    {
      "t": "Atrapamientos nerviosos",
      "h": false
    }
  ],
  "Columna": [
    {
      "t": "Fracturas cervicales altas",
      "h": false
    },
    {
      "t": "Fracturas cervicales subaxiales",
      "h": false
    },
    {
      "t": "Trauma raquimedular",
      "h": false
    },
    {
      "t": "Sindrome medular incompleto",
      "h": false
    },
    {
      "t": "Anquilosis columna",
      "h": false
    }
  ]
};
