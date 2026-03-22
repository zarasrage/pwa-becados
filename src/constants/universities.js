export const UNIVERSIDADES = {
  UNAB: {
    label: "UNAB",
    groups: [
      { label:"3er año", color:"#8B73FF" },
      { label:"2do año", color:"#13C045" },
      { label:"1er año", color:"#348FFF" },
    ],
    getGroups: (becados) => [
      becados.slice(0,5),
      becados.slice(5,10),
      becados.slice(10,15),
    ].filter(g => g.length > 0),
  },
  UANDES: {
    label: "UANDES",
    groups: [
      { label:"3er año", color:"#8B73FF" },
      { label:"2do año", color:"#13C045" },
      { label:"1er año", color:"#348FFF" },
    ],
    getGroups: (becados) => [
      becados.slice(15,21),
      becados.slice(21,27),
      becados.slice(27,33),
    ].filter(g => g.length > 0),
  },
  IST: {
    label: "IST",
    groups: [
      { label:"Becados IST", color:"#FB923C" },
    ],
    getGroups: (becados) => [
      becados.slice(33,36),
    ].filter(g => g.length > 0),
  },
};
export const UNIV_ORDER = ["UNAB","UANDES","IST"];
