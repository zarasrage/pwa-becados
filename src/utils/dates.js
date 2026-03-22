export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
export function offsetDate(iso, days) {
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y,m-1,d+days);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}
export function formatDate(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"});
}
export function getWeekDates(refISO) {
  const [y,m,d] = refISO.split("-").map(Number);
  const ref = new Date(y,m-1,d);
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({length:7},(_,i)=>{
    const dt = new Date(monday);
    dt.setDate(monday.getDate()+i);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  });
}
export function weekLabel(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"short",day:"numeric"});
}
export function weekRangeLabel(dates) {
  const [y1,m1,d1] = dates[0].split("-").map(Number);
  const [y2,m2,d2] = dates[6].split("-").map(Number);
  const from = new Date(y1,m1-1,d1).toLocaleDateString("es-CL",{day:"numeric",month:"short"});
  const to   = new Date(y2,m2-1,d2).toLocaleDateString("es-CL",{day:"numeric",month:"short"});
  return `${from} – ${to}`;
}
export function getMonthDates(year, month) {
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDow  = (firstDay.getDay() + 6) % 7;
  const slots = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) { slots.push(null); continue; }
    const d = new Date(year, month, dayNum);
    slots.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }
  let last = 41;
  while (last > 0 && slots[last] === null) last--;
  return slots.slice(0, Math.ceil((last + 1) / 7) * 7);
}
export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("es-CL", { month:"long", year:"numeric" });
}
export function nextMonthStr(m) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
export function monthNameLabel(m) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo-1, 1).toLocaleDateString("es-CL", { month:"long" });
}
export function t2m(t) { if(!t)return 0; const[h,m]=t.split(":").map(Number); return h*60+(m||0); }
export function m2t(m) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }
