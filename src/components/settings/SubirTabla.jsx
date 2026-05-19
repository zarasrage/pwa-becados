import { useRef, useState } from "react";

// Si TABLA_SECRET_TOKEN está seteado en Netlify, ponlo aquí también.
// Si no está seteado, déjalo vacío — la función lo acepta igual.
const UPLOAD_TOKEN = "tabla_qx_2026";

export function SubirTabla({ onClose, T }) {
  const fileRef  = useRef(null);
  const [file,   setFile]   = useState(null);
  const [status, setStatus] = useState(null); // null | "uploading" | {ok,fecha,registros,con_diagnostico} | {error}

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setStatus(null); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    try {
      // Leer como base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes  = new Uint8Array(arrayBuffer);
      let binary   = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const headers = { "Content-Type": "application/json" };
      if (UPLOAD_TOKEN) headers["x-secret-token"] = UPLOAD_TOKEN;

      const res  = await fetch("/.netlify/functions/procesar-tabla", {
        method: "POST",
        headers,
        body: JSON.stringify({ fileContent: base64, filename: file.name }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { error: text }; }

      if (res.ok && data.ok) {
        setStatus({ ok: true, ...data });
      } else {
        setStatus({ error: data.error || data.body || text || `Error ${res.status}` });
      }
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 18, padding: "24px 20px", width: 290,
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)", fontFamily: "'Inter',sans-serif",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>🔪 Subir tabla quirúrgica</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 18, lineHeight: 1.5 }}>
          Selecciona el Excel con la fecha en el nombre<br/>(ej: <span style={{ color: T.sub }}>19-05-2026_tabla.xlsx</span>)
        </div>

        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />

        {/* Selector de archivo */}
        <button className="press" onClick={() => fileRef.current?.click()}
          style={{
            width: "100%", background: T.surface2,
            border: `2px dashed ${file ? T.accent + "80" : T.border}`,
            borderRadius: 12, padding: "14px", fontSize: 13, fontWeight: 500,
            color: file ? T.text : T.muted, cursor: "pointer", marginBottom: 14,
            textAlign: "center", boxSizing: "border-box",
          }}>
          {file
            ? <><span style={{ fontSize: 16 }}>📄</span> {file.name.length > 30 ? file.name.substring(0, 28) + "…" : file.name}</>
            : "+ Seleccionar archivo Excel"
          }
        </button>

        {/* Botón subir */}
        {file && status !== "uploading" && !status?.ok && (
          <button className="press" onClick={handleUpload}
            style={{
              width: "100%", background: T.accent, border: "none", borderRadius: 12,
              padding: "13px", fontSize: 13, fontWeight: 700, color: "#fff",
              cursor: "pointer", marginBottom: 10, boxSizing: "border-box",
            }}>
            Subir a Supabase
          </button>
        )}

        {/* Cargando */}
        {status === "uploading" && (
          <div style={{ textAlign: "center", padding: "12px 0 8px", color: T.muted, fontSize: 13 }}>
            <div style={{ marginBottom: 6, fontSize: 20 }}>⏳</div>
            Procesando… puede tardar hasta 30 seg
          </div>
        )}

        {/* Éxito */}
        {status?.ok && (
          <div style={{
            background: "#22c55e15", border: "1px solid #22c55e50",
            borderRadius: 12, padding: "14px", marginBottom: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 6 }}>✓ Subido correctamente</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 2 }}>📅 Fecha: <strong>{status.fecha}</strong></div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 2 }}>🔪 {status.registros} cirugías cargadas</div>
            <div style={{ fontSize: 12, color: T.sub }}>🧠 {status.con_diagnostico} con diagnóstico extraído</div>
          </div>
        )}

        {/* Error */}
        {status?.error && (
          <div style={{
            background: "#ef444415", border: "1px solid #ef444450",
            borderRadius: 12, padding: "12px", marginBottom: 10,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Error al subir</div>
            <div style={{ fontSize: 11, color: T.sub, wordBreak: "break-word" }}>{status.error}</div>
          </div>
        )}

        <button className="press" onClick={onClose}
          style={{
            width: "100%", background: "none", border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "9px", fontSize: 12, color: T.muted,
            cursor: "pointer", marginTop: 2, boxSizing: "border-box",
          }}>
          Cerrar
        </button>
      </div>
    </>
  );
}
