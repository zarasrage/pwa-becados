const TOKEN    = "queseyo_calendriobecados2026";
const SWAP_PIN = "5555";

const ROTATION_MAP = {
  "H":   { sheet: "Horario Hombro",  name: "Hombro" },
  "M":   { sheet: "Horario Mano",    name: "Mano" },
  "CyP": { sheet: "Horario Cadera",  name: "Cadera" },
  "R":   { sheet: "Horario Rodilla", name: "Rodilla" },
  "TyP": { sheet: "Horario TyP",     name: "Tobillo y Pie" },
  "Col": { sheet: "Horario Columna", name: "Columna" },
  "I":   { sheet: null,              name: "Infantil" },
  "A":   { sheet: null,              name: "Anestesia" },
  "rx":  { sheet: null,              name: "Radiología" },
  "RX":  { sheet: null,              name: "Radiología" },
  "F":   { sheet: null,              name: "Fisiatría" },
  "V":   { sheet: null,              name: "Vacaciones" },
  "T":   { sheet: null,              name: "Tumores" },
  "CPQ":   { sheet: null,              name: "Cirugía Plástica" },
};

const SEMINARIO_ROTS = ["H","M","CyP","R","TyP","Col","A","rx","RX","F","CPQ"];
const SEMINARIO_DIA  = {
  "Martes":    "Seminario Hombro",
  "Miercoles": "Seminario Rodilla",
  "Jueves":    "Seminario Mano",
};

// TTLs de caché en segundos (CacheService máx 21600s = 6h)
// Como los datos cambian 1-2 veces al mes, todo al máximo
const CACHE_TTL = {
  becados:        21600,  // 6h
  daily:          21600,  // 6h
  summary:        21600,  // 6h
  monthly:        21600,  // 6h
  personalMonth:  21600,  // 6h
  seminariosMonth:21600,  // 6h
};


