export function OfflineBanner({ isOnline, isStale, T }) {
  if (isOnline && !isStale) return null;
  const offline = !isOnline;
  return (
    <div className="fade" style={{
      marginBottom: 10,
      padding: "8px 12px",
      borderRadius: 10,
      background: offline ? "#2D1515" : T.surface2,
      border: `1px solid ${offline ? "#F8717140" : T.border}`,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: offline ? "#F87171" : T.muted,
    }}>
      {offline ? (
        <>
          <span>📵</span>
          <span>Sin conexión — mostrando datos guardados</span>
        </>
      ) : (
        <>
          <div style={{width:10,height:10,border:`1.5px solid ${T.muted}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
          <span>Actualizando…</span>
        </>
      )}
    </div>
  );
}
