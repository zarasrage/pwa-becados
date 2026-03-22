import { ROT } from "../constants/rotations.js";

export const DEMO_BECADO = "— Demo —";
export const DEMO_MAP_NAMES = ["García","Muñoz","López","Rojas","Díaz","Torres","Soto","Herrera","Vargas","Núñez","Reyes","Mora"];
export const DEMO_ROTATIONS = ["H","M","CyP","R","TyP","Col","H","M","CyP","R","TyP","Col","","",""];
export const DEMO_ACTIVITIES = {
  H:   [["07:30","Pase de visita Hombro"],["08:30","Pabellón Artroscopía"],["12:00","Almuerzo"],["14:00","Policlínico Hombro"],["16:30","Revisión casos"]],
  M:   [["07:30","Pase de visita Mano"],["09:00","Pabellón Mano"],["12:00","Almuerzo"],["14:00","Policlínico Mano"],["16:00","Revisión radiológica"]],
  CyP: [["07:30","Pase de visita Cadera"],["08:00","Pabellón Cadera/Pelvis"],["12:30","Almuerzo"],["14:00","Policlínico Cadera"],["17:00","Fin de jornada"]],
  R:   [["07:30","Pase de visita Rodilla"],["08:30","Pabellón Artroscopía Rodilla"],["12:00","Almuerzo"],["14:00","Policlínico Rodilla"],["16:30","Lectura bibliográfica"]],
  TyP: [["07:30","Pase de visita Tobillo"],["09:00","Pabellón Tobillo y Pie"],["12:00","Almuerzo"],["14:00","Policlínico TyP"],["16:30","Fin de jornada"]],
  Col: [["07:30","Pase de visita Columna"],["08:00","Pabellón Columna"],["12:00","Almuerzo"],["14:00","Policlínico Columna"],["16:00","Revisión casos clínicos"]],
  "": [],
};

// Demo data generators for the map
export function demoSummary(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  const dow = new Date(y,m-1,d).getDay();
  if (dow === 0 || dow === 6) return { ok:true, date:dateStr, groups:{"":[...DEMO_MAP_NAMES]} };
  const groups = {};
  DEMO_MAP_NAMES.forEach((name, i) => {
    const rotCode = DEMO_ROTATIONS[((d-1) + i * 2) % DEMO_ROTATIONS.length] || "";
    if (!groups[rotCode]) groups[rotCode] = [];
    groups[rotCode].push(name);
  });
  return { ok:true, date:dateStr, groups };
}

export function demoMonthly(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const TURNO_PATTERNS = [
    [null,"P",null,"A","D",null,"N"],
    [null,null,"D",null,"N",null,"P"],
    ["A",null,"N",null,null,"P",null],
    [null,"D",null,"P",null,"A","N"],
  ];
  const entries = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dow = new Date(y, m-1, d).getDay();
    if (dow === 0 || dow === 6) continue;
    DEMO_MAP_NAMES.forEach((name, ni) => {
      const pat = TURNO_PATTERNS[ni % TURNO_PATTERNS.length];
      const turno = pat[(d-1) % pat.length];
      if (turno === "P") entries.push({ date:iso, name, type:"P" });
      if (turno === "D") entries.push({ date:iso, name, type:"D" });
      if (turno === "N") entries.push({ date:iso, name, type:"N" });
      if (turno === "A") entries.push({ date:iso, name, type:"A" });
    });
  }
  return { ok:true, month:monthStr, entries };
}

export function demoDaily(dateStr) {
  const dow = new Date(dateStr).getDay();
  const d   = Number(dateStr.split("-")[2]);
  if (dow === 0 || dow === 6) return { ok:true, becado:DEMO_BECADO, date:dateStr, rotationCode:"", rotationName:"", items:[] };
  const rotCode = DEMO_ROTATIONS[(d - 1) % DEMO_ROTATIONS.length];
  const rotInfo = ROT[rotCode] || ROT[""];
  const acts = DEMO_ACTIVITIES[rotCode] || [];
  return {
    ok: true, becado: DEMO_BECADO, date: dateStr,
    rotationCode: rotCode, rotationName: rotInfo.name,
    items: acts.map(([time, activity]) => ({ time, activity })),
  };
}

export function demoPersonalMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const TURNO_SEQ = [null,"P",null,"A","D",null,"N",null,null,"P","A",null,"D",null,"N",null,"P",null,"A",null,"D",null,"N",null,null,"P",null,"A","D",null,null];
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d   = i + 1;
    const iso = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dow = new Date(y, m-1, d).getDay();
    const rotCode = (dow === 0 || dow === 6) ? "" : DEMO_ROTATIONS[(d-1) % DEMO_ROTATIONS.length];
    const turno   = (dow === 0 || dow === 6) ? null : TURNO_SEQ[i % TURNO_SEQ.length];
    return {
      date: iso, rotationCode: rotCode,
      diaCode:   turno === "P" ? "P" : turno === "D" ? "D" : null,
      nocheCode: turno === "N" ? "N" : null,
      artroCode: turno === "A" ? "A" : null,
      hasSeminar: false,
    };
  });
  return { ok:true, becado:DEMO_BECADO, month:monthStr, days };
}