// ── CacheService helpers ──────────────────────────────────────────────────────
function cacheGet_(key) {
  try {
    const raw = CacheService.getScriptCache().get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function cacheSet_(key, data, ttl) {
  try {
    const str = JSON.stringify(data);
    if (str.length < 95000) {  // límite 100KB por entrada
      CacheService.getScriptCache().put(key, str, ttl || 1800);
    }
  } catch(e) {}
}

// ── Leer hoja completa UNA vez por request (cache en memoria) ─────────────────
// Elimina hasta 8 llamadas separadas a la API de Sheets por request
const _sheetCache = {};

function readSheet_(ss, name) {
  if (_sheetCache[name] !== undefined) return _sheetCache[name];
  const sh = ss.getSheetByName(name);
  if (!sh) { _sheetCache[name] = null; return null; }
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    _sheetCache[name] = { sh, data: [], displayData: [], lastRow: 0, lastCol: 0 };
    return _sheetCache[name];
  }
  // Leer valores Y display en una sola pasada
  // getValues() para todo, getDisplayValues() para toda la hoja también
  // Usamos getDisplayValues() para horas (col A de hojas de horario)
  const range = sh.getRange(1, 1, lastRow, lastCol);
  const data        = range.getValues();
  const displayData = range.getDisplayValues();
  _sheetCache[name] = { sh, data, displayData, lastRow, lastCol };
  return _sheetCache[name];
}

// Obtener valor display de una celda (para horas formateadas)
function cellDisplay_(shObj, rowNum, colNum) {
  const r = shObj.displayData && shObj.displayData[rowNum - 1];
  if (!r) return "";
  const v = r[colNum - 1];
  return v !== undefined ? v.toString().trim() : "";
}

function cell_(shObj, rowNum, colNum) {
  const r = shObj.data[rowNum - 1];
  if (!r) return "";
  const v = r[colNum - 1];
  return v !== undefined ? v : "";
}

function row_(shObj, rowNum) {
  return shObj.data[rowNum - 1] || [];
}

// ── doGet ─────────────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const p = e.parameter || {};
    if ((p.token || "") !== TOKEN) return jsonOut({ error: "Unauthorized" });
    const route = (p.route || "").toLowerCase();

    if (route === "becados") {
      const hit = cacheGet_("becados");
      if (hit) return jsonOut(hit);
      const res = getBecados_();
      cacheSet_("becados", res, CACHE_TTL.becados);
      return jsonOut(res);
    }

    if (route === "daily") {
      const becado  = (p.becado || "").trim();
      const dateStr = (p.date   || "").trim();
      if (!becado || !dateStr) return jsonOut({ error: "Missing becado/date" });
      const cKey = "daily:" + becado + ":" + dateStr;
      const hit  = cacheGet_(cKey);
      if (hit) return jsonOut(hit);
      const res = getDaily_(becado, dateStr);
      if (res.ok !== false) cacheSet_(cKey, res, CACHE_TTL.daily);
      return jsonOut(res);
    }

    // Devuelve 7 días de una vez para un becado — evita 7 llamadas separadas
    if (route === "week") {
      const becado    = (p.becado || "").trim();
      const startDate = (p.start  || "").trim(); // YYYY-MM-DD (lunes de la semana)
      if (!becado || !startDate) return jsonOut({ error: "Missing becado/start" });
      const cKey = "week:" + becado + ":" + startDate;
      const hit  = cacheGet_(cKey);
      if (hit) return jsonOut(hit);
      const res = getWeek_(becado, startDate);
      if (res.ok !== false) cacheSet_(cKey, res, CACHE_TTL.daily);
      return jsonOut(res);
    }

    if (route === "summary") {
      const dateStr = (p.date || "").trim();
      if (!dateStr) return jsonOut({ error: "Missing date" });
      const cKey = "summary:" + dateStr;
      const hit  = cacheGet_(cKey);
      if (hit) return jsonOut(hit);
      const res = getSummary_(dateStr);
      if (res.ok !== false) cacheSet_(cKey, res, CACHE_TTL.summary);
      return jsonOut(res);
    }

    if (route === "monthly") {
      const monthStr = (p.month || "").trim();
      if (!monthStr) return jsonOut({ error: "Missing month" });
      const cKey = "monthly:" + monthStr;
      const hit  = cacheGet_(cKey);
      if (hit) return jsonOut(hit);
      const res = getMonthly_(monthStr);
      if (res.ok !== false) cacheSet_(cKey, res, CACHE_TTL.monthly);
      return jsonOut(res);
    }

    if (route === "personal-month") {
      const becado   = (p.becado || "").trim();
      const monthStr = (p.month  || "").trim();
      if (!becado || !monthStr) return jsonOut({ error: "Missing becado/month" });
      const cKey = "pm:" + becado + ":" + monthStr;
      const hit  = cacheGet_(cKey);
      if (hit) return jsonOut(hit);
      const res = getPersonalMonth_(becado, monthStr);
      if (res.ok !== false) cacheSet_(cKey, res, CACHE_TTL.personalMonth);
      return jsonOut(res);
    }

    if (route === "seminarios_month") {
      const monthStr = (p.month || "").trim();
      if (!monthStr) return jsonOut({ error: "Missing month" });
      const cKey = "semmonth:" + monthStr;
      const hit  = cacheGet_(cKey);
      if (hit) return jsonOut(hit);
      const res = getSeminariosMonth_(monthStr);
      if (res.ok !== false) cacheSet_(cKey, res, CACHE_TTL.seminariosMonth);
      return jsonOut(res);
    }

    if (route === "version") {
      // Endpoint liviano: solo devuelve el timestamp de última actualización
      // El frontend lo compara con su valor guardado para saber si limpiar caché
      const v = getDataVersion_();
      return jsonOut({ ok: true, version: v });
    }

    if (route === "invalidate_cache") {
      invalidateAllCache_();
      bumpDataVersion_();
      return jsonOut({ ok: true, msg: "Cache limpiado" });
    }

    return jsonOut({ ok: true, routes: ["daily","summary","monthly","personal-month","becados","invalidate_cache"] });
  } catch (err) {
    return jsonOut({ error: String(err) });
  }
}

