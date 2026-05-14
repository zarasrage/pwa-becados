import { useMemo, useRef, useState } from "react";
import { API_TOKEN } from "../constants/api.js";
import { ROT } from "../constants/rotations.js";
import { todayISO, offsetDate, getWeekDates, weekRangeLabel } from "../utils/dates.js";
import { useApiData } from "../hooks/useApiData.js";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { PullIndicator } from "../components/ui/PullIndicator.jsx";
import { OfflineBanner } from "../components/ui/OfflineBanner.jsx";
import { ErrorBox } from "../components/ui/ErrorBox.jsx";
import { SkeletonLine } from "../components/ui/SkeletonCard.jsx";

const MAIN_TEAMS = [
  { code: "M",   name: "Mano" },
  { code: "H",   name: "Hombro" },
  { code: "CyP", name: "Cadera" },
  { code: "R",   name: "Rodilla" },
  { code: "TyP", name: "Tobillo y Pie" },
  { code: "Col", name: "Columna" },
];

const DAY_LABELS = ["L", "M", "X", "J", "V"];

// Turno badge colors
const TURNO_CFG = {
  P:  { label: "P",  color: "#06B6D4", title: "Poli Tarde" },
  p:  { label: "PM", color: "#06B6D4", title: "Poli Mañana" },
  D:  { label: "D",  color: "#F59E0B", title: "Turno Día" },
  N:  { label: "N",  color: "#4F6EFF", title: "Turno Noche" },
};

function shortName(full) {
  if (!full) return "";
  const parts = full.trim().split(" ");
  if (parts.length <= 2) return full;
  return parts[0] + " " + parts[parts.length - 1];
}

function TurnoBadges({ types }) {
  if (!types || types.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
      {types.map((t, i) => {
        const cfg = TURNO_CFG[t];
        if (!cfg) return null;
        return (
          <span key={i} style={{
            fontSize: 8,
            fontWeight: 800,
            color: cfg.color,
            background: `${cfg.color}22`,
            border: `1px solid ${cfg.color}55`,
            borderRadius: 4,
            padding: "1px 3px",
            lineHeight: 1.3,
            letterSpacing: "0.02em",
          }}>{cfg.label}</span>
        );
      })}
    </div>
  );
}

