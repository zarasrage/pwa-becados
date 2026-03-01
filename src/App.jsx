import { useEffect, useMemo, useState } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbyOunqjO7j6sfa6wXxGMcPabeu9a__sVWynew0UuLF_HSHypkfHKZ81tyYt1DNYo-nC/exec";
const API_TOKEN = "queseyo_calendriobecados2026";

const ROTATION_COLORS = {
  H:   { bg: "#EFF6FF", accent: "#3B82F6", dot: "#93C5FD" },
  M:   { bg: "#F0FDF4", accent: "#16A34A", dot: "#86EFAC" },
  CyP: { bg: "#FFF7ED", accent: "#EA580C", dot: "#FDC08A" },
  R:   { bg: "#FDF4FF", accent: "#9333EA", dot: "#D8B4FE" },
  TyP: { bg: "#FFF1F2", accent: "#E11D48", dot: "#FDA4AF" },
  Col: { bg: "#F0FDFA", accent: "#0D9488", dot: "#5EEAD4" },
  default: { bg: "#F8FAFC", accent: "#64748B", dot: "#CBD5E1" },
};

function getColors(code) {
  return ROTATION_COLORS[code] || ROTATION_COLORS.default;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

function offsetDate(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{
        width: 28, height: 28,
        border: "3px solid #E2E8F0",
        borderTopColor: "#64748B",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function Onboarding({ becados, onSelect, error }) {
  const [val, setVal] = useState("");
  return (
    <div style={s.page}>
      <div style={s.onboardCard}>
        <div style={s.onboardIcon}>🏥</div>
        <h1 style={s.onboardTitle}>Becados</h1>
        <p style={s.onboardSub}>Selecciona tu nombre para ver tu horario diario.</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={s.selectWrap}>
          <select
            style={{ ...s.select, color: val ? "#0F172A" : "#94A3B8" }}
            value={val}
            onChange={e => setVal(e.target.value)}
          >
            <option value="" disabled>Elige tu nombre…</option>
            {becados.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span style={s.selectChevron}>›</span>
        </div>

        <button
          style={{ ...s.btn, opacity: val ? 1 : 0.4, cursor: val ? "pointer" : "default" }}
          disabled={!val}
          onClick={() => onSelect(val)}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// ── Schedule Item ─────────────────────────────────────────────────────────────
function ScheduleItem({ time, activity, accent, dot, index }) {
  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "flex-start",
      animation: `fadeUp 0.3s ease both`,
      animationDelay: `${index * 40}ms`
    }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
      <div style={{ paddingTop: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <div style={{ width: 1, flex: 1, background: "#E2E8F0", minHeight: 16 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>
          {time}
        </div>
        <div style={{ fontSize: 15, color: "#1E293B", lineHeight: 1.4 }}>{activity}</div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const today = useMemo(() => todayISO(), []);
  const [becado, setBecado] = useState(() => localStorage.getItem("selectedBecado") || "");
  const [becados, setBecados] = useState([]);
  const [loadingBecados, setLoadingBecados] = useState(true);
  const [date, setDate] = useState(today);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initError, setInitError] = useState("");

  // Load becados list
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet({ route: "becados", token: API_TOKEN });
        if (!data.ok) throw new Error(data.error || "Error cargando becados");
        setBecados(data.becados);
      } catch (e) {
        setInitError(String(e.message || e));
      } finally {
        setLoadingBecados(false);
      }
    })();
  }, []);

  // Load daily schedule
  useEffect(() => {
    if (!becado) return;
    (async () => {
      setLoading(true);
      setError("");
      setDaily(null);
      try {
        const data = await apiGet({ route: "daily", becado, date, token: API_TOKEN });
        if (data.ok === false) throw new Error(data.error || "No se pudo obtener horario");
        setDaily(data);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [becado, date]);

  const handleSelect = (name) => {
    localStorage.setItem("selectedBecado", name);
    setBecado(name);
  };

  const handleChangeBecado = () => {
    localStorage.removeItem("selectedBecado");
    setBecado("");
    setDaily(null);
    setDate(today);
  };

  if (loadingBecados) return <div style={s.page}><Spinner /></div>;
  if (!becado) return <Onboarding becados={becados} onSelect={handleSelect} error={initError} />;

  const colors = daily ? getColors(daily.rotationCode) : getColors("default");
  const isToday = date === today;

  return (
    <div style={{ ...s.page, background: "#F8FAFC" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div>
          <button style={s.nameBtn} onClick={handleChangeBecado} title="Cambiar becado">
            {becado}
            <span style={s.nameBtnIcon}>⌄</span>
          </button>
          <div style={s.dateLabel}>
            {formatDateDisplay(date)}
            {isToday && <span style={s.todayPill}>Hoy</span>}
          </div>
        </div>
      </div>

      {/* Date navigation */}
      <div style={s.datePicker}>
        <button style={s.navBtn} onClick={() => setDate(d => offsetDate(d, -1))}>‹</button>
        <button
          style={{ ...s.navBtn, ...s.todayBtn, opacity: isToday ? 0.4 : 1, cursor: isToday ? "default" : "pointer" }}
          disabled={isToday}
          onClick={() => setDate(today)}
        >
          Hoy
        </button>
        <button style={s.navBtn} onClick={() => setDate(d => offsetDate(d, 1))}>›</button>
      </div>

      {/* Rotation badge */}
      {daily && daily.rotationCode && (
        <div style={{ ...s.rotBadge, background: colors.bg, border: `1px solid ${colors.dot}` }}>
          <div style={{ ...s.rotDot, background: colors.accent }} />
          <span style={{ ...s.rotName, color: colors.accent }}>{daily.rotationName}</span>
        </div>
      )}

      {/* Content */}
      <div style={s.content}>
        {error && <div style={s.errorBox}>{error}</div>}

        {loading ? <Spinner /> : daily ? (
          daily.items?.length ? (
            <div style={s.scheduleCard}>
              {daily.items.map((it, i) => (
                <ScheduleItem
                  key={i}
                  index={i}
                  time={it.time}
                  activity={it.activity}
                  accent={colors.accent}
                  dot={colors.dot}
                />
              ))}
            </div>
          ) : (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🗓</div>
              <div style={s.emptyText}>Sin actividades para este día</div>
            </div>
          )
        ) : !error ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>–</div>
            <div style={s.emptyText}>Sin datos</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    background: "#F8FAFC",
  },
  header: {
    padding: "24px 20px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26,
    color: "#0F172A",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  nameBtnIcon: {
    fontSize: 18,
    color: "#94A3B8",
    marginTop: 2,
  },
  dateLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    display: "flex",
    alignItems: "center",
    gap: 6,
    textTransform: "capitalize",
  },
  todayPill: {
    fontSize: 11,
    fontWeight: 600,
    background: "#0F172A",
    color: "#fff",
    borderRadius: 99,
    padding: "1px 8px",
    letterSpacing: "0.04em",
  },
  datePicker: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "16px 20px 8px",
  },
  navBtn: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    width: 38,
    height: 38,
    fontSize: 20,
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  todayBtn: {
    fontSize: 13,
    fontWeight: 600,
    width: "auto",
    padding: "0 14px",
    color: "#0F172A",
    letterSpacing: "0.01em",
  },
  rotBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    borderRadius: 99,
    padding: "6px 14px",
    marginLeft: 20,
    marginBottom: 4,
  },
  rotDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  rotName: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.03em",
  },
  content: {
    padding: "8px 20px 40px",
  },
  scheduleCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "20px 18px 4px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
  },
  errorBox: {
    background: "#FFF1F2",
    border: "1px solid #FECDD3",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#BE123C",
    marginBottom: 12,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94A3B8",
  },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyText: { fontSize: 15 },

  // Onboarding
  onboardCard: {
    padding: "48px 28px 36px",
    maxWidth: 400,
    margin: "0 auto",
  },
  onboardIcon: { fontSize: 36, marginBottom: 16 },
  onboardTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 32,
    margin: "0 0 8px",
    color: "#0F172A",
  },
  onboardSub: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 28,
    lineHeight: 1.5,
  },
  selectWrap: {
    position: "relative",
    marginBottom: 14,
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1.5px solid #E2E8F0",
    fontSize: 16,
    background: "#fff",
    appearance: "none",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  },
  selectChevron: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%) rotate(90deg)",
    color: "#94A3B8",
    fontSize: 20,
    pointerEvents: "none",
  },
  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: "#0F172A",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.02em",
    transition: "opacity 0.15s",
  },
};