// ── Invalidar caché ───────────────────────────────────────────────────────────
function invalidateAllCache_() {
  const today = new Date();
  const keys  = ["becados"];
  // Obtener lista de becados para borrar sus claves daily
  try {
    const ss   = SpreadsheetApp.getActive();
    const rot  = ss.getSheetByName("Rotaciones");
    if (rot) {
      const lastRow = rot.getLastRow();
      const names = rot.getRange(4, 1, Math.max(0, lastRow-3), 1).getValues()
        .flat().map(x=>(x||"").toString().trim()).filter(x=>x);
      for (let d = -3; d <= 14; d++) {
        const dt  = new Date(today); dt.setDate(today.getDate() + d);
        const iso = dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
        const mon = dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0");
        keys.push("summary:"+iso, "monthly:"+mon, "semmonth:"+mon);
        names.forEach(n => keys.push("daily:"+n+":"+iso, "week:"+n+":"+iso, "pm:"+n+":"+mon));
      }
    }
  } catch(e) {}
  // Borrar en lotes de 100 (límite de Apps Script)
  for (let i = 0; i < keys.length; i += 100) {
    try { CacheService.getScriptCache().removeAll(keys.slice(i, i+100)); } catch(e) {}
  }
}

// ── getBecados_ ───────────────────────────────────────────────────────────────
function getBecados_() {
  const ss  = SpreadsheetApp.getActive();
  const rot = readSheet_(ss, "Rotaciones");
  if (!rot) throw new Error("No existe hoja Rotaciones");
  const names = [];
  for (let r = 4; r <= rot.lastRow; r++) {
    const n = (cell_(rot, r, 1) || "").toString().trim();
    if (n) names.push(n);
  }
  return { ok: true, becados: names };
}

// ── getDaily_ ─────────────────────────────────────────────────────────────────
function getDaily_(becado, dateStr) {
  const ss      = SpreadsheetApp.getActive();
  const rot     = readSheet_(ss, "Rotaciones");
  if (!rot) throw new Error("No existe hoja Rotaciones");

  const date    = parseDate_(dateStr);
  const weekday = weekdayEs_(date);

  // Fila 3 = fechas (desde col B = índice 1 en el array)
  const dateRow3 = row_(rot, 3).slice(1);
  const colIndex = findDateCol_(dateRow3, date);
  if (colIndex === -1)
    return { ok: false, becado, date: dateStr, error: "Fecha no encontrada en Rotaciones" };
  const col = 2 + colIndex;

  // Fila del becado
  let rotRow = -1;
  for (let r = 4; r <= rot.lastRow; r++) {
    if ((cell_(rot, r, 1) || "").toString().trim() === becado) { rotRow = r; break; }
  }
  if (rotRow === -1)
    return { ok: false, becado, date: dateStr, error: "Becado no encontrado" };

  let rotationCode = (cell_(rot, rotRow, col) || "").toString().trim();
  if (rotationCode.toUpperCase() === "RX") rotationCode = "rx";

  const turno     = getTurnos_(ss, becado, date);
  const seminario = SEMINARIO_ROTS.includes(rotationCode)
    ? getSeminario_(ss, date, weekday)
    : null;

  if (!rotationCode)
    return { ok: true, becado, date: dateStr, weekday, rotationCode: "", rotationName: "", scheduleSheet: "", items: [], turno, seminario };

  const map = ROTATION_MAP[rotationCode];
  if (!map)
    return { ok: false, becado, date: dateStr, weekday, rotationCode, error: "Código sin mapeo", turno, seminario };

  if (!map.sheet)
    return { ok: true, becado, date: dateStr, weekday, rotationCode, rotationName: map.name, scheduleSheet: "", items: [], turno, seminario };

  const schedSh = readSheet_(ss, map.sheet);
  if (!schedSh) throw new Error("No existe hoja " + map.sheet);

  const header = row_(schedSh, 1);
  const dayCol = header.findIndex(h => (h || "").toString().trim() === weekday) + 1;
  if (dayCol <= 0)
    return { ok: false, becado, date: dateStr, weekday, rotationCode, rotationName: map.name,
             scheduleSheet: map.sheet, error: "Día no encontrado en horario", turno, seminario };

  const items = [];
  for (let r = 2; r <= schedSh.lastRow; r++) {
    const act = (cell_(schedSh, r, dayCol) || "").toString().trim();
    if (!act) continue;
    // Usar cellDisplay_ para la hora — evita desfase de timezone en objetos Date
    const timeRaw = cellDisplay_(schedSh, r, 1) || formatTime_(cell_(schedSh, r, 1));
    items.push({ time: normalizeTime_(timeRaw), activity: act });
  }

  return { ok: true, becado, date: dateStr, weekday, rotationCode, rotationName: map.name,
           scheduleSheet: map.sheet, items, turno, seminario };
}