function TeamCard({ code, weekDates, today, summaryGroups, turnoLookup, T }) {
  const r = ROT[code] || ROT[""];
  const names = summaryGroups?.[code] || [];

  if (!summaryGroups) {
    // skeleton
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${r.accent}`, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ padding: "10px 14px", background: r.light, borderBottom: `1px solid ${r.accent}18`, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.accent, display: "inline-block" }} />
          <SkeletonLine width={80} height={13} T={T} />
        </div>
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1, 2].map(i => <SkeletonLine key={i} width="90%" height={11} T={T} />)}
        </div>
      </div>
    );
  }

  if (names.length === 0) {
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${r.accent}`, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ padding: "10px 14px", background: r.light, borderBottom: `1px solid ${r.accent}18`, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.accent, display: "inline-block" }} />
          <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 13, fontWeight: 700, color: r.accent }}>{ROT[code]?.name || code}</span>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 12, color: T.muted }}>Sin becados esta semana</span>
        </div>
      </div>
    );
  }

  const workDays = weekDates.slice(0, 5); // Mon–Fri only

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${r.accent}`, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", background: r.light, borderBottom: `1px solid ${r.accent}18`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.accent, boxShadow: `0 0 6px ${r.accent}`, display: "inline-block" }} />
          <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 13, fontWeight: 700, color: r.accent }}>{ROT[code]?.name || code}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: r.accent, background: `${r.accent}18`, border: `1px solid ${r.accent}30`, borderRadius: 99, padding: "2px 9px" }}>
          {names.length} becado{names.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Day columns header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(5, 38px)", gap: 2, padding: "6px 10px 4px", borderBottom: `1px solid ${T.border}` }}>
        <div />
        {workDays.map((date, i) => {
          const isToday = date === today;
          return (
            <div key={date} style={{
              textAlign: "center", fontSize: 10, fontWeight: 700,
              color: isToday ? r.accent : T.muted,
              letterSpacing: "0.04em",
            }}>
              {DAY_LABELS[i]}
              <div style={{ fontSize: 9, fontWeight: isToday ? 800 : 400, color: isToday ? r.accent : T.muted }}>
                {date.split("-")[2]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resident rows */}
      <div style={{ padding: "4px 10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {names.map((name, ni) => (
          <div key={ni} style={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(5, 38px)",
            gap: 2,
            alignItems: "center",
            padding: "4px 0",
            borderBottom: ni < names.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{ fontSize: 11, color: T.sub, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 4 }}>
              {shortName(name)}
            </div>
            {workDays.map(date => {
              const types = turnoLookup?.[name]?.[date] || [];
              const isToday = date === today;
              return (
                <div key={date} style={{
                  minHeight: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isToday ? `${r.accent}0A` : "transparent",
                  borderRadius: 4,
                }}>
                  {types.length > 0
                    ? <TurnoBadges types={types} />
                    : <span style={{ width: 4, height: 1, background: T.border, display: "inline-block", borderRadius: 99 }} />
                  }
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabEquipos({ onChangeBecado, T }) {
  const today = useMemo(() => todayISO(), []);

  const [refDate, setRefDate] = useState(() => {
    const d = new Date();
    const dow = d.getDay();
    return (dow === 6 || dow === 0) ? offsetDate(today, 7) : today;
  });

  const weekDates = useMemo(() => getWeekDates(refDate), [refDate]);
  const monday = weekDates[0];
  const isThisWeek = weekDates.includes(today);

  const scrollRef = useRef(null);

  // summary for Monday → team assignments
  const summaryParams = useMemo(
    () => ({ route: "summary", date: monday, token: API_TOKEN }),
    [monday]
  );
  const { data: summary, updating: sumUpdating, error: sumError, refresh: sumRefresh } = useApiData(summaryParams);

  // monthly for current month → turno data
  const monthStr = useMemo(() => monday.substring(0, 7), [monday]);
  const monthParams = useMemo(
    () => ({ route: "monthly", month: monthStr, token: API_TOKEN }),
    [monthStr]
  );
  const { data: monthData, updating: monUpdating, refresh: monRefresh } = useApiData(monthParams);

  // If week spans two months, also fetch next month
  const friday = weekDates[4];
  const nextMonth = friday.substring(0, 7) !== monthStr ? friday.substring(0, 7) : null;
  const nextMonthParams = useMemo(
    () => nextMonth ? { route: "monthly", month: nextMonth, token: API_TOKEN } : null,
    [nextMonth]
  );
  const { data: nextMonthData } = useApiData(nextMonthParams);

  // turnoLookup: name → date → [types]
  const turnoLookup = useMemo(() => {
    const workDays = new Set(weekDates.slice(0, 5));
    const map = {};
    const allEntries = [
      ...(monthData?.entries || []),
      ...(nextMonthData?.entries || []),
    ];
    allEntries.forEach(e => {
      if (!["P", "p", "D", "N"].includes(e.type)) return;
      if (!workDays.has(e.date)) return;
      if (!map[e.name]) map[e.name] = {};
      if (!map[e.name][e.date]) map[e.name][e.date] = [];
      map[e.name][e.date].push(e.type);
    });
    return map;
  }, [monthData, nextMonthData, weekDates]);

  const ptr = usePullToRefresh(() => { sumRefresh(); monRefresh(); }, scrollRef);

  const updating = sumUpdating || monUpdating;
  const error = sumError;
  const summaryGroups = summary?.ok !== false ? summary?.groups : null;

  return (
    <div
      ref={scrollRef}
      style={{ position: "relative", overflowY: "auto", minHeight: "100vh" }}
      onTouchStart={ptr.onTouchStart}
      onTouchMove={ptr.onTouchMove}
      onTouchEnd={ptr.onTouchEnd}
    >
      <PullIndicator pullY={ptr.pullY} triggered={ptr.triggered} T={T} />

      <div style={{ padding: "calc(var(--sat) + 20px) 16px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: T.muted, textTransform: "uppercase", marginBottom: 4 }}>Equipos</div>
        <div style={{ marginBottom: 12 }}>
          <button className="press" onClick={onChangeBecado} style={{ background: "none", border: "none", padding: 0, textAlign: "left" }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.1 }}>La semana</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>toca para cambiar</div>
          </button>
        </div>

        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button className="press" onClick={() => setRefDate(d => offsetDate(d, -7))}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.sub, flexShrink: 0 }}>
            ‹
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>
              {weekRangeLabel(weekDates)}
            </div>
            {updating && <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>Actualizando…</div>}
          </div>
          {!isThisWeek && (
            <button className="press" onClick={() => setRefDate(today)}
              style={{ height: 32, padding: "0 11px", borderRadius: 8, border: `1px solid ${T.accent}60`, background: `${T.accent}14`, fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: "0.05em", flexShrink: 0 }}>
              HOY
            </button>
          )}
          <button className="press" onClick={() => setRefDate(d => offsetDate(d, 7))}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.sub, flexShrink: 0 }}>
            ›
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        <OfflineBanner isOnline={true} isStale={updating} T={T} />
        <ErrorBox msg={error} T={T} />

        {MAIN_TEAMS.map(({ code }) => (
          <TeamCard
            key={code}
            code={code}
            weekDates={weekDates}
            today={today}
            summaryGroups={summaryGroups}
            turnoLookup={turnoLookup}
            T={T}
          />
        ))}
      </div>
    </div>
  );
}
