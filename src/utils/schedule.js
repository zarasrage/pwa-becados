import { t2m, m2t, todayISO } from "./dates.js";

export function groupItems(items) {
  if(!items?.length) return [];
  const out=[]; let cur=null;
  for(const it of items){
    if(cur&&cur.activity===it.activity){ cur.end=t2m(it.time)+59; }
    else{ if(cur)out.push(cur); cur={activity:it.activity,start:t2m(it.time),end:t2m(it.time)+59}; }
  }
  if(cur)out.push(cur);
  return out.map(g=>({activity:g.activity,from:m2t(g.start),to:m2t(g.end)}));
}

export const INFANTIL_ITEMS = [
  { time:"08:00", activity:"Infantilizado" },
  { time:"09:00", activity:"Infantilizado" },
  { time:"10:00", activity:"Infantilizado" },
  { time:"11:00", activity:"Infantilizado" },
];

export function resolveItems(rotationCode, items, dateISO) {
  if (rotationCode === "I" && !items?.length) {
    const [y,m,d] = dateISO.split("-").map(Number);
    const dow = new Date(y,m-1,d).getDay();
    return (dow === 0 || dow === 6) ? [] : INFANTIL_ITEMS;
  }
  return items || [];
}