// ── getTurnos_ ────────────────────────────────────────────────────────────────
function getTurnos_(ss, becado, date) {
  const result = { diaCode: null, nocheCode: null, artroCode: null };
  const defs   = [{ name: "Dia", key: "diaCode" }, { name: "Noche", key: "nocheCode" }, { name: "Artroscopia", key: "artroCode" }];
  for (const def of defs) {
    const sh = readSheet_(ss, def.name);
    if (!sh) continue;
    const colIdx = findDateCol_(row_(sh, 3).slice(1), date);
    if (colIdx === -1) continue;
    const col = 2 + colIdx;
    for (let r = 4; r <= sh.lastRow; r++) {
      if ((cell_(sh, r, 1) || "").toString().trim() === becado) {
        const val = (cell_(sh, r, col) || "").toString().trim();
        if (val) result[def.key] = val;
        break;
      }
    }
  }
  return result;
}

// ── getSeminario_ ─────────────────────────────────────────────────────────────
function getSeminario_(ss, date, weekday) {
  const tag = SEMINARIO_DIA[weekday];
  if (!tag) return null;
  const sh = readSheet_(ss, "Seminarios");
  if (!sh) return null;
  const colIdx = findDateCol_(row_(sh, 3).slice(1), date);
  if (colIdx === -1) return null;
  const col = 2 + colIdx;
  for (let r = 4; r <= sh.lastRow; r++) {
    const raw = (cell_(sh, r, col) || "").toString().trim();
    if (!raw) continue;
    const is745     = raw.startsWith("7:45");
    const time      = is745 ? "07:45" : "07:30";
    const title     = is745 ? raw.replace(/^7:45\s*/, "").trim() : raw;
    const presenter = (cell_(sh, r, 1) || "").toString().trim();
    return { presenter, title, tag, time };
  }
  return null;
}

// ── getSummary_ ───────────────────────────────────────────────────────────────
function getSummary_(dateStr) {
  const ss  = SpreadsheetApp.getActive();
  const rot = readSheet_(ss, "Rotaciones");
  if (!rot) throw new Error("No existe hoja Rotaciones");
  const date     = parseDate_(dateStr);
  const colIndex = findDateCol_(row_(rot, 3).slice(1), date);
  if (colIndex === -1) return { ok: false, error: "Fecha no encontrada" };
  const col    = 2 + colIndex;
  const groups = {};
  for (let r = 4; r <= rot.lastRow; r++) {
    const name = (cell_(rot, r, 1) || "").toString().trim();
    if (!name) continue;
    let code = (cell_(rot, r, col) || "").toString().trim();
    if (code.toUpperCase() === "RX") code = "rx";
    if (!groups[code]) groups[code] = [];
    groups[code].push(name);
  }
  return { ok: true, date: dateStr, groups };
}

// ── buildMonthColMap_ ─────────────────────────────────────────────────────────
// { colIndex_0based_desde_B → "YYYY-MM-DD" } para el mes y año dados
// IMPORTANTE: usar getUTC* porque las fechas del sheet llegan como
// medianoche UTC (2026-03-10T00:00:00Z). Con getDate() local en
// un servidor UTC-0 el día queda correcto, pero si el script timezone
// difiere, getDate() puede desfasar un día. getUTCDate() es siempre fiable.
function buildMonthColMap_(dateRow, y, m) {
  const map = {};
  for (let i = 0; i < dateRow.length; i++) {
    const v = dateRow[i];
    if (!v) continue;
    const d = (v instanceof Date) ? v : new Date(v);
    if (isNaN(d.getTime())) continue;
    const vy = d.getUTCFullYear(), vm = d.getUTCMonth(), vd = d.getUTCDate();
    if (vy === y && vm === m - 1) {
      const iso = vy + "-" + String(vm + 1).padStart(2,"0") + "-" + String(vd).padStart(2,"0");
      map[i] = iso;
    }
  }
  return map;
}

