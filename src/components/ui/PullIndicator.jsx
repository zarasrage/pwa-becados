import { PTR_THRESHOLD } from "../../hooks/usePullToRefresh.js";

export function PullIndicator({ pullY, triggered, T }) {
  if (pullY <= 4) return null;
  const progress = Math.min(pullY / PTR_THRESHOLD, 1);
  return (
    <div style={{
      position: "absolute",
      top: Math.max(-40, pullY - 52),
      left: "50%",
      transform: "translateX(-50%)",
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: T.surface,
      border: `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: progress,
      transition: "top 0.05s",
      zIndex: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      {triggered ? (
        <div style={{width:16,height:16,border:"2px solid #348FFF",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.6s linear infinite"}}/>
      ) : (
        <span style={{fontSize:16,transform:`rotate(${progress*180}deg)`,transition:"transform 0.1s",display:"block"}}>↓</span>
      )}
    </div>
  );
}
