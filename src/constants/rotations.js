export const ROT = {
  H:   { accent:"#FB923C", glow:"#FB923C28", light:"#FB923C12", dark:"#FB923C22", name:"Hombro" },
  M:   { accent:"#F87171", glow:"#F8717128", light:"#F8717112", dark:"#F8717122", name:"Mano" },
  CyP: { accent:"#348FFF", glow:"#348FFF28", light:"#348FFF12", dark:"#348FFF22", name:"Cadera" },
  R:   { accent:"#FBBF24", glow:"#FBBF2428", light:"#FBBF2412", dark:"#FBBF2422", name:"Rodilla" },
  TyP: { accent:"#13C045", glow:"#13C04528", light:"#13C04512", dark:"#13C04522", name:"Tobillo y Pie" },
  Col: { accent:"#8B73FF", glow:"#8B73FF28", light:"#8B73FF12", dark:"#8B73FF22", name:"Columna" },
  I:   { accent:"#F472B6", glow:"#F472B628", light:"#F472B612", dark:"#F472B622", name:"Infantil" },
  A:   { accent:"#E2E8F0", glow:"#E2E8F028", light:"#E2E8F012", dark:"#E2E8F022", name:"Anestesia" },
  rx:  { accent:"#64748B", glow:"#64748B28", light:"#64748B12", dark:"#64748B22", name:"Radiología" },
  F:   { accent:"#94A3B8", glow:"#94A3B828", light:"#94A3B812", dark:"#94A3B822", name:"Fisiatría" },
  V:   { accent:"#334155", glow:"#33415528", light:"#33415512", dark:"#33415522", name:"Vacaciones" },
 CPQ:  { accent:"#D2A679", glow:"#D2A67933", light:"#D2A6791A", dark:"#D2A67926", name:"Vacaciones" },
  "":  { accent:"#64748B", glow:"#64748B28", light:"#64748B12", dark:"#64748B22", name:"Sin rotación" },
};
export const ROT_ORDER = ["H","M","CyP","R","TyP","Col","I","A","rx","F","V","CPQ",""];

export const YEAR_COLORS = ["#8B73FF","#13C045","#348FFF"];
export const YEAR_LABELS = ["3er año","2do año","1er año"];

export function rot(code) { return ROT[code] || ROT[""]; }