// ── getMonthly_ ───────────────────────────────────────────────────────────────
function getMonthly_(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const ss      = SpreadsheetApp.getActive();
  const entries = [];

  const sheetDefs = [
    { name: "Dia",          types: { P:"P", p:"p", D:"D" } },
    { name: "Noche",        types: { N:"N" } },
    { name: "Artroscopia",  types: { A:"A" } },
  ];
  for (const def of sheetDefs) {
    const sh = readSheet_(ss, def.name);
    if (!sh) continue;
    const colMap  = buildMonthColMap_(row_(sh, 3).slice(1), y, m);
    const colIdxs = Object.keys(colMap).map(Number);
    if (!colIdxs.length) continue;
    for (let r = 4; r <= sh.lastRow; r++) {
      const name = (cell_(sh, r, 1) || "").toString().trim();
      if (!name) continue;
      for (const ci of colIdxs) {
        const val  = (cell_(sh, r, 2 + ci) || "").toString().trim();
        const type = def.types[val];
        if (type) entries.push({ date: colMap[ci], name, type });
      }
    }
  }

  // Seminarios
  const semSh = readSheet_(ss, "Seminarios");
  if (semSh) {
    const colMap = buildMonthColMap_(row_(semSh, 3).slice(1), y, m);
    for (const [ci, iso] of Object.entries(colMap)) {
      const localDate = parseDate_(iso); // parseo local, evita bug de timezone
      const dow = localDate.getDay();
      if (![2,3,4].includes(dow)) continue;
      const tag = SEMINARIO_DIA[weekdayEs_(localDate)] || "";
      const col = 2 + Number(ci);
      for (let r = 4; r <= semSh.lastRow; r++) {
        const raw = (cell_(semSh, r, col) || "").toString().trim();
        if (!raw) continue;
        const is745 = raw.startsWith("7:45");
        entries.push({ date: iso, name: (cell_(semSh,r,1)||"").toString().trim(),
          type:"S", title: is745 ? raw.replace(/^7:45\s*/,"").trim() : raw,
          tag, time: is745 ? "07:45" : "07:30" });
        break;
      }
    }
  }
  return { ok: true, month: monthStr, entries };
}

// ── getPersonalMonth_ ─────────────────────────────────────────────────────────
function getPersonalMonth_(becado, monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const ss      = SpreadsheetApp.getActive();

  // Rotaciones
  const rot = readSheet_(ss, "Rotaciones");
  if (!rot) throw new Error("No existe hoja Rotaciones");
  let rotRow = -1;
  for (let r = 4; r <= rot.lastRow; r++) {
    if ((cell_(rot, r, 1)||"").toString().trim() === becado) { rotRow = r; break; }
  }
  if (rotRow === -1) return { ok: false, error: "Becado no encontrado" };

  const rotColMap = buildMonthColMap_(row_(rot, 3).slice(1), y, m);
  const rotByDay  = {};
  for (const [ci, iso] of Object.entries(rotColMap)) {
    let val = (cell_(rot, rotRow, 2 + Number(ci))||"").toString().trim();
    if (val.toUpperCase() === "RX") val = "rx";
    rotByDay[Number(iso.split("-")[2])] = val;
  }

  // Turnos Dia / Noche / Artroscopia
  const diaByDay   = readBecadoMonth_(ss, "Dia",   becado, y, m);
  const nocheByDay = readBecadoMonth_(ss, "Noche", becado, y, m);
  const artroByDay = readBecadoMonth_(ss, "Artroscopia", becado, y, m);

  // Seminarios
  const semByDay = {};
  const semSh    = readSheet_(ss, "Seminarios");
  if (semSh) {
    const colMap = buildMonthColMap_(row_(semSh, 3).slice(1), y, m);
    for (const [ci, iso] of Object.entries(colMap)) {
      const dayNum    = Number(iso.split("-")[2]);
      const localDate = new Date(y, m-1, dayNum);
      const dow       = localDate.getDay();
      if (![2,3,4].includes(dow)) continue;
      if (!SEMINARIO_ROTS.includes(rotByDay[dayNum] || "")) continue;
      const col = 2 + Number(ci);
      const tag = SEMINARIO_DIA[weekdayEs_(localDate)] || "";
      for (let r = 4; r <= semSh.lastRow; r++) {
        const raw = (cell_(semSh, r, col)||"").toString().trim();
        if (!raw) continue;
        const is745     = raw.startsWith("7:45");
        const time      = is745 ? "07:45" : "07:30";
        const title     = is745 ? raw.replace(/^7:45\s*/, "").trim() : raw;
        const presenter = (cell_(semSh, r, 1) || "").toString().trim();
        semByDay[dayNum] = { presenter, title, tag, time };
        break;
      }
    }
  }

  const daysInMonth = new Date(y, m, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = y + "-" + String(m).padStart(2,"0") + "-" + String(d).padStart(2,"0");
    const sem = semByDay[d] || null;
    days.push({ date: iso, rotationCode: rotByDay[d]||"", diaCode: diaByDay[d]||null,
                nocheCode: nocheByDay[d]||null, artroCode: artroByDay[d]||null,
                hasSeminar: !!sem, seminario: sem });
  }
  return { ok: true, becado, month: monthStr, days };
}

