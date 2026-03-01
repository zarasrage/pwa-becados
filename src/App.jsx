import { useEffect, useMemo, useState } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbyOunqjO7j6sfa6wXxGMcPabeu9a__sVWynew0UuLF_HSHypkfHKZ81tyYt1DNYo-nC/exec"; // ej: https://script.google.com/macros/s/.../exec
const API_TOKEN = "queseyo_calendriobecados2026";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

export default function App() {
  const [becado, setBecado] = useState(() => localStorage.getItem("selectedBecado") || "");
  const [becados, setBecados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState(null);
  const [error, setError] = useState("");

  const date = useMemo(() => todayISO(), []);

  // Load list
  useEffect(() => {
    (async () => {
      try {
        setError("");
        const data = await apiGet({ route: "becados", token: API_TOKEN });
        if (!data.ok) throw new Error(data.error || "Error cargando becados");
        setBecados(data.becados);
      } catch (e) {
        setError(String(e.message || e));
      }
    })();
  }, []);

  // Load daily when becado chosen
  useEffect(() => {
    if (!becado) return;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await apiGet({
          route: "daily",
          becado,
          date,
          token: API_TOKEN
        });
        if (data.ok === false) throw new Error(data.error || "No se pudo obtener horario");
        setDaily(data);
      } catch (e) {
        setError(String(e.message || e));
        setDaily(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [becado, date]);

  // Onboarding screen
  if (!becado) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Becados</h1>
          <p style={styles.p}>Elige tu becado (se guardará en este dispositivo).</p>

          {error ? <div style={styles.error}>{error}</div> : null}

          <select
            style={styles.select}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              localStorage.setItem("selectedBecado", v);
              setBecado(v);
            }}
          >
            <option value="" disabled>Selecciona…</option>
            {becados.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <div style={styles.small}>Tip: luego puedes cambiarlo tocando el nombre arriba.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <button
          style={styles.nameBtn}
          onClick={() => {
            localStorage.removeItem("selectedBecado");
            setBecado("");
            setDaily(null);
          }}
          title="Cambiar becado"
        >
          {becado}
        </button>
        <div style={styles.meta}>{date}</div>
      </div>

      <div style={styles.card}>
        {error ? <div style={styles.error}>{error}</div> : null}

        {loading ? (
          <div style={styles.p}>Cargando…</div>
        ) : daily ? (
          <>
            <div style={styles.row}>
              <div style={styles.label}>Hoy</div>
              <div style={styles.value}>
                {daily.weekday} · {daily.rotationName || "Sin rotación"}
              </div>
            </div>

            <div style={styles.hr} />

            {daily.items?.length ? (
              <div style={styles.list}>
                {daily.items.map((it, idx) => (
                  <div key={idx} style={styles.item}>
                    <div style={styles.time}>{it.time}</div>
                    <div style={styles.act}>{it.activity}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.p}>Sin actividades registradas para hoy.</div>
            )}
          </>
        ) : (
          <div style={styles.p}>Sin datos.</div>
        )}
      </div>

      <div style={styles.footer}>
        <span style={styles.small}>PWA minimal · Google Sheets → Apps Script</span>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", fontFamily: "system-ui, Arial", padding: 16, maxWidth: 520, margin: "0 auto" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12 },
  nameBtn: { border: "none", background: "transparent", fontSize: 22, fontWeight: 700, cursor: "pointer", padding: 0 },
  meta: { fontSize: 14, opacity: 0.7 },
  card: { border: "1px solid #e5e5e5", borderRadius: 16, padding: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" },
  h1: { margin: 0, fontSize: 24 },
  p: { marginTop: 8, marginBottom: 12, opacity: 0.85, lineHeight: 1.35 },
  select: { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", fontSize: 16 },
  error: { background: "#fff2f2", border: "1px solid #ffd0d0", padding: 10, borderRadius: 12, marginTop: 10 },
  row: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" },
  label: { fontSize: 14, opacity: 0.7 },
  value: { fontSize: 16, fontWeight: 600 },
  hr: { height: 1, background: "#eee", margin: "14px 0" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  item: { display: "flex", gap: 12, alignItems: "baseline" },
  time: { width: 64, fontVariantNumeric: "tabular-nums", opacity: 0.8 },
  act: { flex: 1, fontSize: 16 },
  footer: { marginTop: 12, opacity: 0.6 },
  small: { fontSize: 12, opacity: 0.75, marginTop: 10 }
};