function readBecadoMonth_(ss, sheetName, becado, y, m) {
  const result = {};
  const sh = readSheet_(ss, sheetName);
  if (!sh) return result;
  let becRow = -1;
  for (let r = 4; r <= sh.lastRow; r++) {
    if ((cell_(sh, r, 1)||"").toString().trim() === becado) { becRow = r; break; }
  }
  if (becRow === -1) return result;
  const colMap = buildMonthColMap_(row_(sh, 3).slice(1), y, m);
  for (const [ci, iso] of Object.entries(colMap)) {
    const val = (cell_(sh, becRow, 2 + Number(ci))||"").toString().trim();
    if (val) result[Number(iso.split("-")[2])] = val;
  }
  return result;
}

// ── getSeminariosMonth_ ───────────────────────────────────────────────────────
function getSeminariosMonth_(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const ss     = SpreadsheetApp.getActive();
  const sh     = readSheet_(ss, "Seminarios");
  if (!sh) return { ok: false, error: "No existe hoja Seminarios" };
  const colMap = buildMonthColMap_(row_(sh, 3).slice(1), y, m);
  const days   = {};
  for (const [ci, iso] of Object.entries(colMap)) {
    const localDate = parseDate_(iso);
    const tag = SEMINARIO_DIA[weekdayEs_(localDate)];
    if (!tag) continue;
    const col = 2 + Number(ci);
    for (let r = 4; r <= sh.lastRow; r++) {
      const raw = (cell_(sh, r, col)||"").toString().trim();
      if (!raw) continue;
      const is745 = raw.startsWith("7:45");
      days[iso] = { presenter: (cell_(sh,r,1)||"").toString().trim(),
        title: is745 ? raw.replace(/^7:45\s*/,"").trim() : raw,
        tag, time: is745 ? "07:45" : "07:30" };
      break;
    }
  }
  return { ok: true, month: monthStr, days };
}

// ── doPost — swap de turnos ───────────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if ((body.pin || "") !== SWAP_PIN) return jsonOut({ ok: false, error: "PIN incorrecto" });
    const route = (body.route || "").toLowerCase();
    if (route === "swap_turno") {
      const { becado1, date1, becado2, date2, sheet, tipoCode } = body;
      if (!becado1||!date1||!becado2||!date2||!sheet||!tipoCode)
        return jsonOut({ ok: false, error: "Faltan parámetros" });
      if (sheet !== "Dia" && sheet !== "Noche" && sheet !== "Artroscopia")
        return jsonOut({ ok: false, error: "Sheet inválido" });
      if (!["P","D","N","A"].includes(tipoCode))
        return jsonOut({ ok: false, error: "Tipo de turno inválido" });
      const res = swapTurno_(becado1, date1, becado2, date2, sheet, tipoCode);
      if (res.ok) {
        const mon1 = getMondayStr_(date1), mon2 = getMondayStr_(date2);
        const keys = [
          "daily:"+becado1+":"+date1, "daily:"+becado1+":"+date2,
          "daily:"+becado2+":"+date1, "daily:"+becado2+":"+date2,
          "week:"+becado1+":"+mon1,   "week:"+becado1+":"+mon2,
          "week:"+becado2+":"+mon1,   "week:"+becado2+":"+mon2,
          "summary:"+date1, "summary:"+date2,
          "monthly:"+date1.substring(0,7), "monthly:"+date2.substring(0,7),
          "pm:"+becado1+":"+date1.substring(0,7), "pm:"+becado1+":"+date2.substring(0,7),
          "pm:"+becado2+":"+date1.substring(0,7), "pm:"+becado2+":"+date2.substring(0,7),
        ];
        try { CacheService.getScriptCache().removeAll([...new Set(keys)]); } catch(err) {}
      }
      return jsonOut(res);
    }
    return jsonOut({ ok: false, error: "Ruta no encontrada" });
  } catch(err) { return jsonOut({ ok: false, error: String(err) }); }
}

function getMondayStr_(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  const dow = dt.getDay();
  dt.setDate(dt.getDate() - (dow === 0 ? 6 : dow - 1));
  return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
}

// ── swapTurno_ ────────────────────────────────────────────────────────────────
function swapTurno_(becado1, date1, becado2, date2, sheetName, tipoCode) {
  const ss    = SpreadsheetApp.getActive();
  const sh    = ss.getSheetByName(sheetName);
  if (!sh) return { ok: false, error: "No existe hoja " + sheetName };
  const shObj = readSheet_(ss, sheetName);
  const dateRow = row_(shObj, 3).slice(1);
  const ci1 = findDateCol_(dateRow, parseDate_(date1));
  const ci2 = findDateCol_(dateRow, parseDate_(date2));
  if (ci1 === -1) return { ok: false, error: "Fecha no encontrada: " + date1 };
  if (ci2 === -1) return { ok: false, error: "Fecha no encontrada: " + date2 };
  const col1 = 2 + ci1, col2 = 2 + ci2;
  let row1 = -1, row2 = -1;
  for (let r = 4; r <= shObj.lastRow; r++) {
    const n = (cell_(shObj, r, 1)||"").toString().trim();
    if (n === becado1.trim()) row1 = r;
    if (n === becado2.trim()) row2 = r;
    if (row1 >= 0 && row2 >= 0) break;
  }
  if (row1 === -1) return { ok: false, error: "Becado no encontrado: " + becado1 };
  if (row2 === -1) return { ok: false, error: "Becado no encontrado: " + becado2 };
  const val1 = (cell_(shObj, row1, col1)||"").toString().trim();
  const val2 = (cell_(shObj, row2, col2)||"").toString().trim();
  if (val1 !== tipoCode) return { ok: false, error: becado1+' no tiene turno "'+tipoCode+'" el '+date1+' (tiene: "'+(val1||"vacío")+'")' };
  if (val2 !== tipoCode) return { ok: false, error: becado2+' no tiene turno "'+tipoCode+'" el '+date2+' (tiene: "'+(val2||"vacío")+'")' };
  // Intercambio cruzado: becado1 pasa a tener el turno en date2, becado2 en date1
  sh.getRange(row1, col1).setValue("");
  sh.getRange(row2, col2).setValue("");
  sh.getRange(row1, col2).setValue(tipoCode);
  sh.getRange(row2, col1).setValue(tipoCode);
  return { ok: true, swapped: { [becado1]: { de: date1, a: date2 }, [becado2]: { de: date2, a: date1 } } };
}

// ── getWeek_ ─────────────────────────────────────────────────────────────────
// Devuelve 7 días consecutivos para un becado en UNA llamada
function getWeek_(becado, startDateStr) {
  const [y,m,d] = startDateStr.split("-").map(Number);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt  = new Date(y, m-1, d+i);
    const iso = dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
    // Reusar caché individual si existe
    const cKey = "daily:"+becado+":"+iso;
    const hit  = cacheGet_(cKey);
    if (hit) { days.push(hit); continue; }
    const res = getDaily_(becado, iso);
    if (res.ok !== false) cacheSet_(cKey, res, CACHE_TTL.daily);
    days.push(res);
  }
  return { ok: true, becado, start: startDateStr, days };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDate_(s) {
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}

function findDateCol_(dateRowValues, date) {
  const ty = date.getFullYear(), tm = date.getMonth(), td = date.getDate();
  for (let i = 0; i < dateRowValues.length; i++) {
    const v = dateRowValues[i];
    if (!v) continue;
    const d = (v instanceof Date) ? v : new Date(v);
    if (isNaN(d.getTime())) continue;
    if (d.getUTCFullYear()===ty && d.getUTCMonth()===tm && d.getUTCDate()===td) return i;
  }
  return -1;
}

function weekdayEs_(date) {
  return ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"][date.getDay()];
}

function formatTime_(v) {
  if (v instanceof Date) {
    // Las horas en Sheets llegan como Date en 1899-12-30
    // Usar getHours()/getMinutes() LOCAL (no UTC) para respetar el valor real
    const hh = String(v.getHours()).padStart(2,"0");
    const mm = String(v.getMinutes()).padStart(2,"0");
    return hh + ":" + mm;
  }
  return (v||"").toString();
}

// Normaliza strings de hora a "HH:MM"
// Acepta: "8:00", "08:00", "8:00:00", "8:00 AM", "8:00:00 AM"
function normalizeTime_(raw) {
  if (!raw) return "";
  const s = raw.toString().trim();
  // Quitar segundos y AM/PM
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return String(m[1]).padStart(2,"0") + ":" + m[2];
  return s;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ── Funciones para ejecutar manualmente desde Apps Script ────────────────────
function limpiarCache() {
  invalidateAllCache_();
  Logger.log("Cache limpiado OK");
}

function testVelocidad() {
  const ss    = SpreadsheetApp.getActive();
  const rot   = readSheet_(ss, "Rotaciones");
  const names = [];
  for (let r = 4; r <= rot.lastRow; r++) {
    const n = (cell_(rot,r,1)||"").toString().trim();
    if (n) names.push(n);
  }
  if (!names.length) { Logger.log("Sin becados"); return; }
  const today = new Date();
  const iso   = today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");

  // Test sin caché
  const t1 = Date.now();
  const res = getDaily_(names[0], iso);
  Logger.log("Sin cache: " + (Date.now()-t1) + "ms | ok=" + res.ok);

  // Guardar en caché
  cacheSet_("test:daily:"+names[0]+":"+iso, res, 60);

  // Test con caché
  const t2  = Date.now();
  const hit = cacheGet_("test:daily:"+names[0]+":"+iso);
  Logger.log("Con cache: " + (Date.now()-t2) + "ms | hit=" + (hit!==null));
}

function debugHorasColumna() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("Horario Columna");
  if (!sh) { Logger.log("No existe hoja Horario Columna"); return; }
  // Leer primeras 10 filas, col A con ambos métodos
  const lastRow = Math.min(sh.getLastRow(), 11);
  const vals    = sh.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const disp    = sh.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat();
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    const d = disp[i];
    let info = "";
    if (v instanceof Date) {
      info = "Date | getHours="+v.getHours()+" getMinutes="+v.getMinutes()+" | getUTCHours="+v.getUTCHours()+" getUTCMinutes="+v.getUTCMinutes();
    } else {
      info = "string: " + JSON.stringify(v);
    }
    Logger.log("Fila "+(i+2)+" | getValues: "+info+" | getDisplayValues: "+JSON.stringify(d));
  }
}
// ── Limpiar caché del servidor (ejecutar manualmente cuando se edita el Sheet) ─
function clearAllCache() {
  const cache = CacheService.getScriptCache();
  const months = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06",
                  "2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"];
  const keys = [];
  months.forEach(m => {
    keys.push("monthly:" + m);
    keys.push("semmonth:" + m);
  });
  cache.removeAll(keys);
  Logger.log("Caché limpiado: " + keys.length + " keys");
}

// ── Data Version — sincronización frontend ──────────────────────────────────
// Un timestamp guardado en Script Properties. Cuando el Sheet se edita,
// se actualiza. El frontend lo chequea una vez por sesión y si cambió,
// limpia todo su localStorage.

function getDataVersion_() {
  try {
    return PropertiesService.getScriptProperties().getProperty("dataVersion") || "0";
  } catch { return "0"; }
}

function bumpDataVersion_() {
  try {
    PropertiesService.getScriptProperties().setProperty("dataVersion", String(Date.now()));
  } catch(e) {}
}

// ── Menú personalizado — botón "Actualizar App" ─────────────────────────────
// Aparece arriba en el Sheet como menú "MimApp".
// Flujo: editas todo lo que necesitas → click en "Actualizar App" → listo.

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🔄 MimApp")
    .addItem("Actualizar App", "actualizarApp")
    .addSeparator()
    .addItem("Limpiar caché servidor", "limpiarCache")
    .addToUi();
}

function actualizarApp() {
  invalidateAllCache_();
  bumpDataVersion_();
  SpreadsheetApp.getUi().alert(
    "✅ App actualizada",
    "Los becados verán los datos nuevos la próxima vez que abran la app.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}